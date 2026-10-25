import Phaser from '../phaser.js?v=2';
import { CONFIG } from '../config.js?v=2';
import { Game, changeStat, cleanName, newRun } from '../state.js?v=2';
import { applyStartPerk } from '../unlocks.js?v=2';
import { Save } from '../save.js?v=2';
import { Audio } from '../audio.js?v=2';
import { addText, runTypewriter, readHold } from '../ui.js?v=2';
import { attachAtmosphere } from '../fx.js?v=2';
import { beginScene, goTo } from '../flow.js?v=2';
import { addStudioRadio } from '../widgets.js?v=2';

const OFFICIAL = 'This is an official message for the residents of Lake Orwell. In thirty days, the world will end. Officials are confident it will be caused by—';

const HOST = [
  "Well. That was cheerful. If you're still listening, this is The Last Shift on 88.3.",
  "They cut the how. They always cut the how. I'd complain, but the form is in a drawer I lost in 1997.",
  "Day one, Lake Orwell. Thirty days on the clock. I'm in a basement, and the dog already has a better plan than I do.",
];

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('Intro');
  }

  create(data) {
    this.dead = false;
    this.left = false;
    this.events.once('shutdown', () => {
      this.dead = true;
      this.typer?.cancel();
      Audio.stopJingle();
    });
    const state = newRun(cleanName(data?.name));
    applyStartPerk(state || Game.state, data?.perk || '', changeStat);
    beginScene(this);
    this.cameras.main.setBackgroundColor('#05060a');
    attachAtmosphere(this, { depth: 6 });

    this.radio = addStudioRadio(this, 380, 48);
    this.radio.root.setDepth(10);
    this.banner = addText(this, 640, 390, '', {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '42px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(12);
    this.line = addText(this, 640, 500, '', {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '24px',
      color: '#f0e2c4',
      originX: 0.5,
      originY: 0,
      align: 'center',
      wordWrap: { width: 920 },
    }).setDepth(12);
    this.hint = addText(this, 640, 680, 'Tap to continue', {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '16px',
      color: CONFIG.COLORS.textMuted,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(12);

    this.input.on('pointerdown', () => this.skip());
    this.play().catch((error) => console.error('[PREPPER] Intro stopped.', error));
  }

  async play() {
    const sweep = this.radio.sweepTo(88.3, 1400);
    this.skipWait = () => sweep.skip();
    await sweep;
    if (this.dead) return;
    const jingle = Audio.playJingle(1);
    this.skipWait = () => Audio.stopJingle();
    await jingle;
    if (this.dead) return;
    await this.say(OFFICIAL, false);
    if (this.dead) return;
    Audio.staticBurst(0.65);
    this.tweens.add({ targets: this.line, alpha: 0.15, duration: 70, yoyo: true, repeat: 3 });
    await this.wait(640);
    if (this.dead) return;
    this.line.setAlpha(1).setText('').setColor('#d9d0c1');
    this.banner.setText(CONFIG.SHOW_BANNER);
    Audio.startMusic('lounge');
    for (let i = 0; i < HOST.length; i += 1) {
      if (this.dead) return;
      if (i > 0) Audio.staticBurst(0.16);
      await this.say(HOST[i], true);
      if (this.dead) return;
      await this.wait(readHold(HOST[i], true));
    }
    if (this.dead) return;
    this.finish();
  }

  say(text, blips) {
    this.line.setFontFamily(blips ? '"Special Elite", serif' : '"Oswald", sans-serif');
    this.line.setColor(blips ? '#d9d0c1' : '#f6e7c1');
    this.line.setText('');
    return new Promise((resolve) => {
      this.typer = runTypewriter(this, this.line, text, () => {
        this.skipWait = null;
        resolve();
      }, blips);
      this.skipWait = () => this.typer.skip();
    });
  }

  wait(ms) {
    return new Promise((resolve) => {
      const timer = this.time.delayedCall(ms, () => {
        this.skipWait = null;
        resolve();
      });
      this.skipWait = () => {
        timer.remove(false);
        this.skipWait = null;
        resolve();
      };
    });
  }

  skip() {
    Audio.unlock();
    this.skipWait?.();
  }

  finish() {
    if (this.left || this.dead) return;
    this.left = true;
    const state = Game.state;
    state.introSeen = true;
    state.lastScene = 'Radio';
    state.lastBroadcast = HOST.slice();
    Save.write(state);
    goTo(this, 'Radio');
  }
}
