import Phaser from './phaser.js?v=3';
import { CONFIG } from './config.js?v=3';
import { Game, bus } from './state.js?v=3';
import { apocalypseOf, endArtKey } from './rumors.js?v=3';
import { scratchGrain } from './textures.js?v=3';

export function effectsOn() {
  return !Game.settings?.reduceEffects;
}

export function shake(scene, ms = 160, intensity = 0.004) {
  if (!effectsOn()) return;
  scene.cameras.main.shake(ms, intensity);
}

export function attachAtmosphere(scene, opts = {}) {
  const vignette = scene.add.image(640, 360, 'vignette').setDepth(opts.depth || 20).setAlpha(0.92);
  const scan = scene.add.tileSprite(640, 360, 1280, 720, 'scanlines').setDepth((opts.depth || 20) + 1).setAlpha(0.2);
  const grain = scene.add.tileSprite(640, 360, 1280, 720, 'grain').setDepth((opts.depth || 20) + 2).setAlpha(0.16);
  let frame = 0;

  const sync = () => {
    const on = effectsOn();
    grain.setVisible(on);
    scan.setVisible(on);
  };
  sync();

  let rain = null;
  let ash = null;
  let splash = null;

  const stopWeather = () => {
    rain?.destroy();
    ash?.destroy();
    splash?.destroy();
    rain = null;
    ash = null;
    splash = null;
  };

  const setWeather = (mode) => {
    stopWeather();
    if (mode === 'rain') {
      rain = scene.add.particles(0, 0, 'p-drop', {
        x: { min: -40, max: 1380 },
        y: -20,
        lifespan: 1300,
        speedX: { min: -150, max: -40 },
        speedY: { min: 420, max: 680 },
        scale: { min: 0.45, max: 1 },
        quantity: 2,
        frequency: 36,
        alpha: { start: 0.35, end: 0.05 },
      }).setDepth(12);
      splash = scene.add.particles(0, 690, 'p-splash', {
        x: { min: 0, max: 1280 },
        lifespan: 280,
        speedY: { min: -20, max: -60 },
        scaleX: { min: 0.4, max: 1.2 },
        quantity: 1,
        frequency: 180,
        alpha: { start: 0.35, end: 0 },
      }).setDepth(13);
    } else if (mode === 'ash') {
      ash = scene.add.particles(0, 0, 'p-ash', {
        x: { min: -20, max: 1300 },
        y: -10,
        lifespan: 4200,
        speedX: { min: -28, max: 18 },
        speedY: { min: 28, max: 70 },
        scale: { min: 0.35, max: 1.1 },
        quantity: 1,
        frequency: 70,
        alpha: { start: 0.45, end: 0 },
        tint: 0xc8c2b8,
      }).setDepth(12);
    }
  };

  if (opts.ash) setWeather('ash');
  else if (opts.rain) setWeather('rain');

  const onUpdate = () => {
    if (!effectsOn()) return;
    frame += 1;
    grain.tilePositionX += 1.4;
    grain.tilePositionY += 0.6;
    if (frame % 18 === 0) {
      grain.tilePositionX = Math.random() * 64;
      scratchGrain(scene);
    }
  };

  const offSettings = bus.on('settings', sync);
  scene.events.on('update', onUpdate);
  scene.events.once('shutdown', () => {
    scene.events.off('update', onUpdate);
    offSettings();
    stopWeather();
    vignette.destroy();
    scan.destroy();
    grain.destroy();
  });

  return { setWeather, vignette, grain, scan };
}

export function fadeIn(scene, ms = 340) {
  scene.cameras.main.fadeIn(ms, 0, 0, 0);
}

/** Day 30 / survival / ending painting, with a code fallback already in ensureArt. */
export function coverEnd(scene, state, opts = {}) {
  const wanted = endArtKey(state);
  const fallback = opts.fallback || 'bg-mainstreet';
  const key = scene.textures.exists(wanted)
    ? wanted
    : (scene.textures.exists(fallback) ? fallback : null);
  if (!key) return null;
  const image = scene.add.image(640, opts.y ?? 360, key).setDepth(opts.depth ?? 0);
  const scale = Math.max(CONFIG.WIDTH / (image.width || CONFIG.WIDTH), CONFIG.HEIGHT / (image.height || CONFIG.HEIGHT));
  image.setScale(scale);
  if (opts.tint != null) image.setTint(opts.tint);
  if (opts.alpha != null) image.setAlpha(opts.alpha);
  return image;
}

/** Code-drawn sky on top of the end painting. Static if Reduce effects is on. */
export function paintApocSky(scene, state) {
  const id = apocalypseOf(state);
  const g = scene.add.graphics().setDepth(4);
  const on = effectsOn();
  if (id === 'zombies') {
    g.fillStyle(0x6a8a3a, 0.22);
    g.fillCircle(1080, 90, on ? 70 : 58);
    g.fillStyle(0x6a8a3a, 0.08);
    g.fillCircle(1080, 90, 120);
  } else if (id === 'solarflare') {
    g.fillStyle(0x2ee06a, 0.18);
    g.fillEllipse(640, 40, 980, 90);
    g.fillStyle(0xe04a3a, 0.14);
    g.fillEllipse(520, 70, 720, 50);
    g.fillStyle(0x7cff9a, 0.12);
    g.fillEllipse(820, 30, 540, 36);
    if (on) {
      scene.tweens.add({
        targets: g,
        alpha: { from: 0.7, to: 1 },
        duration: 1800,
        yoyo: true,
        repeat: -1,
      });
    }
  } else if (id === 'robots') {
    const eyes = [[180, 120], [320, 80], [980, 100], [1120, 70], [640, 50], [860, 140]];
    eyes.forEach((pair, index) => {
      g.fillStyle(0x7ad0ff, 0.85);
      g.fillCircle(pair[0], pair[1], 4 + (index % 3));
      g.fillStyle(0x7ad0ff, 0.2);
      g.fillCircle(pair[0], pair[1], 14);
    });
    if (on) {
      scene.tweens.add({
        targets: g,
        alpha: { from: 0.45, to: 1 },
        duration: 420,
        yoyo: true,
        repeat: -1,
      });
    }
  } else if (id === 'meteor') {
    g.lineStyle(6, 0xff8c28, 0.85);
    g.lineBetween(180, 40, 620, 280);
    g.lineStyle(2, 0xffe0b0, 0.7);
    g.lineBetween(170, 30, 610, 270);
    g.fillStyle(0xff8c28, 0.35);
    g.fillCircle(640, 292, 16);
    g.fillStyle(0xffe0b0, 0.5);
    g.fillCircle(640, 292, 6);
  } else if (id === 'bigmoon') {
    g.fillStyle(0xe6d7b8, 0.88);
    g.fillCircle(980, 120, 160);
    g.fillStyle(0xc4b49a, 0.35);
    g.fillCircle(940, 90, 40);
    g.fillCircle(1040, 160, 28);
    g.fillStyle(0xb8d4e6, 0.12);
    g.fillEllipse(640, 680, 1100, 80);
  }
  return g;
}

/** Code-drawn ending score card. There is no bg-end-card image. */
export function drawScoreCard(scene, x, y, w, h) {
  const g = scene.add.graphics().setDepth(22);
  g.fillStyle(0x000000, 0.45);
  g.fillRoundedRect(x + 10, y + 12, w, h, 10);
  g.fillStyle(0x0c1424, 0.94);
  g.fillRoundedRect(x, y, w, h, 10);
  g.lineStyle(3, CONFIG.COLORS.rust, 1);
  g.strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 10);
  g.lineStyle(1, 0xc47a45, 0.35);
  g.strokeRoundedRect(x + 6, y + 6, w - 12, h - 12, 8);
  g.lineStyle(8, 0x000000, 0.18);
  g.strokeRoundedRect(x + 10, y + 10, w - 20, h - 20, 6);
  g.fillStyle(CONFIG.COLORS.orange, 0.9);
  g.fillRect(x + 24, y + 18, 120, 4);
  g.fillRect(x + w - 144, y + 18, 120, 4);
  return g;
}

export function tuningWipe(scene, key, data) {
  if (scene._leaving) return;
  scene._leaving = true;
  scene.events.once('shutdown', () => { scene._leaving = false; });
  const band = { y: 0 };
  const g = scene.add.graphics().setDepth(3000);
  scene.tweens.add({
    targets: band,
    y: CONFIG.HEIGHT,
    duration: 480,
    ease: 'Cubic.easeIn',
    onUpdate: () => {
      g.clear();
      g.fillStyle(0x07080c, 1);
      g.fillRect(0, 0, CONFIG.WIDTH, band.y);
      g.lineStyle(2, CONFIG.COLORS.orange, 0.85);
      g.lineBetween(0, band.y, CONFIG.WIDTH, band.y);
    },
    onComplete: () => scene.scene.start(key, data || {}),
  });
}
