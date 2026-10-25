import Phaser from './phaser.js?v=4';
import { CONFIG } from './config.js?v=4';
import { Audio } from './audio.js?v=4';
import { Game } from './state.js?v=4';

/** Part C: effects counters for tests (squash, pop). fx.js adds shake, flip, fade. */
export function fxLog(kind, ran) {
  const log = (globalThis.__PREPPER_FX = globalThis.__PREPPER_FX || { ran: {}, skipped: {} });
  const bucket = ran ? log.ran : log.skipped;
  bucket[kind] = (bucket[kind] || 0) + 1;
}

/** Reduce effects off? (fx.js has the same check; kept local so ui.js has no fx import.) */
function juiceOn() {
  return !Game.settings?.reduceEffects;
}

let phoneCache = null;
/**
 * Part C: a phone (small touch screen). Phones get slightly bigger small text.
 * Tablets and desktops are unchanged. ?phone=1 / ?phone=0 forces it for testing.
 */
export function isPhone() {
  if (phoneCache !== null) return phoneCache;
  try {
    const force = new URLSearchParams(globalThis.location?.search || '').get('phone');
    if (force === '1' || force === '0') {
      phoneCache = force === '1';
      return phoneCache;
    }
    const coarse = !!globalThis.matchMedia?.('(pointer: coarse)')?.matches;
    const short = Math.min(globalThis.screen?.width || 9999, globalThis.screen?.height || 9999);
    phoneCache = coarse && short <= 500;
  } catch (error) {
    phoneCache = false;
  }
  return phoneCache;
}

/** Small text grows a little on phones (11 -> 13, 14 -> 16). 16 px and up stay as designed. */
function phoneFont(size) {
  if (!isPhone() || typeof size !== 'string') return size;
  const m = /^(\d+(?:\.\d+)?)px$/.exec(size);
  if (!m) return size;
  const px = Number(m[1]);
  if (px >= 16) return size;
  return `${Math.min(16, Math.round(px * 1.2))}px`;
}

export function textResolution() {
  const dpr = globalThis.devicePixelRatio || 1;
  return Math.max(1, Math.min(3, dpr));
}

export function addText(scene, x, y, content, style = {}) {
  const originX = style.originX ?? 0;
  const originY = style.originY ?? 0;
  const rest = { ...style };
  delete rest.originX;
  delete rest.originY;
  const text = scene.add.text(x, y, content, {
    fontFamily: CONFIG.FONTS.body,
    fontSize: '18px',
    color: CONFIG.COLORS.text,
    resolution: textResolution(),
    ...rest,
    fontSize: phoneFont(rest.fontSize || '18px'),
  });
  text.setOrigin(originX, originY);
  return text;
}

export function addPanel(scene, x, y, w, h) {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(CONFIG.COLORS.navy, 0.88);
  g.fillRoundedRect(0, 0, w, h, 8);
  g.lineStyle(2, CONFIG.COLORS.rust, 1);
  g.strokeRoundedRect(1, 1, w - 2, h - 2, 8);
  g.lineStyle(8, 0x000000, 0.22);
  g.strokeRoundedRect(7, 7, w - 14, h - 14, 6);
  g.lineStyle(1, 0xc47a45, 0.25);
  g.strokeRoundedRect(4, 4, w - 8, h - 8, 7);
  root.add(g);
  root.setSize(w, h);
  return root;
}

export function addPaper(scene, x, y, w, h) {
  const root = scene.add.container(x, y);
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.38);
  shadow.fillRoundedRect(10, 12, w, h, 4);
  const g = scene.add.graphics();
  g.fillStyle(CONFIG.COLORS.paper, 1);
  g.fillRoundedRect(0, 0, w, h, 3);
  g.fillStyle(CONFIG.COLORS.rust, 1);
  g.fillRect(0, 0, w, 16);
  g.lineStyle(2, 0x6e3a22, 1);
  g.strokeRoundedRect(1, 1, w - 2, h - 2, 3);
  const fiber = scene.add.tileSprite(w / 2, h / 2, w - 8, h - 8, 'fiber').setAlpha(0.22);
  root.add([shadow, g, fiber]);
  return root;
}

export function addButton(scene, x, y, label, onClick, opts = {}) {
  const w = opts.w || 280;
  const h = Math.max(48, opts.h || 56);
  const primary = !!opts.primary;
  const g = scene.add.graphics();
  const text = addText(scene, 0, opts.subtitle ? -11 : 0, label, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: opts.fontSize || (opts.subtitle ? '24px' : '26px'),
    color: primary ? CONFIG.COLORS.inkCss : CONFIG.COLORS.text,
    originX: 0.5,
    originY: 0.5,
  });
  const parts = [g, text];
  let subtitle = null;
  if (opts.subtitle) {
    subtitle = addText(scene, 0, 14, opts.subtitle, {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '14px',
      color: primary ? '#3a2418' : CONFIG.COLORS.textMuted,
      originX: 0.5,
      originY: 0.5,
    });
    parts.push(subtitle);
  }
  const root = scene.add.container(x, y, parts);
  const draw = (hover) => {
    g.clear();
    const fill = primary ? (hover ? 0xffa24a : CONFIG.COLORS.orange) : (hover ? 0x1a2333 : CONFIG.COLORS.navy);
    g.fillStyle(fill, primary ? 1 : 0.9);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 7);
    g.lineStyle(2, primary ? 0x6a320f : (hover ? CONFIG.COLORS.orange : CONFIG.COLORS.rust), 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 7);
    if (hover) {
      g.lineStyle(6, CONFIG.COLORS.orange, 0.2);
      g.strokeRoundedRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 10);
    }
  };
  draw(false);
  root.setSize(w, h);
  root.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(0, 0, w, h), // container hit areas are top-left based
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  });
  root.on('pointerover', () => draw(true));
  // Press feedback scales the visuals only. Scaling the container also shrank its hit area,
  // so a tap near the edge lost its finger-up and did nothing (Stage 4 Part A fix).
  // Part C: a small squash on press and a springy release (Reduce effects: no squash).
  const press = (k) => {
    parts.forEach((part) => scene.tweens?.killTweensOf?.(part));
    parts.forEach((part) => part.setScale(k));
  };
  const squash = () => {
    if (!juiceOn()) { fxLog('squash', false); return; }
    fxLog('squash', true);
    parts.forEach((part) => {
      scene.tweens.killTweensOf(part);
      part.setScale(1.04, 0.9);
    });
  };
  const release = () => {
    if (!juiceOn()) { press(1); return; }
    parts.forEach((part) => {
      scene.tweens.killTweensOf(part);
      scene.tweens.add({ targets: part, scaleX: 1, scaleY: 1, duration: 180, ease: 'Back.easeOut' });
    });
  };
  root.on('pointerout', () => {
    press(1);
    draw(false);
  });
  root.on('pointerdown', () => {
    if (opts.swallowTap) scene.swallowTap = true;
    squash();
    Audio.unlock();
    Audio.click();
  });
  root.on('pointerup', () => {
    release();
    onClick();
  });
  if (opts.depth != null) root.setDepth(opts.depth);
  root.setSubtitle = (value) => subtitle?.setText(value);
  return root;
}

export function floatDelta(scene, x, y, delta) {
  if (!delta) return;
  if (!juiceOn()) { fxLog('pop', false); return; }
  fxLog('pop', true);
  const positive = delta > 0;
  const body = Math.abs(delta - Math.round(delta)) > 0.05
    ? Math.abs(delta).toFixed(1)
    : String(Math.abs(Math.round(delta)));
  const label = addText(scene, x, y, `${positive ? '+' : '-'}${body}`, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '22px',
    color: positive ? CONFIG.COLORS.good : CONFIG.COLORS.bad,
    originX: 0.5,
    originY: 0.5,
  }).setDepth(80);
  scene.tweens.add({
    targets: label,
    y: y - 28,
    alpha: 0,
    duration: 700,
    ease: 'Quad.easeOut',
    onComplete: () => label.destroy(),
  });
}

export function tweenNumber(scene, textObj, from, to, format) {
  const counter = { v: from };
  const base = textObj.style.color;
  if (!juiceOn()) {
    // Reduce effects: the number just changes. No count-up, no color flash, no pop-up.
    textObj.setText(format ? format(to) : String(Math.round(to)));
    fxLog('pop', false);
    return;
  }
  if (to > from) textObj.setColor(CONFIG.COLORS.good);
  else if (to < from) textObj.setColor(CONFIG.COLORS.bad);
  const render = (value) => textObj.setText(format ? format(value) : String(Math.round(value)));
  scene.tweens.add({
    targets: counter,
    v: to,
    duration: 460,
    ease: 'Quad.easeOut',
    onUpdate: () => render(counter.v),
    onComplete: () => {
      render(to);
      scene.time.delayedCall(240, () => {
        if (textObj.active) textObj.setColor(base);
      });
    },
  });
  const matrix = textObj.getWorldTransformMatrix();
  floatDelta(scene, matrix.tx, matrix.ty - 6, to - from);
}

export function addSlider(scene, x, y, w, value, onChange) {
  const root = scene.add.container(x, y);
  const track = scene.add.graphics();
  const readout = addText(scene, w + 16, 10, '', {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '20px',
    color: CONFIG.COLORS.orangeCss,
    originX: 0,
    originY: 0,
  });
  const draw = (v) => {
    const clamped = Phaser.Math.Clamp(v, 0, 1);
    track.clear();
    track.fillStyle(0x1a120c, 1);
    track.fillRoundedRect(0, 18, w, 10, 5);
    track.fillStyle(CONFIG.COLORS.orange, 1);
    track.fillRoundedRect(0, 18, Math.max(12, w * clamped), 10, 5);
    track.fillStyle(CONFIG.COLORS.offWhite, 1);
    track.fillCircle(w * clamped, 23, 12);
    track.lineStyle(2, CONFIG.COLORS.rust, 1);
    track.strokeCircle(w * clamped, 23, 12);
    readout.setText(`${Math.round(clamped * 100)}`);
    return clamped;
  };
  draw(value);
  root.add([track, readout]);
  root.setSize(w + 70, 48);
  // Container hit tests add displayOrigin (half the size), so shift the box to
  // cover the whole track (local x -14..w+14, y 0..48), not its top-left corner.
  root.setInteractive({
    hitArea: new Phaser.Geom.Rectangle((w + 70) / 2 - 14, 24, w + 28, 48),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  });
  let dragging = false;
  const fromPointer = (pointer) => {
    const local = pointer.x - root.getWorldTransformMatrix().tx;
    const next = draw(local / w);
    onChange(next);
  };
  root.on('pointerdown', (pointer) => {
    dragging = true;
    fromPointer(pointer);
  });
  const move = (pointer) => {
    if (!dragging || !pointer.isDown) return;
    fromPointer(pointer);
  };
  const up = () => { dragging = false; };
  scene.input.on('pointermove', move);
  scene.input.on('pointerup', up);
  scene.events.once('shutdown', () => {
    scene.input.off('pointermove', move);
    scene.input.off('pointerup', up);
  });
  return root;
}

export function addToggle(scene, x, y, w, label, value, onChange) {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  const text = addText(scene, 58, 24, label, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '22px',
    color: CONFIG.COLORS.text,
    originX: 0,
    originY: 0.5,
  });
  let on = !!value;
  const draw = () => {
    g.clear();
    g.fillStyle(on ? CONFIG.COLORS.orange : 0x1a120c, 1);
    g.fillRoundedRect(0, 8, 42, 32, 6);
    g.lineStyle(2, on ? 0x6a320f : CONFIG.COLORS.rust, 1);
    g.strokeRoundedRect(0, 8, 42, 32, 6);
    g.fillStyle(on ? CONFIG.COLORS.ink : CONFIG.COLORS.offWhite, 1);
    g.fillCircle(on ? 30 : 14, 24, 8);
  };
  draw();
  root.add([g, text]);
  root.setSize(w, 48);
  root.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(w / 2, 24, w, 48), // local 0..w, 0..48 (see addSlider)
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  });
  root.on('pointerup', () => {
    on = !on;
    draw();
    Audio.click();
    onChange(on);
  });
  return root;
}

export function addDialog(scene, opts) {
  const root = scene.add.container(0, 0).setDepth(2200);
  const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.62).setInteractive();
  // Solid backing so the screen underneath doesn't show through the dialog text.
  const backing = scene.add.rectangle(640, 350, 676, 336, 0x0b0f18, 1);
  const panel = addPanel(scene, 300, 180, 680, 340);
  const title = addText(scene, 640, 230, opts.title || '', {
    fontFamily: CONFIG.FONTS.display,
    fontSize: '48px',
    color: CONFIG.COLORS.orangeCss,
    originX: 0.5,
    originY: 0.5,
  });
  const body = addText(scene, 640, 310, opts.body || '', {
    fontFamily: opts.radio ? CONFIG.FONTS.radio : CONFIG.FONTS.body,
    fontSize: '22px',
    color: CONFIG.COLORS.text,
    originX: 0.5,
    originY: 0.5,
    align: 'center',
    wordWrap: { width: 580 },
  });
  root.add([blocker, backing, panel, title, body]);
  const buttons = opts.buttons || [];
  const bw = 250;
  const gap = 24;
  const total = buttons.length * bw + Math.max(0, buttons.length - 1) * gap;
  let bx = 640 - total / 2 + bw / 2;
  const close = () => root.destroy();
  buttons.forEach((button) => {
    const node = addButton(scene, bx, 450, button.label, () => {
      close();
      button.onClick?.();
    }, { w: bw, h: 54, primary: !!button.primary });
    root.add(node);
    bx += bw + gap;
  });
  return { close, root };
}

/** How long a finished line stays up so it can be read (tap skips). */
export function readHold(text, waitForTap) {
  // Radio and intro lines stay up until a tap; the long cap only guards a stuck screen.
  if (waitForTap) return 3600000;
  const sp = Game.settings?.textSpeed || 1;
  return Math.min(12000, Math.max(2000, (1500 + String(text || '').length * 60) / sp));
}

/** Types `full` into `textObj`. `skip()` finishes the line. Calls `onDone` once. */
export function runTypewriter(scene, textObj, full, onDone, withBlips) {
  let index = 0;
  let finished = false;
  const speed = Math.max(25, 70 / (Game.settings?.textSpeed || 1));
  const finish = () => {
    if (finished) return;
    finished = true;
    event.remove(false);
    if (textObj?.scene && textObj.canvas) textObj.setText(full);
    onDone();
  };
  const event = scene.time.addEvent({
    delay: speed,
    loop: true,
    callback: () => {
      index += 1;
      if (!textObj?.scene || !textObj.canvas) { finish(); return; }
      textObj.setText(full.slice(0, index));
      if (withBlips && index % 3 === 0) Audio.blip();
      if (index >= full.length) finish();
    },
  });
  return { skip: finish, cancel: () => event.remove(false) };
}
