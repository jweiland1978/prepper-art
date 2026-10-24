import Phaser from '../phaser.js?v=5';
import { CONFIG, phaseForDay, phaseInfo } from '../config.js?v=5';
import { Game, syncDerived } from '../state.js?v=5';
import { Save } from '../save.js?v=5';
import { Audio } from '../audio.js?v=5';
import { addButton, addText } from '../ui.js?v=5';
import { attachAtmosphere, fadeIn } from '../fx.js?v=5';
import { leave, showHud } from '../flow.js?v=5';
import { addStudioRadio } from '../widgets.js?v=5';
import { ensureMorning, staticLevel } from '../logic.js?v=5';
import { makeTyper } from './type.js?v=5';

const BANNERS = new Set([1, 11, 21, 30]);

export class RadioScene extends Phaser.Scene {
  constructor() {
    super('Radio');
  }

  create() {
    this.left = false;
    this.actionButton = null;
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    fadeIn(this, 320);
    this.cameras.main.setBackgroundColor('#070b12');
    if (this.textures.exists('bg-bunker')) {
      this.add.image(640, 360, 'bg-bunker').setAlpha(0.45).setTint(0x1a120c);
    }
    attachAtmosphere(this, { depth: 4 });
    const scale = 0.72;
    this.radio = addStudioRadio(this, 640 - 260 * scale, 92);
    this.radio.root.setScale(scale).setDepth(6);
    this.radio.sweepTo(88.3, 900);
    addText(this, 640, 308, CONFIG.SHOW_BANNER, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '22px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(8);
    this.line = addText(this, 640, 400, '', {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '24px',
      color: '#e6d7b8',
      originX: 0.5,
      originY: 0,
      align: 'center',
      wordWrap: { width: 980 },
      lineSpacing: 6,
    }).setDepth(8);
    this.hint = addText(this, 640, 620, 'Tap to continue', {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '16px',
      color: CONFIG.COLORS.textMuted,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(8);
    this.tapToContinue = true;
    this.typer = makeTyper(this);
    showHud(this);
    syncDerived(state);
    state.lastScene = 'Radio';
    this.script = ensureMorning(state);
    Save.write(state);
    Audio.startMusic('lounge');
    Audio.startStatic(staticLevel(phaseForDay(state.day)));
    this.events.once('shutdown', () => {
      this.typer.dead = true;
      Audio.stopJingle();
      Audio.stopStatic();
    });
    this.play().catch((error) => {
      console.error('[PREPPER] Radio stopped.', error);
      this.showButton();
    });
  }

  async play() {
    const state = Game.state;
    const phase = phaseInfo(state.day);
    if (BANNERS.has(state.day) && state.flags.bannerDay !== state.day) {
      state.flags.bannerDay = state.day;
      Save.write(state);
      await this.typer.banner(phase.banner);
      if (this.typer.dead) return;
    }
    const heard = state.flags.radioHeard === state.day;
    if (!heard) {
      const jingle = Audio.playJingle(state.day);
      this.typer.skipWait = () => Audio.stopJingle();
      await jingle;
      if (this.typer.dead) return;
      const lines = this.script?.lines || state.lastBroadcast || [];
      for (let i = 0; i < lines.length; i += 1) {
        if (this.typer.dead) return;
        Audio.staticBurst(phase.id === 'calm' ? 0.12 : phase.id === 'panic' ? 0.28 : 0.48);
        await this.typer.say(this.line, lines[i], true);
        if (this.typer.dead) return;
        await this.typer.wait(180);
      }
      state.flags.radioHeard = state.day;
      state.lastBroadcast = (this.script?.lines || []).slice();
      Save.write(state);
    } else {
      this.line.setText((this.script?.lines || state.lastBroadcast || []).join('\n\n'));
    }
    if (this.typer.dead) return;
    this.showButton();
  }

  showButton() {
    const status = this.sys?.settings?.status;
    if (this.left || this.actionButton) return;
    if (status === undefined || status > Phaser.Scenes.RUNNING) return;
    this.hint.setText('');
    const state = Game.state;
    let label = 'START THE DAY';
    let key = 'Map';
    if (state.day >= CONFIG.PREP_DAYS) {
      label = 'STAY TUNED';
      key = 'Apocalypse';
    } else if ((state.actionsLeft ?? 0) <= 0) {
      label = 'CALL IT A NIGHT';
      key = 'NightSummary';
    }
    this.actionButton = addButton(this, 640, 640, label, () => {
      if (this.left) return;
      this.left = true;
      leave(this, key);
    }, { w: 320, h: 58, primary: true, depth: 12 });
  }
}
