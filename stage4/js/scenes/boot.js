import Phaser from '../phaser.js?v=4';
import { CONFIG } from '../config.js?v=4';
import { ASSET_LIST } from '../assets.js?v=4';
import { Save } from '../save.js?v=4';
import { Game } from '../state.js?v=4';
import { Audio } from '../audio.js?v=4';
import { addText } from '../ui.js?v=4';
import { buildProceduralTextures, ensureArt, makeLogo } from '../textures.js?v=4';

function waitForFonts() {
  if (!document.fonts?.load) return Promise.resolve();
  const faces = [
    '400 16px Inter',
    '500 32px Oswald',
    '400 72px "Bebas Neue"',
    '400 22px "Special Elite"',
  ];
  const loading = Promise.all(faces.map((face) => document.fonts.load(face).catch(() => null)))
    .then(() => document.fonts.ready);
  const cap = new Promise((resolve) => { window.setTimeout(resolve, 4000); });
  return Promise.race([loading, cap]);
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  init() {
    this.fontPromise = waitForFonts();
  }

  preload() {
    this.cameras.main.setBackgroundColor('#070b12');
    const frame = this.add.graphics();
    frame.lineStyle(2, CONFIG.COLORS.rust, 1);
    frame.strokeRoundedRect(390, 340, 500, 16, 4);
    const bar = this.add.graphics();
    const paint = (amount) => {
      bar.clear();
      bar.fillStyle(CONFIG.COLORS.orange, 1);
      bar.fillRoundedRect(392, 342, Math.max(4, 496 * amount), 12, 3);
    };
    paint(0.05);
    this.load.on('progress', paint);
    this.load.setCORS('anonymous');
    ASSET_LIST.forEach((asset) => this.load.image(asset.key, asset.url));
  }

  async create() {
    await this.fontPromise;
    if (!this.sys.isActive()) return;
    addText(this, 640, 290, 'TUNING IN', {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '64px',
      color: CONFIG.COLORS.text,
      originX: 0.5,
      originY: 0.5,
    });
    addText(this, 640, 400, CONFIG.STATION, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '20px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    });
    buildProceduralTextures(this);
    makeLogo(this);
    ensureArt(this);
    Save.boot();
    Audio.applySettings(Game.settings);
    if (!this.scene.isActive('Toast')) this.scene.launch('Toast');
    this.scene.start('Title');
  }
}
