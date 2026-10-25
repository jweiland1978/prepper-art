import Phaser from '../phaser.js?v=5';
import { CONFIG } from '../config.js?v=5';
import { cleanName } from '../state.js?v=5';
import { Audio } from '../audio.js?v=5';
import { addButton, addPaper, addText } from '../ui.js?v=5';
import { attachAtmosphere } from '../fx.js?v=5';
import { beginScene, goTo } from '../flow.js?v=5';
import { ownedPerks } from '../unlocks.js?v=5';

const BOXES = [
  'I have read the pamphlet',
  'I have NOT read the pamphlet',
  'What pamphlet',
];

export class NameScene extends Phaser.Scene {
  constructor() {
    super('NameEntry');
  }

  create() {
    this.left = false;
    beginScene(this);
    this.cameras.main.setBackgroundColor('#070b12');
    if (this.textures.exists('bg-bunker')) {
      this.add.image(640, 360, 'bg-bunker').setAlpha(0.28).setTint(0x99a0aa);
    }
    attachAtmosphere(this, { depth: 4 });
    addPaper(this, 220, 36, 840, 640).setDepth(10);

    addText(this, 640, 92, 'LAKE ORWELL CIVIL PREPAREDNESS REGISTRY', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '26px',
      color: CONFIG.COLORS.inkCss,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(12);
    addText(this, 640, 132, 'FORM 88-3', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '18px',
      color: '#6e3a22',
      originX: 0.5,
      originY: 0.5,
    }).setDepth(12);
    addText(this, 280, 186, 'REGISTRANT', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '18px',
      color: '#6e3a22',
      originX: 0,
      originY: 0,
    }).setDepth(12);
    addText(this, 280, 300, 'The registry has no opinion about the boxes below.', {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '16px',
      color: '#5c4632',
      originX: 0,
      originY: 0,
    }).setDepth(12);

    const line = this.add.graphics().setDepth(12);
    line.lineStyle(2, CONFIG.COLORS.rust, 1);
    line.lineBetween(280, 268, 980, 268);

    this.checks = BOXES.map((label, index) => ({ label, on: false, y: 350 + index * 62 }));
    this.boxGfx = this.add.graphics().setDepth(12);
    this.checks.forEach((row) => {
      addText(this, 332, row.y + 2, row.label, {
        fontFamily: CONFIG.FONTS.radio,
        fontSize: '22px',
        color: CONFIG.COLORS.inkCss,
        originX: 0,
        originY: 0,
      }).setDepth(12);
      const zone = this.add.zone(480, row.y + 16, 520, 48).setOrigin(0.5).setDepth(13);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        row.on = !row.on;
        this.drawBoxes();
        Audio.click();
      });
    });
    this.drawBoxes();

    addButton(this, 640, 590, 'FILE THE FORM', () => this.submit(), {
      w: 320,
      h: 56,
      primary: true,
      depth: 20,
    });

    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.maxLength = CONFIG.NAME_MAX;
    this.inputEl.placeholder = CONFIG.DEFAULT_NAME;
    this.inputEl.setAttribute('aria-label', 'Registrant name');
    this.inputEl.setAttribute('autocomplete', 'off');
    this.inputEl.setAttribute('autocapitalize', 'words');
    this.inputEl.setAttribute('enterkeyhint', 'done');
    this.inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.submit();
    });
    document.getElementById('dom-layer').appendChild(this.inputEl);
    this.placeInput();
    const onResize = () => this.placeInput();
    this.scale.on('resize', onResize);
    window.addEventListener('resize', onResize);
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResize);
      window.removeEventListener('resize', onResize);
      this.inputEl?.remove();
    });
  }

  drawBoxes() {
    const g = this.boxGfx;
    g.clear();
    this.checks.forEach((row) => {
      g.lineStyle(2, 0x6e3a22, 1);
      g.strokeRect(280, row.y, 32, 32);
      if (!row.on) return;
      g.lineStyle(3, 0x1a120c, 1);
      g.lineBetween(286, row.y + 16, 293, row.y + 24);
      g.lineBetween(293, row.y + 24, 306, row.y + 8);
    });
  }

  placeInput() {
    const canvas = this.game.canvas.getBoundingClientRect();
    if (!canvas.width) return;
    const sx = canvas.width / CONFIG.WIDTH;
    const sy = canvas.height / CONFIG.HEIGHT;
    const field = { x: 280, y: 214, w: 700, h: 48 };
    const input = this.inputEl;
    input.style.left = `${canvas.left + field.x * sx}px`;
    input.style.top = `${canvas.top + field.y * sy}px`;
    input.style.width = `${field.w * sx}px`;
    input.style.height = `${field.h * sy}px`;
    input.style.fontSize = `${Math.max(16, 28 * sy)}px`;
  }

  submit() {
    if (this.left) return;
    this.left = true;
    const name = cleanName(this.inputEl.value);
    this.inputEl.remove();
    try {
      Audio.unlock();
      Audio.rustle();
    } catch (error) {
      console.warn('[PREPPER] Audio hiccup.', error);
    }
    // Stage 4 Part A: the perk picker comes first once any perk is unlocked.
    if (ownedPerks().length) goTo(this, 'Perk', { name });
    else goTo(this, 'Intro', { name });
  }
}
