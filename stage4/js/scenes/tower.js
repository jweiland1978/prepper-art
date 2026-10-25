import Phaser from '../phaser.js?v=3';
import { CONFIG } from '../config.js?v=3';
import { Game } from '../state.js?v=3';
import { Save } from '../save.js?v=3';
import { Audio } from '../audio.js?v=3';
import { addButton, addText } from '../ui.js?v=3';
import { attachAtmosphere, fadeIn } from '../fx.js?v=3';
import { hideHud, leave } from '../flow.js?v=3';
import { readMeta } from '../meta.js?v=3';
import { chooseTowerEnding } from '../tower.js?v=3';
import { CHOICES, CLIMB_AGAIN, CLIMB_LINES, MONOLOGUE, STUDIO_LINES } from '../data/tower.js?v=3';
import { makeTyper } from './type.js?v=3';

/**
 * Stage 4 Part B: the Radio Tower. Climb card, then the studio, then the voice, then the choice.
 * Every line types at the normal 70 ms and waits for a tap. The choice buttons are full size.
 * Picking one ends the run here (it replaces Day 30). Reload-safe: the step lives on the save.
 */
export class TowerScene extends Phaser.Scene {
  constructor() {
    super('Tower');
  }

  create() {
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    this.left = false;
    fadeIn(this, 420);
    hideHud(this);
    this.cameras.main.setBackgroundColor('#070b12');
    state.lastScene = 'Tower';
    state.flags.towerStep = state.flags.towerStep || 'climb';
    if (state.flags.towerStep === 'ending') state.flags.towerStep = 'choice';
    Save.write(state);
    Audio.stopMusic();
    Audio.stopRain();
    Audio.stopSirens();
    Audio.stopGenerator();

    this.bg = null;
    this.tapToContinue = true;
    this.typer = makeTyper(this);
    this.shade = this.add.rectangle(640, 600, 1280, 240, 0x070b12, 0.82).setDepth(10);
    this.kicker = addText(this, 640, 500, '', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.orangeCss, originX: 0.5, originY: 0.5,
    }).setDepth(12);
    this.line = addText(this, 640, 528, '', {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '26px',
      color: '#e6d7b8',
      originX: 0.5,
      originY: 0,
      align: 'center',
      wordWrap: { width: 1080 },
      lineSpacing: 8,
    }).setDepth(12);
    this.hint = addText(this, 640, 696, 'Tap to continue', {
      fontFamily: CONFIG.FONTS.body, fontSize: '15px', color: CONFIG.COLORS.textMuted, originX: 0.5, originY: 0.5,
    }).setDepth(12);
    // The whole screen is the tap target for the typed lines.
    this.tapZone = this.add.zone(640, 360, 1280, 720).setOrigin(0.5).setDepth(5).setInteractive();
    this.tapZone.on('pointerdown', () => this.typer.skip());
    this.input.keyboard?.on('keydown-SPACE', () => this.typer.skip());

    this.publish();
    this.events.once('shutdown', () => {
      this.typer.dead = true;
      Audio.stopStatic();
      globalThis.__PREPPER_TOWER = { open: false };
    });
    this.play().catch((error) => {
      console.error('[PREPPER] Tower stopped.', error);
      this.showChoice();
    });
  }

  publish(extra = {}) {
    const state = Game.state;
    globalThis.__PREPPER_TOWER = {
      open: true,
      step: state?.flags?.towerStep || '',
      line: this.line?.text || '',
      bg: this.bgKey || '',
      choices: this.choiceButtons ? Object.keys(CHOICES) : [],
      ...extra,
    };
  }

  setBackdrop(key, opts = {}) {
    if (!this.textures.exists(key)) return;
    const old = this.bg;
    const img = this.add.image(640, 360, key).setDepth(opts.depth ?? 1).setAlpha(0);
    img.setScale(Math.max(1280 / (img.width || 1280), 720 / (img.height || 720)));
    this.tweens.add({ targets: img, alpha: 1, duration: 600, onComplete: () => old?.destroy() });
    this.bg = img;
    this.bgKey = key;
  }

  async sayAll(lines) {
    for (let i = 0; i < lines.length; i += 1) {
      if (this.typer.dead) return false;
      this.publish();
      await this.typer.say(this.line, lines[i], true);
      if (this.typer.dead) return false;
      this.publish();
      await this.typer.wait(160);
    }
    return !this.typer.dead;
  }

  async play() {
    const state = Game.state;
    const name = (state.name || CONFIG.DEFAULT_NAME || 'Neighbor').trim();
    if (state.flags.towerStep === 'climb') {
      this.setBackdrop('bg-radiotower');
      attachAtmosphere(this, { depth: 4 });
      this.kicker.setText('THE CLIMB');
      Audio.startStatic(0.03);
      const again = CLIMB_AGAIN[readMeta().tower?.last || ''];
      const lines = again ? [...CLIMB_LINES, again] : CLIMB_LINES;
      if (!await this.sayAll(lines)) return;
      state.flags.towerStep = 'studio';
      Save.write(state);
    }
    if (state.flags.towerStep === 'studio') {
      this.setBackdrop('bg-studio');
      this.kicker.setText('88.3 FM  ·  ON AIR');
      Audio.stopStatic();
      Audio.startStatic(0.05);
      if (!await this.sayAll(STUDIO_LINES)) return;
      state.flags.towerStep = 'voice';
      Save.write(state);
    }
    if (state.flags.towerStep === 'voice') {
      if (this.bgKey !== 'bg-studio') this.setBackdrop('bg-studio');
      this.kicker.setText('THE VOICE');
      this.line.setColor('#ffd9a0');
      const lines = MONOLOGUE.map((line) => line.replaceAll('{name}', name));
      if (!await this.sayAll(lines)) return;
      state.flags.towerStep = 'choice';
      Save.write(state);
    }
    this.showChoice();
  }

  showChoice() {
    if (this.choiceButtons || this.left || !this.sys?.isActive()) return;
    const state = Game.state;
    state.flags.towerStep = 'choice';
    Save.write(state);
    if (this.bgKey !== 'bg-studio') this.setBackdrop('bg-studio');
    Audio.stopStatic();
    this.tapZone.disableInteractive();
    this.hint.setText('');
    this.kicker.setText('THE MIC IS LIVE').setY(428);
    this.line.setColor('#e6d7b8');
    this.line.setY(452);
    this.line.setText('What do you do?');
    this.shade.setPosition(640, 560).setSize(1280, 320);
    const make = (id, x, primary) => {
      const row = CHOICES[id];
      return addButton(this, x, 600, row.label, () => this.pick(id), {
        w: 520, h: 120, primary, subtitle: row.subtitle, fontSize: '34px', depth: 30,
      });
    };
    this.choiceButtons = [make('break', 350, false), make('voice', 930, true)];
    // The tap that finished the last line must not land on a choice.
    this.choiceReadyAt = this.time.now + 450;
    this.publish({ step: 'choice', line: 'What do you do?' });
  }

  pick(choice) {
    if (this.left || this.time.now < (this.choiceReadyAt || 0)) return;
    this.left = true;
    try { Audio.unlock(); Audio.staticBurst(0.4, 0.2); } catch (error) { console.warn('[PREPPER] Audio hiccup.', error); }
    const state = Game.state;
    chooseTowerEnding(state, choice);
    Save.write(state);
    leave(this, 'Ending');
  }
}
