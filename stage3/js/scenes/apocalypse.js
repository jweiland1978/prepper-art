import Phaser from '../phaser.js?v=6';
import { CONFIG } from '../config.js?v=6';
import { Game, roomLevel, syncDerived } from '../state.js?v=6';
import { Audio } from '../audio.js?v=6';
import { addButton, addPanel, addText } from '../ui.js?v=6';
import { attachAtmosphere, coverEnd, fadeIn, paintApocSky, shake } from '../fx.js?v=6';
import { hideHud, leave } from '../flow.js?v=6';
import { fillLine } from '../logic.js?v=6';
import { apocalypseName, apocalypseOf } from '../rumors.js?v=6';
import { apocalypseLinesFor, revealNoteFor } from '../data/survival.js?v=6';
import { makeTyper } from './type.js?v=6';

function cueApocAudio(kind) {
  Audio.stopMusic();
  Audio.stopRain();
  Audio.stopGenerator();
  Audio.stopSirens();
  Audio.stopSnow();
  if (kind === 'zombies') Audio.startSirens();
  else if (kind === 'solarflare') Audio.startStatic(0.18);
  else if (kind === 'robots') Audio.startGenerator();
  else if (kind === 'meteor' || kind === 'bigmoon') Audio.startSnow();
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
    const kind = apocalypseOf(state);
    coverEnd(this, state, { tint: 0x9aa4b0, fallback: 'bg-mainstreet' });
    this.add.rectangle(640, 360, 1280, 720, 0x14080c, 0.5).setDepth(1);
    paintApocSky(this, state);
    const weather = kind === 'zombies' || kind === 'meteor' || kind === 'robots'
      ? { ash: true, depth: 8 }
      : { depth: 8 };
    attachAtmosphere(this, weather);
    state.flags = state.flags || {};
    if (typeof state.flags.barricadeReady !== 'boolean') {
      state.flags.barricadeReady = roomLevel(state, 'barricade') >= 1;
    }
    state.lastScene = 'Apocalypse';
    this.kind = kind;
    this.lines = apocalypseLinesFor(kind).map((line) => fillLine(line, state));
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
    cueApocAudio(kind);
    this.skipButton = addButton(this, 1100, 640, 'SKIP', () => this.showReveal(), {
      w: 160, h: 48, depth: 40,
    });
    this.events.once('shutdown', () => {
      this.typer.dead = true;
      Audio.stopJingle();
      Audio.stopSirens();
      Audio.stopStatic();
      Audio.stopGenerator();
      Audio.stopSnow();
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
      const n = this.kind === 'meteor' || this.kind === 'solarflare' ? 0.006 : 0.004;
      shake(this, this.kind === 'meteor' ? 320 : 220, n);
      await this.typer.say(this.line, this.lines[i], true);
      if (this.done()) return;
      await this.typer.wait(200);
    }
    if (this.done()) return;
    shake(this, this.kind === 'meteor' ? 1100 : 900, this.kind === 'meteor' ? 0.016 : 0.012);
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
    const state = Game.state;
    const kind = this.kind || apocalypseOf(state);
    const name = apocalypseName(kind);
    const called = !!(state?.guess && state.guess === kind);
    const root = this.add.container(0, 0).setDepth(30);
    root.add(addPanel(this, 190, 160, 900, called ? 440 : 400));
    root.add(addText(this, 640, 210, `IT WAS THE ${name.toUpperCase()}.`, {
      fontFamily: CONFIG.FONTS.display,
      fontSize: name.length > 10 ? '56px' : '72px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
      align: 'center',
      wordWrap: { width: 820 },
    }));
    root.add(addText(this, 640, 320, revealNoteFor(kind), {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '24px',
      color: CONFIG.COLORS.text,
      originX: 0.5,
      originY: 0.5,
      align: 'center',
      wordWrap: { width: 760 },
    }));
    if (called) {
      root.add(addText(this, 640, 390, 'You called it.', {
        fontFamily: CONFIG.FONTS.radio,
        fontSize: '22px',
        color: CONFIG.COLORS.orangeCss,
        originX: 0.5,
        originY: 0.5,
      }));
    }
    root.add(addButton(this, 640, called ? 500 : 480, 'INTO THE BUNKER', () => this.goUnder(), {
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
