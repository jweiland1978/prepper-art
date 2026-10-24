import Phaser from '../phaser.js?v=6';
import { CONFIG } from '../config.js?v=6';
import { Game } from '../state.js?v=6';
import { Audio } from '../audio.js?v=6';
import { addButton, addPanel, addText } from '../ui.js?v=6';
import { attachAtmosphere, fadeIn } from '../fx.js?v=6';
import { goTo, hideHud } from '../flow.js?v=6';
import { buildScore, downLine, EARLY_END_LINE } from '../logic.js?v=6';
import { LOSS_HINT, WIN_LINES } from '../data/survival.js?v=6';
import { makeTyper } from './type.js?v=6';

function cover(scene) {
  const key = scene.textures.exists('bg-title') ? 'bg-title' : 'bg-mainstreet';
  if (!scene.textures.exists(key)) return;
  const image = scene.add.image(640, 360, key).setDepth(0);
  const scale = Math.max(CONFIG.WIDTH / (image.width || CONFIG.WIDTH), CONFIG.HEIGHT / (image.height || CONFIG.HEIGHT));
  image.setScale(scale);
  image.setTint(0x6a5344);
}

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create() {
    this.left = false;
    this.shown = false;
    this.skipButton = null;
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    fadeIn(this, 360);
    this.cameras.main.setBackgroundColor('#070b12');
    hideHud(this);
    cover(this);
    this.add.rectangle(640, 360, 1280, 720, 0x140c08, 0.62).setDepth(1);
    attachAtmosphere(this, { ash: state.ending !== 'early', depth: 6 });
    state.lastScene = 'Ending';
    if (!state.ending) state.ending = 'loss';
    this.card = buildScore(state);
    Audio.stopMusic();
    Audio.stopSirens();
    Audio.stopRain();
    Audio.stopGenerator();
    this.voice = addText(this, 640, 250, '', {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '26px',
      color: '#e6d7b8',
      originX: 0.5,
      originY: 0,
      align: 'center',
      wordWrap: { width: 980 },
      lineSpacing: 8,
    }).setDepth(20);
    this.typer = makeTyper(this);
    this.skipButton = addButton(this, 1100, 80, 'SKIP', () => this.showScore(true), {
      w: 140, h: 44, depth: 40,
    });
    this.events.once('shutdown', () => {
      this.typer.dead = true;
      Audio.stopStatic();
    });
    this.time.delayedCall(45000, () => this.showScore(true));
    this.play().catch((error) => {
      console.error('[PREPPER] Ending stopped.', error);
      this.showScore(true);
    });
  }

  async play() {
    const state = Game.state;
    if (state.ending === 'win') {
      for (let i = 0; i < WIN_LINES.length; i += 1) {
        if (this.shown || this.typer.dead) return;
        Audio.staticBurst(0.12);
        await this.typer.say(this.voice, WIN_LINES[i], true);
        if (this.shown || this.typer.dead) return;
        await this.typer.wait(240);
      }
    } else {
      const name = state.name || CONFIG.DEFAULT_NAME;
      await this.typer.say(this.voice, `${name}.`, true);
      if (this.shown || this.typer.dead) return;
      Audio.staticBurst(0.9);
      Audio.startStatic(0.22);
      await this.typer.wait(1100);
      Audio.stopStatic();
      if (this.shown || this.typer.dead) return;
      const rest = [LOSS_HINT];
      if (state.ending === 'early') rest.push(EARLY_END_LINE);
      else if (state.flags?.downReason) rest.push(downLine(state.flags.downReason));
      for (let i = 0; i < rest.length; i += 1) {
        if (this.shown || this.typer.dead) return;
        await this.typer.say(this.voice, rest[i], true);
        if (this.shown || this.typer.dead) return;
        await this.typer.wait(200);
      }
    }
    if (!this.shown) this.showScore(false);
  }

  showScore(instant) {
    if (this.shown || !this.sys?.isActive()) return;
    this.shown = true;
    Audio.stopStatic();
    this.skipButton?.destroy();
    this.voice?.setText('');
    const card = this.card;
    const root = this.add.container(0, 0).setDepth(24);
    root.add(addPanel(this, 170, 120, 940, 460));
    const kicker = Game.state.ending === 'win'
      ? 'TEN DAYS LATER'
      : Game.state.ending === 'early'
        ? 'BEFORE DAY 30'
        : 'SIGNAL LOST';
    root.add(addText(this, 640, 146, kicker, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '18px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0,
    }));
    const rank = addText(this, 640, 186, instant ? card.rank : '', {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '64px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0,
    });
    root.add(rank);

    const rows = [
      ['Days survived', card.days, (value) => String(Math.round(value))],
      ['Food left', card.food, (value) => String(Math.round(value))],
      ['Rooms built', card.rooms, (value) => String(Math.round(value))],
      ['Weapon used', card.weapon, null],
      ['Called it', card.guessed ? 'Barricade was up' : 'No barricade', null],
    ];
    const reduce = !!Game.settings?.reduceEffects || instant;
    rows.forEach((row, index) => {
      const y = 280 + index * 46;
      root.add(addText(this, 280, y, row[0], {
        fontFamily: CONFIG.FONTS.heading,
        fontSize: '22px',
        color: CONFIG.COLORS.textMuted,
        originX: 0,
        originY: 0.5,
      }));
      const value = addText(this, 980, y, row[2] ? '0' : String(row[1]), {
        fontFamily: CONFIG.FONTS.heading,
        fontSize: '26px',
        color: CONFIG.COLORS.text,
        originX: 1,
        originY: 0.5,
      });
      root.add(value);
      if (!row[2]) return;
      if (reduce) {
        value.setText(row[2](row[1]));
        return;
      }
      const counter = { v: 0 };
      this.time.delayedCall(180 * index, () => {
        if (!value.active) return;
        this.tweens.add({
          targets: counter,
          v: row[1],
          duration: 700,
          ease: 'Quad.easeOut',
          onUpdate: () => value.setText(row[2](counter.v)),
          onComplete: () => value.setText(row[2](row[1])),
        });
      });
    });
    if (!reduce) this.time.delayedCall(1100, () => { if (rank.active) rank.setText(card.rank); });

    const actions = [
      ['PLAY AGAIN', () => this.exit('NameEntry')],
      ['TITLE', () => this.exit('Title')],
      ['CREDITS', () => this.exit('Credits', { from: 'Ending' })],
    ];
    actions.forEach((action, index) => {
      addButton(this, 360 + index * 280, 650, action[0], action[1], {
        w: 250, h: 54, primary: index === 0, depth: 30,
      });
    });
  }

  exit(key, data) {
    if (this.left) return;
    this.left = true;
    goTo(this, key, data);
  }
}
