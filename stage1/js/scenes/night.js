import Phaser from '../phaser.js?v=4';
import { CONFIG, phaseForDay } from '../config.js?v=4';
import { Game, roomLevel, syncDerived } from '../state.js?v=4';
import { Save } from '../save.js?v=4';
import { Audio } from '../audio.js?v=4';
import { addButton, addText } from '../ui.js?v=4';
import { attachAtmosphere, fadeIn } from '../fx.js?v=4';
import { endRun, leave, showHud } from '../flow.js?v=4';
import { applyDeltas, buildNightReport, resolveDanger } from '../logic.js?v=4';
import { showDanger, showNotice } from './cards.js?v=4';
import { makeTyper } from './type.js?v=4';

export class NightScene extends Phaser.Scene {
  constructor() {
    super('NightSummary');
  }

  create() {
    this.done = false;
    this.sleepButton = null;
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    fadeIn(this, 320);
    this.cameras.main.setBackgroundColor('#05060a');
    if (this.textures.exists('bg-bunker')) {
      const image = this.add.image(640, 360, 'bg-bunker').setDepth(0).setAlpha(0.35).setTint(0x0c1018);
      const scale = Math.max(CONFIG.WIDTH / (image.width || CONFIG.WIDTH), CONFIG.HEIGHT / (image.height || CONFIG.HEIGHT));
      image.setScale(scale);
    }
    this.add.rectangle(640, 360, 1280, 720, 0x05060a, 0.55).setDepth(1);
    const lamp = this.add.graphics().setDepth(2);
    lamp.fillStyle(0xffc27a, 0.16);
    lamp.fillCircle(640, 300, 220);
    lamp.fillStyle(0xffe0b0, 0.08);
    lamp.fillCircle(640, 300, 120);
    attachAtmosphere(this, { depth: 4 });
    addText(this, 640, 110, 'NIGHT SUMMARY', {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '48px',
      color: CONFIG.COLORS.text,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(6);
    this.line = addText(this, 180, 160, '', {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '22px',
      color: '#e6d7b8',
      originX: 0,
      originY: 0,
      wordWrap: { width: 920 },
      lineSpacing: 8,
    }).setDepth(6);
    this.typer = makeTyper(this);
    showHud(this);
    state.lastScene = 'NightSummary';
    this.report = buildNightReport(state);
    Save.write(state);
    Audio.startMusic('lounge');
    Audio.stopRain();
    Audio.stopSirens();
    if (roomLevel(state, 'generator') >= 1 && phaseForDay(state.day) !== 'end') Audio.startGenerator();
    this.events.once('shutdown', () => {
      this.typer.dead = true;
      Audio.stopGenerator();
    });
    this.play().catch((error) => {
      console.error('[PREPPER] Night stopped.', error);
      this.showSleep();
    });
  }

  async play() {
    const report = this.report;
    const opener = report.lines.slice();
    if (report.dangerResolved && report.dangerResult) opener.push(report.dangerResult);
    await this.typer.say(this.line, opener.join('\n\n'), true);
    if (this.typer.dead) return;
    await this.typer.wait(500);
    if (report.danger && !report.dangerResolved && (Game.state?.stats.health ?? 0) > 0) {
      await this.faceDanger();
      if (this.typer.dead) return;
      if (report.dangerResult) opener.push(report.dangerResult);
    }
    opener.push(report.signoff);
    await this.typer.say(this.line, opener.join('\n\n'), true);
    if (this.typer.dead) return;
    this.showSaved();
    this.showSleep();
  }

  faceDanger() {
    const report = this.report;
    return new Promise((resolve) => {
      showDanger(this, {
        face: report.danger.face,
        text: report.danger.text,
        onPick: (action) => {
          const state = Game.state;
          const outcome = resolveDanger(action, state, report.danger.bias);
          const gained = applyDeltas(state, outcome.deltas);
          report.dangerResolved = true;
          report.dangerResult = gained ? `${outcome.text}\n${gained}` : outcome.text;
          report.down = state.stats.health <= 0;
          Save.write(state);
          showNotice(this, {
            kicker: 'NIGHT',
            title: outcome.ok ? 'IT WORKED' : 'IT DID NOT',
            body: report.dangerResult,
            button: 'CONTINUE',
            onClose: resolve,
          });
        },
      });
    });
  }

  showSaved() {
    const ok = Save.write(Game.state);
    Audio.cassette();
    const icon = this.add.graphics().setDepth(8);
    icon.fillStyle(0xe6d3ae, 1);
    icon.fillRoundedRect(-18, -12, 36, 24, 3);
    icon.fillStyle(0x1a120c, 1);
    icon.fillCircle(-6, 0, 4);
    icon.fillCircle(6, 0, 4);
    const wrap = this.add.container(560, 640, [icon]).setDepth(8);
    this.tweens.add({ targets: wrap, angle: 360, duration: 700 });
    addText(this, 600, 640, ok ? 'Saved' : 'Not saved. The night still ends.', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '18px',
      color: CONFIG.COLORS.textMuted,
      originX: 0,
      originY: 0.5,
    }).setDepth(8);
  }

  showSleep() {
    if (this.done || this.sleepButton || !this.sys?.isActive()) return;
    const down = (Game.state?.stats.health ?? 1) <= 0 || this.report?.down;
    this.sleepButton = addButton(this, 980, 640, down ? "THAT'S THE RUN" : 'SLEEP', () => {
      if (this.done) return;
      this.done = true;
      if ((Game.state?.stats.health ?? 1) <= 0) {
        endRun(this);
        return;
      }
      this.advance();
    }, { w: 250, h: 54, primary: true, depth: 12 });
  }

  advance() {
    const state = Game.state;
    state.day += 1;
    state.actionsLeft = CONFIG.ACTIONS_PER_DAY;
    state.flags.trip = null;
    syncDerived(state);
    if (state.day > CONFIG.PREP_DAYS) {
      leave(this, 'Apocalypse');
      return;
    }
    leave(this, 'Radio');
  }
}
