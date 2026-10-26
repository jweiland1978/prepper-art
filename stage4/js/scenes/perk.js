import Phaser from '../phaser.js?v=6';
import { CONFIG } from '../config.js?v=6';
import { readMeta } from '../meta.js?v=6';
import { ownedPerks } from '../unlocks.js?v=6';
import { Audio } from '../audio.js?v=6';
import { addButton, addPaper, addText } from '../ui.js?v=6';
import { attachAtmosphere } from '../fx.js?v=6';
import { beginScene, goTo } from '../flow.js?v=6';

/**
 * Stage 4 Part A: pick one starting perk (or none) before the run begins.
 * Shown after NameEntry whenever at least one perk is unlocked. One tap picks and starts.
 */
export class PerkScene extends Phaser.Scene {
  constructor() {
    super('Perk');
  }

  create(data) {
    this.left = false;
    this.name = data?.name || '';
    beginScene(this);
    this.cameras.main.setBackgroundColor('#070b12');
    if (this.textures.exists('bg-bunker')) {
      this.add.image(640, 360, 'bg-bunker').setAlpha(0.28).setTint(0x99a0aa);
    }
    attachAtmosphere(this, { depth: 4 });
    addPaper(this, 220, 36, 840, 640).setDepth(10);
    addText(this, 640, 92, 'STARTING PERK', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '30px', color: CONFIG.COLORS.inkCss, originX: 0.5, originY: 0.5,
    }).setDepth(12);
    addText(this, 640, 140, 'Pick one for this run. You can pick a different one next time.', {
      fontFamily: CONFIG.FONTS.radio, fontSize: '19px', color: '#5c4632', originX: 0.5, originY: 0.5,
      align: 'center', wordWrap: { width: 760 },
    }).setDepth(12);

    const perks = ownedPerks();
    const last = readMeta().lastPerk;
    const rows = [
      ...perks.map((row) => ({ id: row.id, label: row.name.toUpperCase(), subtitle: row.short })),
      { id: '', label: 'NO PERK', subtitle: 'Straight up. Biscuit respects it.' },
    ];
    const gap = rows.length > 5 ? 74 : 82;
    const top = 214;
    const lastOwned = rows.some((row) => row.id === last) ? last : '';
    this.buttons = rows.map((row, index) => addButton(this, 640, top + index * gap, row.label, () => this.pick(row.id), {
      w: 640,
      h: 64,
      primary: row.id === lastOwned,
      subtitle: row.subtitle,
      fontSize: '22px',
      depth: 14,
    }));
    globalThis.__PREPPER_PERKPICK = { open: true, ids: rows.map((row) => row.id), last: lastOwned };
    this.events.once('shutdown', () => { globalThis.__PREPPER_PERKPICK = { open: false }; });
  }

  pick(id) {
    if (this.left) return;
    this.left = true;
    try {
      Audio.unlock();
      Audio.rustle();
    } catch (error) {
      console.warn('[PREPPER] Audio hiccup.', error);
    }
    goTo(this, 'Intro', { name: this.name, perk: id });
  }
}
