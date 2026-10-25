import Phaser from './phaser.js?v=2';
import { CONFIG } from './config.js?v=2';
import { addText } from './ui.js?v=2';

export function dialAngle(mhz) {
  const t = Phaser.Math.Clamp((mhz - 88) / 20, 0, 1);
  return -62 + t * 124;
}

export function addCornerDial(scene, x, y) {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x121820, 0.92);
  g.fillCircle(0, 0, 58);
  g.lineStyle(3, CONFIG.COLORS.rust, 1);
  g.strokeCircle(0, 0, 58);
  g.lineStyle(2, CONFIG.COLORS.orange, 0.9);
  g.beginPath();
  g.arc(0, 0, 38, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
  g.strokePath();
  g.fillStyle(CONFIG.COLORS.orange, 0.9);
  g.fillCircle(0, 0, 4);
  const needle = scene.add.rectangle(0, -4, 3, 34, CONFIG.COLORS.orange).setOrigin(0.5, 1);
  needle.angle = dialAngle(88.3);
  const label = addText(scene, 0, 68, CONFIG.STATION, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '16px',
    color: CONFIG.COLORS.orangeCss,
    originX: 0.5,
    originY: 0.5,
  });
  root.add([g, needle, label]);
  if (!scene.game?.loop) return root;
  scene.tweens.add({
    targets: needle,
    angle: needle.angle + 2.5,
    duration: 220,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  return root;
}

export function addStudioRadio(scene, x, y) {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x2a170f, 1);
  g.fillRoundedRect(0, 0, 520, 280, 18);
  g.fillStyle(0x4a2c1c, 1);
  g.fillRoundedRect(14, 14, 492, 252, 12);
  g.lineStyle(3, 0x1a0d08, 1);
  g.strokeRoundedRect(14, 14, 492, 252, 12);

  g.fillStyle(0x140e0b, 1);
  g.fillRoundedRect(36, 48, 180, 150, 8);
  g.fillStyle(0xc9a27a, 0.35);
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      g.fillCircle(54 + col * 20, 68 + row * 18, 3);
    }
  }

  g.fillStyle(0x1a140c, 1);
  g.fillRoundedRect(240, 46, 230, 150, 8);
  g.fillStyle(0xe7d7b1, 1);
  g.fillRoundedRect(252, 58, 206, 110, 4);
  g.lineStyle(2, CONFIG.COLORS.rust, 1);
  g.strokeRoundedRect(252, 58, 206, 110, 4);
  g.lineStyle(1, 0x6e3a22, 0.7);
  g.beginPath();
  g.arc(355, 168, 78, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
  g.strokePath();

  root.add(g);
  [88, 96, 104].forEach((mhz, index) => {
    const mark = addText(scene, 292 + index * 62, 78, String(mhz), {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '14px',
      color: '#3a2418',
      originX: 0.5,
      originY: 0,
    });
    root.add(mark);
  });

  g.fillStyle(0x1a0d08, 1);
  g.fillCircle(110, 230, 22);
  g.fillCircle(400, 230, 22);
  g.lineStyle(3, CONFIG.COLORS.orange, 0.8);
  g.strokeCircle(110, 230, 22);
  g.strokeCircle(400, 230, 22);
  g.fillStyle(CONFIG.COLORS.orange, 0.95);
  g.fillCircle(470, 36, 6);

  const needle = scene.add.rectangle(355, 168, 3, 70, 0x8a2a12).setOrigin(0.5, 1);
  needle.angle = 60;
  const plate = addText(scene, 260, 214, 'ORWELL RADIO CO.', {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '16px',
    color: '#e7d3ae',
    originX: 0.5,
    originY: 0,
  });
  root.add([needle, plate]);

  return {
    root,
    needle,
    sweepTo(mhz, duration = 1300) {
      let settled = false;
      let tween = null;
      let finish = () => {};
      const promise = new Promise((resolve) => {
        finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        const status = scene.sys?.settings?.status;
        if (status === undefined || status > Phaser.Scenes.RUNNING) {
          finish();
          return;
        }
        tween = scene.tweens.add({
          targets: needle,
          angle: dialAngle(mhz),
          duration,
          ease: 'Cubic.easeInOut',
          onComplete: () => finish(),
        });
      });
      promise.skip = () => {
        tween?.stop();
        needle.angle = dialAngle(mhz);
        finish();
      };
      return promise;
    },
  };
}
