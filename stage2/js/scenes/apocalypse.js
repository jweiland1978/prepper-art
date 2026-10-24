import Phaser from '../phaser.js?v=7';
import { CONFIG } from '../config.js?v=7';
import { Game, roomLevel, syncDerived } from '../state.js?v=7';
import { Audio } from '../audio.js?v=7';
import { addButton, addPanel, addText } from '../ui.js?v=7';
import { attachAtmosphere, fadeIn, shake } from '../fx.js?v=7';
import { hideHud, leave } from '../flow.js?v=7';
import { fillLine } from '../logic.js?v=7';
import { APOCALYPSE_LINES } from '../data/survival.js?v=7';
import { makeTyper } from './type.js?v=7';

function cover(scene, key) {
  if (!scene.textures.exists(key)) return;
  const image = scene.add.image(640, 360, key).setDepth(0);
  const scale = Math.max(CONFIG.WIDTH / (image.width || CONFIG.WIDTH), CONFIG.HEIGHT / (image.height || CONFIG.HEIGHT));
  image.setScale(scale);
  image.setTint(0x9aa4b0);
}

export class ApocalypseScene extends Phaser.Scene {
  constructor() {
    super('Apocalypse');
  }

  create() {
    this.left = false;
    this.revealed = false;
    this.skipButton = null;
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    fadeIn(this, 320);
    this.cameras.main.setBackgroundColor('#070b12');
    hideHud(this);
    cover(this, 'bg-mainstreet');
    this.add.rectangle(640, 360, 1280, 720, 0x14080c, 0.58).setDepth(1);
    attachAtmosphere(this, { ash: true, depth: 8 });
    state.flags = state.flags || {};
    if (typeof state.flags.barricadeReady !== 'boolean') {
      state.flags.barricadeReady = roomLevel(state, 'barricade') >= 1;
    }
    state.lastScene = 'Apocalypse';
    this.lines = APOCALYPSE_LINES.map((line) => fillLine(line, state));
    this.line = addText(this, 640, 300, '', {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '26px',
      color: '#e6d7b8',
      originX: 0.5,
      originY: 0,
      align: 'center',
      wordWrap: { width: 980 },
      lineSpacing: 6,
    }).setDepth(24);
    addText(this, 640, 120, CONFIG.SHOW_BANNER, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '22px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(24);
    this.typer = makeTyper(this);
    Audio.stopMusic();
    Audio.stopRain();
    Audio.stopGenerator();
    Audio.startSirens();
    this.skipButton = addButton(this, 1100, 640, 'SKIP', () => this.showReveal(), {
      w: 160, h: 48, depth: 40,
    });
    this.events.once('shutdown', () => {
      this.typer.dead = true;
      Audio.stopJingle();
      Audio.stopSirens();
    });
    this.time.delayedCall(90000, () => this.showReveal());
    this.play().catch((error) => {
      console.error('[PREPPER] Apocalypse stopped.', error);
      this.showReveal();
    });
  }

  done() {
    return this.revealed || this.typer?.dead || !this.sys?.isActive();
  }

  async play() {
    const jingle = Audio.playJingle(30);
    this.typer.skipWait = () => Audio.stopJingle();
    await jingle;
    if (this.done()) return;
    for (let i = 0; i < this.lines.length; i += 1) {
      if (this.done()) return;
      Audio.staticBurst(0.4);
      shake(this, 220, 0.004);
      await this.typer.say(this.line, this.lines[i], true);
      if (this.done()) return;
      await this.typer.wait(200);
    }
    if (this.done()) return;
    shake(this, 900, 0.012);
    this.showReveal();
  }

  showReveal() {
    if (this.revealed || !this.sys?.isActive()) return;
    this.revealed = true;
    Audio.stopJingle();
    Audio.groan();
    shake(this, 700, 0.01);
    this.skipButton?.destroy();
    this.line?.setText('');
    const root = this.add.container(0, 0).setDepth(30);
    root.add(addPanel(this, 190, 180, 900, 400));
    root.add(addText(this, 640, 250, 'ZOMBIES.', {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '120px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }));
    root.add(addText(this, 640, 360, "Of course it's zombies. It's always zombies.", {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '24px',
      color: CONFIG.COLORS.text,
      originX: 0.5,
      originY: 0.5,
      align: 'center',
      wordWrap: { width: 760 },
    }));
    root.add(addButton(this, 640, 500, 'INTO THE BUNKER', () => this.goUnder(), {
      w: 360, h: 58, primary: true, depth: 32,
    }));
  }

  goUnder() {
    if (this.left) return;
    this.left = true;
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    state.mode = 'survival';
    state.survivalDay = 1;
    state.phase = 'end';
    state.actionsLeft = 0;
    state.ending = null;
    state.flags.apocalypseSeen = true;
    delete state.flags.scorecard;
    syncDerived(state);
    leave(this, 'Survival');
  }
}
