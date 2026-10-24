import Phaser from '../phaser.js?v=5';
import { CONFIG } from '../config.js?v=5';
import { Game, bus } from '../state.js?v=5';
import { Save } from '../save.js?v=5';
import { Audio } from '../audio.js?v=5';
import { addButton, addDialog, addPanel, addSlider, addText, addToggle } from '../ui.js?v=5';
import { attachAtmosphere } from '../fx.js?v=5';
import { beginScene, goTo, hideHud } from '../flow.js?v=5';

const SPEEDS = [
  { label: 'SLOW', value: 0.65 },
  { label: 'NORMAL', value: 1 },
  { label: 'FAST', value: 1.75 },
];

function updateSettings(partial) {
  Game.settings = { ...Game.settings, ...partial };
  Save.writeSettings(Game.settings);
  Audio.applySettings(Game.settings);
  bus.emit('settings', Game.settings);
}

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create(data) {
    this.from = data?.from || 'Title';
    hideHud(this);
    beginScene(this);
    this.cameras.main.setBackgroundColor('#070b12');
    if (this.textures.exists('bg-title')) {
      this.add.image(640, 360, 'bg-title').setAlpha(0.2).setTint(0x667788);
    }
    attachAtmosphere(this, { depth: 4 });
    addPanel(this, 160, 24, 960, 672).setDepth(10);

    addText(this, 640, 58, 'SETTINGS', {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '58px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(12);

    const settings = Game.settings;
    addText(this, 300, 108, 'MUSIC', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.textMuted, originX: 0, originY: 0,
    }).setDepth(12);
    addSlider(this, 300, 128, 520, settings.music, (value) => updateSettings({ music: value })).setDepth(12);

    addText(this, 300, 196, 'SFX', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.textMuted, originX: 0, originY: 0,
    }).setDepth(12);
    addSlider(this, 300, 216, 520, settings.sfx, (value) => updateSettings({ sfx: value })).setDepth(12);

    addToggle(this, 300, 290, 680, 'Radio voice blips', settings.voiceBlips, (on) => {
      updateSettings({ voiceBlips: on });
    }).setDepth(12);
    addToggle(this, 300, 350, 680, 'Reduce effects', settings.reduceEffects, (on) => {
      updateSettings({ reduceEffects: on });
    }).setDepth(12);

    addText(this, 300, 430, 'TEXT SPEED', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.textMuted, originX: 0, originY: 0,
    }).setDepth(12);
    SPEEDS.forEach((speed, index) => {
      const selected = Math.abs(settings.textSpeed - speed.value) < 0.05;
      addButton(this, 400 + index * 180, 480, speed.label, () => {
        updateSettings({ textSpeed: speed.value });
        this.scene.restart({ from: this.from });
      }, { w: 150, h: 48, primary: selected, depth: 14 });
    });

    addToggle(this, 300, 530, 680, 'Debug: show coordinates', settings.debugCoords, (on) => {
      updateSettings({ debugCoords: on });
    }).setDepth(12);

    addButton(this, 460, 630, 'DELETE SAVE', () => this.confirmDelete(), {
      w: 240, h: 52, primary: false, depth: 14,
    });
    addButton(this, 760, 630, 'DONE', () => goTo(this, this.from), {
      w: 200, h: 52, primary: true, depth: 14,
    });
  }

  confirmDelete() {
    addDialog(this, {
      title: 'HOLD ON',
      radio: true,
      body: 'Delete your save? Like, the whole apocalypse?',
      buttons: [
        { label: 'KEEP IT' },
        { label: 'DELETE IT', primary: true, onClick: () => Save.deleteSave() },
      ],
    });
  }
}
