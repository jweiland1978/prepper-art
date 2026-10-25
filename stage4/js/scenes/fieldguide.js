import Phaser from '../phaser.js?v=4';
import { CONFIG } from '../config.js?v=4';
import { Game } from '../state.js?v=4';
import { Audio } from '../audio.js?v=4';
import { addButton, addPaper, addText, runTypewriter } from '../ui.js?v=4';
import { attachAtmosphere, effectsOn } from '../fx.js?v=4';
import { beginScene, goTo, hideHud } from '../flow.js?v=4';
import { guidePages, guideTabs, syncGuideFromRun } from '../guide.js?v=4';

const PAGE = { x: 230, y: 92, w: 820, h: 520 };
const BODY = { x: 266, y: 214, w: 748, h: 352 };
const SWIPE_MIN = 60;

/**
 * Stage 4 Part C: the Field Guide. From the title (its own screen) or from the notebook
 * during a run (an overlay that pauses the screen underneath and resumes it on close).
 * Text types at 70 ms a character; a tap finishes it. Swipe left/right or tap NEXT/PREV
 * (or the page edges once the text is done) to turn. Long pages scroll by a vertical swipe.
 */
export class FieldGuideScene extends Phaser.Scene {
  constructor() {
    super('FieldGuide');
  }

  create(data) {
    this.overlay = !!data?.overlay;
    this.from = data?.from || 'Title';
    this.paused = [];
    // The scene object is reused between opens: reset per-open state.
    this.closing = false;
    this.drag = null;
    this.scrollY = 0;
    this.lastGesture = '';
    this.typed = false;
    if (this.overlay) {
      // Pause whatever is underneath (map, bunker, radio and the HUD) until the guide closes.
      this.scene.manager.getScenes(true).forEach((other) => {
        const key = other.sys.settings.key;
        if (key === 'FieldGuide' || key === 'Toast') return;
        if (other.sys.isActive()) {
          other.scene.pause();
          this.paused.push(key);
        }
      });
      this.scene.bringToTop();
    } else {
      hideHud(this);
      beginScene(this);
    }
    this.cameras.main.setBackgroundColor('#070b12');
    syncGuideFromRun(Game.state);
    this.pages = guidePages(Game.state?.name);
    const start = Math.max(0, this.pages.findIndex((page) => page.id === data?.page));
    this.index = start;

    // Backdrop: the hosted notebook painting, or a drawn workbench if it didn't load.
    if (this.textures.exists('bg-fieldguide')) {
      this.add.image(640, 360, 'bg-fieldguide').setAlpha(0.5).setTint(0x8a8f9a);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x0b0f18, 1);
      g.fillRect(0, 0, 1280, 720);
      g.fillStyle(0x2a1a0e, 1);
      g.fillRect(0, 430, 1280, 290);
      g.fillStyle(0xff8c28, 0.08);
      g.fillCircle(1040, 140, 220);
    }
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.25);
    // Swallow taps on empty space so nothing underneath (overlay mode) gets them.
    this.add.zone(640, 360, 1280, 720).setOrigin(0.5).setInteractive();

    this.paperRoot = this.add.container(0, 0).setDepth(10);
    this.paperRoot.add(addPaper(this, PAGE.x, PAGE.y, PAGE.w, PAGE.h));
    // Spiral rings down the left edge: it's a notebook.
    const rings = this.add.graphics();
    rings.lineStyle(3, 0x9aa3ad, 0.9);
    for (let y = PAGE.y + 34; y < PAGE.y + PAGE.h - 20; y += 34) rings.strokeEllipse(PAGE.x + 2, y, 18, 12);
    this.paperRoot.add(rings);

    this.content = this.add.container(0, 0).setDepth(12);
    this.kicker = addText(this, PAGE.x + 36, PAGE.y + 26, '', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '16px', color: '#8a3a1a',
    });
    this.title = addText(this, PAGE.x + 36, PAGE.y + 46, '', {
      fontFamily: CONFIG.FONTS.display, fontSize: '54px', color: CONFIG.COLORS.inkCss,
    });
    this.portrait = this.add.image(PAGE.x + PAGE.w - 110, PAGE.y + 96, '__DEFAULT').setVisible(false);
    this.body = addText(this, BODY.x, BODY.y, '', {
      fontFamily: CONFIG.FONTS.radio, fontSize: '20px', color: CONFIG.COLORS.inkCss,
      wordWrap: { width: BODY.w }, lineSpacing: 5,
    });
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(BODY.x - 6, BODY.y - 4, BODY.w + 12, BODY.h + 8);
    this.body.setMask(maskShape.createGeometryMask());
    this.staticBox = this.add.tileSprite(BODY.x + BODY.w / 2, BODY.y + 120, BODY.w, 200, 'grain').setAlpha(0.9).setTint(0x9a9a9a);
    this.staticBars = this.add.graphics();
    this.hint = addText(this, PAGE.x + PAGE.w / 2, PAGE.y + PAGE.h - 26, '', {
      fontFamily: CONFIG.FONTS.body, fontSize: '15px', color: '#6e5a48', originX: 0.5, originY: 0.5,
    });
    this.content.add([this.kicker, this.title, this.portrait, this.body, this.staticBox, this.staticBars, this.hint]);

    // The page itself is the swipe / tap target. Buttons sit above it.
    this.pageZone = this.add.zone(PAGE.x + PAGE.w / 2, PAGE.y + PAGE.h / 2, PAGE.w, PAGE.h)
      .setOrigin(0.5).setDepth(14).setInteractive();
    this.pageZone.on('pointerdown', (pointer) => {
      Audio.unlock();
      this.drag = { x: pointer.x, y: pointer.y, scroll: this.scrollY || 0, mode: '' };
    });
    this.onMove = (pointer) => {
      const d = this.drag;
      if (!d || !pointer.isDown) return;
      const dx = pointer.x - d.x;
      const dy = pointer.y - d.y;
      if (!d.mode && Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx) && this.maxScroll() > 0) d.mode = 'scroll';
      if (d.mode === 'scroll') this.setScroll(d.scroll - dy);
    };
    this.onUp = (pointer) => {
      const d = this.drag;
      this.drag = null;
      if (!d) return;
      const dx = pointer.x - d.x;
      const dy = pointer.y - d.y;
      if (d.mode === 'scroll') return;
      if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
        this.lastGesture = dx < 0 ? 'swipe-next' : 'swipe-prev';
        this.turn(dx < 0 ? 1 : -1);
        return;
      }
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) return;
      // A tap: finish the typing first, then the page waits for the next tap.
      if (!this.typed) {
        this.typer?.skip();
        return;
      }
      const back = pointer.x < PAGE.x + PAGE.w * 0.25;
      this.lastGesture = back ? 'tap-prev' : 'tap-next';
      this.turn(back ? -1 : 1);
    };
    this.input.on('pointermove', this.onMove);
    this.input.on('pointerup', this.onUp);

    this.pageLabel = addText(this, 640, 632, '', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
    }).setDepth(20).setShadow(0, 1, '#000000', 4, true, true);
    this.prevBtn = addButton(this, 330, 676, 'PREV', () => this.turn(-1), { w: 180, h: 52, depth: 20 });
    this.nextBtn = addButton(this, 950, 676, 'NEXT', () => this.turn(1), { w: 180, h: 52, depth: 20 });
    addButton(this, 640, 676, this.overlay ? 'CLOSE' : 'BACK', () => this.close(), { w: 200, h: 52, primary: true, depth: 20 });

    attachAtmosphere(this, { depth: 40 });
    this.tabNodes = [];
    this.events.once('shutdown', () => this.teardown());
    this.showPage(this.index, 0);
  }

  update(time) {
    // Locked pages: the static crawls (it holds still with Reduce effects on).
    if (this.staticBox?.visible && effectsOn()) {
      this.staticBox.tilePositionX = (time * 0.37) % 512;
      this.staticBox.tilePositionY = (time * 0.53) % 512;
    }
  }

  drawTabs() {
    this.tabNodes.forEach((node) => node.destroy());
    const tabs = guideTabs();
    const current = this.pages[this.index]?.tab;
    this.tabNodes = tabs.map((tab, i) => addButton(this, 640 + (i - 2) * 216, 44, tab.label, () => {
      const first = this.pages.findIndex((page) => page.tab === tab.id);
      if (first >= 0 && first !== this.index) this.showPage(first, first > this.index ? 1 : -1);
    }, { w: 204, h: 52, fontSize: '22px', primary: tab.id === current, depth: 20 }));
  }

  maxScroll() {
    return Math.max(0, (this.body?.height || 0) - BODY.h);
  }

  setScroll(value) {
    this.scrollY = Phaser.Math.Clamp(value, 0, this.maxScroll());
    this.body.setY(BODY.y - this.scrollY);
    this.publish();
  }

  turn(dir) {
    const next = this.index + dir;
    if (next < 0 || next >= this.pages.length) return;
    try { Audio.rustle(); } catch (error) { /* audio is optional */ }
    this.showPage(next, dir);
  }

  showPage(index, dir) {
    this.index = Phaser.Math.Clamp(index, 0, this.pages.length - 1);
    const page = this.pages[this.index];
    this.typer?.cancel();
    this.typed = false;
    this.scrollY = 0;
    this.body.setY(BODY.y);
    this.kicker.setText(page.kicker || '');
    this.title.setText(page.title);
    const hasPortrait = page.open && page.portrait && this.textures.exists(page.portrait);
    this.portrait.setVisible(!!hasPortrait);
    if (hasPortrait) {
      this.portrait.setTexture(page.portrait);
      const s = 150 / Math.max(this.portrait.width, this.portrait.height);
      this.portrait.setScale(s);
    }
    this.body.setWordWrapWidth(hasPortrait ? BODY.w - 180 : BODY.w);
    this.staticBox.setVisible(!page.open);
    this.staticBars.clear();
    if (!page.open) {
      // "???" pages: a block of static where the writing would be.
      this.staticBars.fillStyle(0x2a2a2a, 0.35);
      for (let i = 0; i < 9; i += 1) this.staticBars.fillRect(BODY.x, BODY.y + 24 + i * 20, BODY.w * (0.55 + ((i * 37) % 40) / 100), 6);
      this.staticBox.setY(BODY.y + 160);
    }
    this.body.setText('');
    this.pageLabel.setText(`${this.index + 1} / ${this.pages.length}`);
    this.prevBtn.setAlpha(this.index > 0 ? 1 : 0.4);
    this.nextBtn.setAlpha(this.index < this.pages.length - 1 ? 1 : 0.4);
    this.hint.setText('Tap to finish the page');
    this.drawTabs();
    const full = page.body;
    if (!page.open) this.body.setY(BODY.y + 270); // the locked line sits under the static
    this.typer = runTypewriter(this, this.body, full, () => {
      this.typed = true;
      this.hint.setText(this.index < this.pages.length - 1 ? 'Swipe or tap for the next page' : 'Last page. Swipe back, or tap BACK.');
      this.publish();
    }, false);
    if (dir && effectsOn()) {
      this.content.setAlpha(0).setX(dir * 36);
      this.tweens.add({ targets: this.content, alpha: 1, x: 0, duration: 200, ease: 'Quad.easeOut' });
    } else {
      this.content.setAlpha(1).setX(0);
    }
    this.publish();
  }

  publish() {
    const page = this.pages[this.index] || {};
    const scene = this;
    globalThis.__PREPPER_GUIDE = {
      open: true,
      overlay: this.overlay,
      index: this.index,
      count: this.pages.length,
      id: page.id,
      tab: page.tab,
      title: page.title,
      pageOpen: !!page.open,
      // Live values (test hooks): read at the moment they're asked for.
      get typed() { return !!scene.typed; },
      get shown() { return scene.body?.text || ''; },
      full: page.body || '',
      get scrollY() { return scene.scrollY || 0; },
      get maxScroll() { return scene.maxScroll(); },
      get lastGesture() { return scene.lastGesture || ''; },
      pages: this.pages.map((row) => ({ id: row.id, tab: row.tab, open: row.open, title: row.title, halves: row.halves || null })),
      allText: this.pages.map((row) => `${row.title}\n${row.kicker || ''}\n${row.body}`).join('\n\n'),
    };
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    if (this.overlay) {
      const keys = this.paused;
      this.paused = [];
      this.scene.stop();
      keys.forEach((key) => {
        try { if (this.game.scene.isPaused(key)) this.game.scene.resume(key); } catch (error) { /* gone */ }
      });
      return;
    }
    goTo(this, this.from);
  }

  teardown() {
    this.typer?.cancel();
    this.input.off('pointermove', this.onMove);
    this.input.off('pointerup', this.onUp);
    // Never leave the screen underneath paused.
    (this.paused || []).forEach((key) => {
      try { if (this.game.scene.isPaused(key)) this.game.scene.resume(key); } catch (error) { /* gone */ }
    });
    this.paused = [];
    globalThis.__PREPPER_GUIDE = { open: false };
  }
}
