import Phaser from '../phaser.js?v=7';
import { CONFIG } from '../config.js?v=7';
import { Game } from '../state.js?v=7';
import { Save } from '../save.js?v=7';
import { Audio } from '../audio.js?v=7';
import { addButton, addText } from '../ui.js?v=7';
import { attachAtmosphere, coverEnd, drawScoreCard, fadeIn, paintApocSky } from '../fx.js?v=7';
import { goTo, hideHud } from '../flow.js?v=7';
import { buildScore, downLine, EARLY_END_LINE } from '../logic.js?v=7';
import { apocalypseOf } from '../rumors.js?v=7';
import { lossHintFor, winLinesFor } from '../data/survival.js?v=7';
import { makeTyper } from './type.js?v=7';

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
    const kind = apocalypseOf(state);
    coverEnd(this, state, { tint: 0x6a5344, fallback: 'bg-title' });
    this.add.rectangle(640, 360, 1280, 720, 0x140c08, 0.62).setDepth(1);
    if (state.ending !== 'early') paintApocSky(this, state);
    attachAtmosphere(this, { ash: state.ending !== 'early' && kind !== 'bigmoon', depth: 6 });
    state.lastScene = 'Ending';
    if (!state.ending) state.ending = 'loss';
    state.finished = true;
    Save.write(state);
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
    const kind = apocalypseOf(state);
    if (state.ending === 'win') {
      const lines = winLinesFor(kind);
      for (let i = 0; i < lines.length; i += 1) {
        if (this.shown || this.typer.dead) return;
        Audio.staticBurst(0.12);
        await this.typer.say(this.voice, lines[i], true);
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
      const rest = state.ending === 'early'
        ? [EARLY_END_LINE]
        : [lossHintFor(kind), state.flags?.downReason ? downLine(state.flags.downReason) : ''].filter(Boolean);
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
    root.add(drawScoreCard(this, 170, 96, 940, 520));
    const kicker = Game.state.ending === 'win'
      ? 'TEN DAYS LATER'
      : Game.state.ending === 'early'
        ? 'BEFORE DAY 30'
        : 'SIGNAL LOST';
    root.add(addText(this, 640, 114, kicker, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '16px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0,
    }));
    const rank = addText(this, 640, 140, instant ? card.rank : '', {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '40px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0,
    });
    root.add(rank);

    const rows = [
      ['Days survived', card.days, (value) => String(Math.round(value))],
      ['Food left', card.food, (value) => String(Math.round(value))],
      ['Rooms built (out of 8)', card.rooms, (value) => `${Math.round(value)} / 8`],
      ['Neighbors who made it', card.neighbors, (value) => String(Math.round(value))],
      ['Trades made', card.trades, (value) => String(Math.round(value))],
      ['Bottle rockets launched', card.rockets, (value) => String(Math.round(value))],
      ['Violation notices collected', card.notices, (value) => String(Math.round(value))],
      ['Weapon used', card.weapon, null],
      ['Defenses ready', card.guessed ? 'Yes' : 'No', null],
    ];
    const reduce = !!Game.settings?.reduceEffects || instant;
    rows.forEach((row, index) => {
      const y = 200 + index * 32;
      root.add(addText(this, 280, y, row[0], {
        fontFamily: CONFIG.FONTS.heading,
        fontSize: '18px',
        color: CONFIG.COLORS.textMuted,
        originX: 0,
        originY: 0.5,
      }));
      const value = addText(this, 980, y, row[2] ? '0' : String(row[1]), {
        fontFamily: CONFIG.FONTS.heading,
        fontSize: '20px',
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
    const revealed = (Game.state?.day || 1) >= CONFIG.PREP_DAYS
      || Game.state?.mode === 'survival'
      || !!Game.state?.flags?.apocalypseSeen;
    const guessLine = card.guessName
      ? (revealed ? `Notebook guess: ${card.guessName}. +${card.guessBonus || 0}` : `Notebook guess: ${card.guessName}.`)
      : 'Notebook guess: none.';
    root.add(addText(this, 640, 496, `In memory: ${card.memory}\n${guessLine}`, {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '16px',
      color: CONFIG.COLORS.text,
      originX: 0.5,
      originY: 0,
      align: 'center',
      wordWrap: { width: 820 },
    }));

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
