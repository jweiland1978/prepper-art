import Phaser from '../phaser.js?v=3';
import { CONFIG, phaseForDay } from '../config.js?v=3';
import { Game, changeStat, syncDerived } from '../state.js?v=3';
import { generatorOn, isActive, maybeGuardLoss, recruited } from '../crew.js?v=3';
import { Save } from '../save.js?v=3';
import { Audio } from '../audio.js?v=3';
import { addButton, addText } from '../ui.js?v=3';
import { attachAtmosphere, fadeIn } from '../fx.js?v=3';
import { endRun, leave, showHud } from '../flow.js?v=3';
import { nickCrew, rollKnock, settleCrew } from '../crew.js?v=3';
import { applyDeltas, buildNightReport, resolveDanger } from '../logic.js?v=3';
import { offerTip, presentRecruit, showDanger, showNotice } from './cards.js?v=3';
import { crackBeer } from '../trade.js?v=3';
import { offerHeist } from '../heist.js?v=3';
import { hatchTrader, openTrade, presentLaunch } from './trade.js?v=3';
import { makeTyper } from './type.js?v=3';

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
    this.knockId = rollKnock(state);
    Save.write(state);
    Audio.startMusic('lounge');
    Audio.stopRain();
    Audio.stopSirens();
    if (generatorOn(state) && phaseForDay(state.day) !== 'end') Audio.startGenerator();
    this.beerButton = null;
    this.events.once('shutdown', () => {
      this.typer.dead = true;
      Audio.stopGenerator();
      Audio.stopSnow();
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
    if (report.snow) {
      Audio.stopRain();
      Audio.startSnow();
    }
    if (report.danger && !report.dangerResolved && (Game.state?.stats.health ?? 0) > 0) {
      await this.faceDanger();
      if (this.typer.dead) return;
      if (report.dangerResult) opener.push(report.dangerResult);
    }
    const lossLine = await this.faceLoss();
    if (this.typer.dead) return;
    if (lossLine) opener.push(lossLine);
    if (report.prompt && !report.promptResolved) {
      const picked = await this.facePrompt();
      if (this.typer.dead) return;
      if (picked) opener.push(picked);
    }
    if (report.recruit) {
      const joined = await presentRecruit(this, report.recruit, { source: 'knock' });
      if (this.typer.dead) return;
      if (joined) opener.push(joined);
      report.recruit = null;
    }
    if (report.trade) {
      const traded = await this.faceHatch();
      if (this.typer.dead) return;
      if (traded) opener.push(traded);
      report.trade = false;
    }
    opener.push(report.signoff);
    await this.typer.say(this.line, opener.join('\n\n'), true);
    if (this.typer.dead) return;
    if ((Game.state?.stats.health ?? 0) > 0) {
      const knockLine = await this.maybeKnock();
      if (this.typer.dead) return;
      const extra = settleCrew(Game.state);
      const job = await offerHeist(this);
      if (this.typer.dead) return;
      const tail = [knockLine, ...extra, job].filter(Boolean);
      if (tail.length) this.line.setText(`${this.line.text}\n\n${tail.join('\n\n')}`);
      Save.write(Game.state);
    }
    this.showSaved();
    this.showSleep();
  }

  faceLoss() {
    const state = Game.state;
    const loss = state?.flags?.freshLoss || this.report?.loss;
    if (!loss?.line) return Promise.resolve('');
    return new Promise((resolve) => {
      showNotice(this, {
        kicker: 'NIGHT',
        title: loss.name || 'Gone',
        portrait: loss.portrait || '',
        grey: true,
        body: loss.line,
        button: 'CONTINUE',
        onClose: () => {
          if (state?.flags) {
            state.flags.freshLoss = null;
            state.flags.lossTold = true;
          }
          if (this.report) this.report.loss = null;
          Save.write(state);
          offerTip(this, 'loss', () => resolve(loss.line));
        },
      });
    });
  }

  facePrompt() {
    const prompt = this.report?.prompt;
    if (!prompt) return Promise.resolve('');
    const options = prompt.options?.length ? prompt.options : [];
    return new Promise((resolve) => {
      showNotice(this, {
        kicker: 'TONIGHT',
        title: 'CHOOSE',
        body: prompt.text || '',
        buttons: options.map((option, index) => ({
          label: option.label || 'LET IT GO',
          primary: index === 0,
          onClick: () => {
            const state = Game.state;
            let extra = option.text || '';
            if (option.effect === 'health') {
              const folks = recruited(state).filter((row) => isActive(state, row.id));
              const who = folks[Math.floor(Math.random() * folks.length)];
              if (who && state.crew[who.id]) {
                const body = state.crew[who.id];
                body.health = Math.max(0, (body.health || 0) - 1);
                if (body.health <= 0) body.laidUp = Math.max(body.laidUp || 0, CONFIG.CREW.laidUpDays || 2);
                extra = `${extra}\n\n${who.name} is down a point of health.`;
              }
            } else if (option.effect === 'morale') {
              const got = changeStat('morale', -1);
              if (got) extra = `${extra}\n\nMorale ${got}.`;
            }
            this.report.promptResolved = true;
            Save.write(state);
            resolve(extra);
          },
        })),
      });
    });
  }

  faceHatch() {
    return new Promise((resolve) => {
      openTrade(this, {
        trader: hatchTrader(),
        onDone: (line) => resolve(line || ''),
      });
    });
  }

  maybeKnock() {
    if (!this.knockId) return Promise.resolve('');
    const id = this.knockId;
    this.knockId = null;
    return presentRecruit(this, id, { source: 'knock' });
  }

  faceDanger() {
    const report = this.report;
    return new Promise((resolve) => {
      const ask = () => {
        if (!this.sys?.isActive()) return;
        if (Game.state?.flags) Game.state.flags.dangerWhere = 'night';
        showDanger(this, {
          face: report.danger.face,
          text: report.danger.text,
          onPick: (action) => {
            const state = Game.state;
            state.flags.dangerWhere = 'night';
            if (action === 'light') {
              presentLaunch(this, { mode: 'light', event: report.danger, where: 'night' }).then((result) => {
                if (!this.sys?.isActive()) return;
                if (!result?.tactical) {
                  ask();
                  return;
                }
                report.dangerResolved = true;
                report.dangerResult = result.text;
                report.down = state.stats.health <= 0;
                if (state.flags) state.flags.hideBonus = false;
                Save.write(state);
                showNotice(this, {
                  kicker: 'NIGHT',
                  title: 'IT WORKED',
                  body: report.dangerResult,
                  button: 'CONTINUE',
                  onClose: resolve,
                });
              });
              return;
            }
            const outcome = resolveDanger(action, state, report.danger.bias);
            if (!outcome.ok && (outcome.deltas.morale || 0) >= 0) outcome.deltas.morale = (outcome.deltas.morale || 0) - 1;
            const nick = !outcome.ok ? nickCrew(state, 1) : '';
            const gained = applyDeltas(state, outcome.deltas);
            report.dangerResolved = true;
            report.dangerResult = [outcome.text, gained, nick].filter(Boolean).join('\n');
            report.down = state.stats.health <= 0;
            if (state.flags) state.flags.hideBonus = false;
            const looter = /looter/i.test(report.danger?.id || '') || /looter/i.test(report.danger?.face || '');
            if (!outcome.ok && looter) maybeGuardLoss(state);
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
      };
      ask();
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
    const state = Game.state;
    const beerKey = state?.mode === 'survival' ? `s${state.survivalDay || 1}` : `d${state?.day || 1}`;
    if ((state?.stash?.beer || 0) > 0 && state.flags?.beerNight !== beerKey) {
      this.beerButton = addButton(this, 220, 640, 'CRACK ONE', () => {
        const result = crackBeer(Game.state, 'night');
        if (result.ok) Audio.crackCan();
        Save.write(Game.state);
        if (this.beerButton?.active) this.beerButton.destroy();
        showNotice(this, {
          kicker: 'PINE LAKE LIGHT',
          title: 'Silver can',
          body: result.line,
          button: 'OK',
        });
      }, { w: 200, h: 48, depth: 12 });
    }
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
    let actions = CONFIG.ACTIONS_PER_DAY;
    if (state.flags.wallWon) {
      actions -= 1;
      state.flags.wallWon = false;
    }
    state.actionsLeft = actions;
    state.flags.trip = null;
    syncDerived(state);
    if (state.day > CONFIG.PREP_DAYS) {
      leave(this, 'Apocalypse');
      return;
    }
    leave(this, 'Radio');
  }
}
