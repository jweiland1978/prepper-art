import Phaser from '../phaser.js?v=5';
import { CONFIG } from '../config.js?v=5';
import { Game, touchState } from '../state.js?v=5';
import { Save } from '../save.js?v=5';
import { Audio } from '../audio.js?v=5';
import { addButton, addPanel, addText } from '../ui.js?v=5';
import { attachAtmosphere, fadeIn } from '../fx.js?v=5';
import { leave, showHud } from '../flow.js?v=5';
import {
  beginSurvivalDay,
  buildScore,
  resolveZombie,
  survivalGarage,
  survivalRation,
  survivalRepair,
} from '../logic.js?v=5';
import { zombieById } from '../data/survival.js?v=5';
import { showDanger, showNotice } from './cards.js?v=5';
import { canDistress, distressWord, followDistress, presentLaunch } from './trade.js?v=5';

function cover(scene, key) {
  if (!scene.textures.exists(key)) return;
  const image = scene.add.image(640, 420, key).setDepth(0);
  const scale = Math.max(CONFIG.WIDTH / (image.width || CONFIG.WIDTH), CONFIG.HEIGHT / (image.height || CONFIG.HEIGHT));
  image.setScale(scale).setTint(0x6a5a4a);
}

function addSurface(scene) {
  const ground = scene.add.graphics().setDepth(5);
  ground.fillStyle(0x241e18, 0.94);
  ground.fillRect(0, 78, 1280, 78);
  ground.fillStyle(0x3a332b, 1);
  ground.fillRect(0, 148, 1280, 14);
  for (let i = 0; i < 4; i += 1) {
    const fig = scene.add.graphics().setDepth(6);
    fig.fillStyle(0x100e0c, 0.92);
    fig.fillCircle(0, 0, 9);
    fig.fillRoundedRect(-7, 10, 14, 26, 3);
    fig.fillRect(-16, 14, 8, 16);
    fig.fillRect(8, 14, 8, 16);
    fig.fillRect(-6, 34, 5, 14);
    fig.fillRect(2, 34, 5, 14);
    fig.setPosition(-120 - i * 180, 112);
    scene.tweens.add({
      targets: fig,
      x: 1460,
      duration: 16000 + i * 2800,
      repeat: -1,
      delay: i * 500,
    });
  }
}

export class SurvivalScene extends Phaser.Scene {
  constructor() {
    super('Survival');
  }

  create() {
    this.left = false;
    this.busy = false;
    this.ui = null;
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    fadeIn(this, 280);
    this.cameras.main.setBackgroundColor('#070b12');
    cover(this, 'bg-bunker');
    this.add.rectangle(640, 460, 1280, 560, 0x070b12, 0.42).setDepth(1);
    addSurface(this);
    attachAtmosphere(this, { ash: true, depth: 10 });
    state.mode = 'survival';
    if (!state.survivalDay || state.survivalDay < 1) state.survivalDay = 1;
    if (state.survivalDay > CONFIG.SURVIVAL_DAYS) state.survivalDay = CONFIG.SURVIVAL_DAYS;
    state.phase = 'end';
    state.flags = state.flags || {};
    if (typeof state.flags.barricadeReady !== 'boolean') {
      state.flags.barricadeReady = false;
    }
    showHud(this);
    Audio.stopRain();
    Audio.startMusic('tense');
    Audio.startSirens();
    this.sheet = beginSurvivalDay(state);
    if (state.flags?.snowNight === `s${state.survivalDay || 1}`) Audio.startSnow();
    state.lastScene = 'Survival';
    Save.write(state);
    this.render();
    this.events.once('shutdown', () => {
      this.busy = true;
      Audio.stopSirens();
      Audio.stopSnow();
    });
  }

  render() {
    const status = this.sys?.settings?.status;
    if (status === undefined || status > Phaser.Scenes.RUNNING) return;
    this.ui?.destroy();
    const state = Game.state;
    const sheet = state?.flags?.survival || this.sheet;
    this.sheet = sheet;
    if (!sheet) {
      this.finish('loss');
      return;
    }
    const root = this.add.container(0, 0).setDepth(24);
    this.ui = root;
    root.add(addPanel(this, 80, 180, 1120, 390));
    root.add(addText(this, 640, 204, `BUNKER  ${state.survivalDay} / ${CONFIG.SURVIVAL_DAYS}`, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '20px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0,
    }));
    const body = sheet.lines.slice(-4).join('\n\n');
    root.add(addText(this, 120, 246, body, {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '18px',
      color: CONFIG.COLORS.text,
      originX: 0,
      originY: 0,
      wordWrap: { width: 1040 },
      lineSpacing: 4,
    }));

    const buttons = [];
    if (sheet.down) {
      buttons.push({ label: "THAT'S THE RUN", primary: true, onClick: () => this.finish('loss') });
    } else if (!sheet.zombieDone) {
      buttons.push({ label: 'AT THE HATCH', primary: true, onClick: () => this.openZombie() });
    } else if (!sheet.actionDone) {
      buttons.push({ label: 'REPAIR BARRICADE', onClick: () => this.act('repair') });
      buttons.push({ label: 'RATION', primary: true, onClick: () => this.act('ration') });
      buttons.push({ label: 'SCAVENGE GARAGE', onClick: () => this.act('garage') });
    } else {
      const last = (state.survivalDay || 1) >= CONFIG.SURVIVAL_DAYS;
      buttons.push({
        label: last ? 'THAT IS TEN' : 'END THE DAY',
        primary: true,
        onClick: () => this.endDay(),
      });
    }
    if (!sheet.down && canDistress(state)) {
      buttons.push({ label: 'DISTRESS', onClick: () => this.fireDistress() });
    }
    const bw = buttons.length >= 4 ? 200 : buttons.length > 2 ? 260 : 320;
    const gap = 16;
    const total = buttons.length * bw + (buttons.length - 1) * gap;
    let x = 640 - total / 2 + bw / 2;
    const fontSize = buttons.length >= 4 ? '16px' : '22px';
    buttons.forEach((button) => {
      root.add(addButton(this, x, 640, button.label, () => {
        if (this.left || this.busy) return;
        button.onClick();
      }, { w: bw, h: 54, primary: !!button.primary, depth: 26, fontSize }));
      x += bw + gap;
    });
  }

  openZombie() {
    if (this.busy || this.left || this.sheet?.zombieDone) return;
    const event = zombieById(this.sheet.zombieId);
    const ask = () => {
      if (this.left || !this.sys?.isActive()) return;
      this.busy = true;
      Audio.groan();
      showDanger(this, {
        face: event.face,
        text: event.text,
        onPick: (action) => {
          this.busy = false;
          if (this.left || !this.sys?.isActive()) return;
          if (action === 'light') {
            this.busy = true;
            presentLaunch(this, {
              mode: 'light',
              event: { ...event, zombie: true },
              where: 'survival',
            }).then((result) => {
              this.busy = false;
              if (this.left || !this.sys?.isActive()) return;
              if (!result?.ok || !result.tactical) {
                ask();
                return;
              }
              const sheet = Game.state.flags.survival;
              sheet.zombieDone = true;
              sheet.lines.push(result.text);
              this.sheet = sheet;
              Save.write(Game.state);
              this.render();
            });
            return;
          }
          resolveZombie(action, Game.state);
          this.sheet = Game.state.flags.survival;
          Save.write(Game.state);
          this.render();
        },
      });
    };
    ask();
  }

  fireDistress() {
    if (this.busy || this.left) return;
    const state = Game.state;
    if (!canDistress(state)) return;
    this.busy = true;
    showNotice(this, {
      kicker: 'DISTRESS',
      title: 'Fire a distress rocket',
      body: `One rocket and one action. Odds: ${distressWord(state)}.`,
      buttons: [
        { label: 'NOT NOW', onClick: () => { this.busy = false; } },
        {
          label: 'LIGHT IT',
          primary: true,
          onClick: () => {
            presentLaunch(this, { mode: 'distress', where: 'survival' }).then((result) => {
              if (this.left || !this.sys?.isActive()) return;
              followDistress(this, result, () => {
                this.busy = false;
                this.sheet = Game.state?.flags?.survival;
                Save.write(Game.state);
                this.render();
              });
            });
          },
        },
      ],
    });
  }

  act(kind) {
    if (this.busy || this.left || this.sheet?.actionDone) return;
    this.busy = true;
    const state = Game.state;
    if (kind === 'repair') survivalRepair(state);
    else if (kind === 'ration') survivalRation(state);
    else survivalGarage(state);
    this.sheet = state.flags.survival;
    this.busy = false;
    Save.write(state);
    this.render();
  }

  endDay() {
    if (this.busy || this.left) return;
    const state = Game.state;
    if ((state.survivalDay || 1) >= CONFIG.SURVIVAL_DAYS) {
      this.finish('win');
      return;
    }
    state.survivalDay += 1;
    this.sheet = beginSurvivalDay(state);
    if (state.flags?.snowNight === `s${state.survivalDay || 1}`) Audio.startSnow();
    else Audio.stopSnow();
    touchState();
    Save.write(state);
    this.render();
  }

  finish(kind) {
    if (this.left) return;
    this.left = true;
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    state.ending = kind;
    buildScore(state);
    leave(this, 'Ending');
  }
}
