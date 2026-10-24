import Phaser from './phaser.js?v=6';
import { CONFIG } from './config.js?v=6';
import { Game, bus } from './state.js?v=6';
import { scratchGrain } from './textures.js?v=6';

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
