import Phaser from '../phaser.js?v=6';
import { CONFIG, phaseForDay, phaseInfo } from '../config.js?v=6';
import { Game, syncDerived } from '../state.js?v=6';
import { Save } from '../save.js?v=6';
import { Audio } from '../audio.js?v=6';
import { addButton, addText } from '../ui.js?v=6';
import { attachAtmosphere, fadeIn } from '../fx.js?v=6';
import { leave, showHud } from '../flow.js?v=6';
import { addStudioRadio } from '../widgets.js?v=6';
import { ensureMorning, staticLevel } from '../logic.js?v=6';
import { makeTyper } from './type.js?v=6';

const BANNERS = new Set([1, 11, 21, 30]);

export class RadioScene extends Phaser.Scene {
  constructor() {
    super('Radio');
  }

  create() {
    this.left = false;
    this.actionButton = null;
    this.skipButton = null;
    this.skipAll = false;
    this.skipResolve = null;
    this.skipPromise = new Promise((resolve) => { this.skipResolve = resolve; });
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
    addButton(this, 250, 640, 'NOTEBOOK', () => {
      this.scene.get('HUD')?.toggleNote?.('notebook');
    }, { w: 210, h: 52, fontSize: '22px', depth: 30, swallowTap: true });
    syncDerived(state);
    state.lastScene = 'Radio';
    this.script = ensureMorning(state);
    Save.write(state);
    Audio.startMusic('lounge');
    // Static is the bed under a live broadcast. A day already heard (the usual
    // CONTINUE case) just shows the transcript, so no endless hiss.
    if (state.flags.radioHeard !== state.day) Audio.startStatic(staticLevel(phaseForDay(state.day), state));
    this.events.once('shutdown', () => {
      this.typer.dead = true;
      Audio.stopJingle();
      Audio.stopSponsor();
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
      this.addSkipButton();
      const jingle = Audio.playJingle(state.day);
      this.typer.skipWait = () => {
        Audio.stopJingle();
        Audio.stopSponsor();
      };
      await this.orSkip(jingle);
      if (this.typer.dead) return;
      const lines = this.script?.lines || state.lastBroadcast || [];
      const strip = (line) => String(line || '').replace(/^\{\{JINGLE\}\}\s*/, '');
      const cleaned = lines.map(strip);
      for (let i = 0; i < lines.length && !this.skipAll; i += 1) {
        if (this.typer.dead) return;
        const line = String(lines[i] || '');
        if (line.startsWith('{{JINGLE}}')) {
          await this.orSkip(Audio.playSponsor(state.day));
          if (this.typer.dead) return;
          if (this.skipAll) break;
        }
        Audio.staticBurst(phase.id === 'calm' ? 0.12 : phase.id === 'panic' ? 0.28 : 0.48);
        await this.orSkip(this.typer.say(this.line, strip(line), true));
        if (this.typer.dead) return;
        if (this.skipAll) break;
        await this.orSkip(this.typer.wait(180));
      }
      if (this.typer.dead) return;
      // SKIP BROADCAST: the whole transcript at once. The HUD's LAST BROADCAST note keeps it too.
      if (this.skipAll) this.line.setText(cleaned.join('\n\n'));
      this.skipButton?.destroy();
      this.skipButton = null;
      state.flags.radioHeard = state.day;
      state.lastBroadcast = cleaned;
      Save.write(state);
    } else {
      const lines = (this.script?.lines || state.lastBroadcast || []).map((line) => String(line).replace(/^\{\{JINGLE\}\}\s*/, ''));
      this.line.setText(lines.join('\n\n'));
    }
    if (this.typer.dead) return;
    this.showButton();
  }

  /** Oct 25 radio pacing: SKIP BROADCAST shows the whole broadcast at once. */
  addSkipButton() {
    if (this.skipButton) return;
    this.skipButton = addButton(this, 1030, 640, 'SKIP BROADCAST', () => this.skipBroadcast(), {
      w: 250, h: 52, fontSize: '20px', depth: 30, swallowTap: true,
    });
  }

  skipBroadcast() {
    if (this.skipAll || this.left) return;
    this.skipAll = true;
    globalThis.__PREPPER_RADIOSKIP = (globalThis.__PREPPER_RADIOSKIP || 0) + 1;
    this.typer.typer?.cancel();
    this.typer.skipWait = null;
    Audio.stopJingle();
    Audio.stopSponsor();
    this.skipButton?.destroy();
    this.skipButton = null;
    this.skipResolve?.();
  }

  /** Waits for p, or for SKIP BROADCAST, whichever comes first. */
  orSkip(p) {
    return Promise.race([Promise.resolve(p), this.skipPromise]);
  }

  showButton() {
    const status = this.sys?.settings?.status;
    if (this.left || this.actionButton) return;
    if (status === undefined || status > Phaser.Scenes.RUNNING) return;
    this.hint.setText('');
    this.skipButton?.destroy();
    this.skipButton = null;
    Audio.stopStatic(); // broadcast over: the hiss ends with it
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
