import Phaser from '../phaser.js?v=5';
import { CONFIG } from '../config.js?v=5';
import { addButton, addText } from '../ui.js?v=5';
import { attachAtmosphere } from '../fx.js?v=5';
import { beginScene, goTo, hideHud } from '../flow.js?v=5';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create(data) {
    const from = data?.from || 'Title';
    hideHud(this);
    beginScene(this);
    this.cameras.main.setBackgroundColor('#070b12');
    if (this.textures.exists('bg-title')) {
      this.add.image(640, 360, 'bg-title').setAlpha(0.38).setTint(0x778899);
    }
    this.add.rectangle(640, 360, 1280, 720, 0x070b12, 0.5).setDepth(2);
    attachAtmosphere(this, { depth: 4 });

    const lines = [...CONFIG.CREDITS, CONFIG.AI_CREDIT];
    const block = this.add.container(640, 780).setDepth(20);
    let y = 0;
    lines.forEach((line, index) => {
      const title = index === 0;
      const disclosure = index === lines.length - 1 || index === 3;
      const text = addText(this, 0, y, line, {
        fontFamily: title ? CONFIG.FONTS.display : CONFIG.FONTS.heading,
        fontSize: title ? '84px' : '28px',
        color: title || disclosure ? CONFIG.COLORS.orangeCss : CONFIG.COLORS.text,
        originX: 0.5,
        originY: 0,
        align: 'center',
        wordWrap: { width: 920 },
      });
      if (index === 6) text.setFontFamily(CONFIG.FONTS.radio);
      block.add(text);
      y += text.height + (title ? 40 : 28);
    });
    this.tweens.add({
      targets: block,
      y: -y - 80,
      duration: Math.max(20000, y * 32),
      repeat: -1,
    });

    this.add.rectangle(640, 668, 280, 70, 0x070b12, 0.72).setDepth(40);
    addButton(this, 640, 668, 'BACK', () => goTo(this, from), {
      w: 200, h: 52, primary: true, depth: 42,
    });
  }
}
