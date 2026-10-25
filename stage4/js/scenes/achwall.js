import Phaser from '../phaser.js?v=5';
import { CONFIG } from '../config.js?v=5';
import { addButton, addPanel, addText } from '../ui.js?v=5';
import { attachAtmosphere } from '../fx.js?v=5';
import { beginScene, goTo, hideHud } from '../flow.js?v=5';
import { ACHIEVEMENTS, earnedCount, progressOf } from '../achievements.js?v=5';
import { readMeta } from '../meta.js?v=5';

/** The achievement wall, from the title menu. Locked ones read ??? (progress ones show n of 5). */
export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('Achievements');
  }

  create() {
    hideHud(this);
    beginScene(this);
    this.cameras.main.setBackgroundColor('#070b12');
    if (this.textures.exists('bg-title')) {
      this.add.image(640, 360, 'bg-title').setAlpha(0.2).setTint(0x667788);
    }
    attachAtmosphere(this, { depth: 4 });
    addPanel(this, 60, 18, 1160, 684).setDepth(10);
    addText(this, 640, 56, 'ACHIEVEMENTS', {
      fontFamily: CONFIG.FONTS.display, fontSize: '54px', color: CONFIG.COLORS.orangeCss, originX: 0.5, originY: 0.5,
    }).setDepth(12);
    addText(this, 640, 96, `${earnedCount()} of ${ACHIEVEMENTS.length} earned`, {
      fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.textMuted, originX: 0.5, originY: 0.5,
    }).setDepth(12);
    const meta = readMeta();
    const rows = [];
    ACHIEVEMENTS.forEach((row, index) => {
      const col = index % 2;
      const line = Math.floor(index / 2);
      const x = 96 + col * 556;
      const y = 124 + line * 82;
      const got = !!meta.achs[row.id];
      const prog = progressOf(row);
      const g = this.add.graphics().setDepth(11);
      g.fillStyle(got ? 0x2a1a0e : 0x0b0f18, 0.92);
      g.fillRoundedRect(x, y, 532, 72, 6);
      g.lineStyle(2, got ? CONFIG.COLORS.orange : 0x3a3f4a, 1);
      g.strokeRoundedRect(x, y, 532, 72, 6);
      const title = got ? row.name : '???';
      addText(this, x + 16, y + 8, title, {
        fontFamily: CONFIG.FONTS.heading, fontSize: '21px',
        color: got ? CONFIG.COLORS.orangeCss : CONFIG.COLORS.textMuted,
      }).setDepth(12);
      let desc = got ? row.desc : '';
      if (prog) desc = got ? `${row.desc}  (${prog.have} of ${prog.of})` : `Progress: ${prog.have} of ${prog.of}`;
      addText(this, x + 16, y + 40, desc, {
        fontFamily: CONFIG.FONTS.radio, fontSize: '15px', color: CONFIG.COLORS.text, wordWrap: { width: 500 },
      }).setDepth(12);
      if (got) {
        addText(this, x + 516, y + 10, `Run ${meta.achs[row.id].run || '?'}`, {
          fontFamily: CONFIG.FONTS.body, fontSize: '13px', color: CONFIG.COLORS.textMuted, originX: 1,
        }).setDepth(12);
      }
      rows.push({ id: row.id, got, title, desc });
    });
    globalThis.__PREPPER_WALL = rows;
    addButton(this, 640, 662, 'BACK', () => goTo(this, 'Title'), { w: 240, h: 50, depth: 14 });
  }
}
