import Phaser from '../phaser.js?v=6';
import { CONFIG } from '../config.js?v=6';
import { bus } from '../state.js?v=6';
import { Audio } from '../audio.js?v=6';
import { addText } from '../ui.js?v=6';

/**
 * Always-on overlay for achievement toasts. Non-blocking: only the toast itself takes
 * taps (tap to dismiss). It stays up CONFIG.ACH_TOAST_MS so there is time to read it.
 * Several earns queue up and show one after another.
 */
export class ToastScene extends Phaser.Scene {
  constructor() {
    super('Toast');
  }

  create() {
    this.queue = [];
    this.current = null;
    this.off = bus.on('achievement', (row) => this.push(row));
    this.events.once('shutdown', () => this.off?.());
    globalThis.__PREPPER_TOAST = {
      showing: () => (this.current ? this.current.row : null),
      queued: () => this.queue.length,
      dismiss: () => this.dismiss(),
    };
  }

  push(row) {
    if (!row) return;
    this.queue.push(row);
    if (!this.current) this.next();
  }

  next() {
    const row = this.queue.shift();
    if (!row) return;
    this.scene.bringToTop();
    const w = 600;
    const h = 104;
    const g = this.add.graphics();
    g.fillStyle(CONFIG.COLORS.navyDeep, 0.96);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    g.lineStyle(3, CONFIG.COLORS.orange, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    const kicker = addText(this, -w / 2 + 20, -h / 2 + 10, 'ACHIEVEMENT', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '15px',
      color: CONFIG.COLORS.orangeCss,
    });
    const hint = addText(this, w / 2 - 16, -h / 2 + 10, 'tap to close', {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '13px',
      color: CONFIG.COLORS.textMuted,
      originX: 1,
    });
    const name = addText(this, -w / 2 + 20, -h / 2 + 30, row.name, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '26px',
      color: CONFIG.COLORS.text,
    });
    const desc = addText(this, -w / 2 + 20, -h / 2 + 68, row.desc, {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '16px',
      color: CONFIG.COLORS.text,
      wordWrap: { width: w - 40 },
    });
    const root = this.add.container(640, 160, [g, kicker, hint, name, desc]).setDepth(10).setAlpha(0);
    root.setSize(w, h);
    root.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, w, h), // container hit areas are top-left based
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    root.on('pointerdown', () => this.dismiss());
    this.current = { root, row };
    this.tweens.add({ targets: root, alpha: 1, y: 150, duration: 260, ease: 'Quad.easeOut' });
    try { Audio.achChime(); } catch (error) { /* audio is optional */ }
    this.current.timer = this.time.delayedCall(CONFIG.ACH_TOAST_MS, () => this.dismiss());
  }

  dismiss() {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    cur.timer?.remove(false);
    cur.root.disableInteractive();
    this.tweens.add({
      targets: cur.root,
      alpha: 0,
      y: 132,
      duration: 260,
      onComplete: () => {
        cur.root.destroy();
        this.time.delayedCall(250, () => this.next());
      },
    });
  }
}
