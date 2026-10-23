import { CONFIG } from '../config.js?v=4';
import { Audio } from '../audio.js?v=4';
import { addText, runTypewriter, readHold } from '../ui.js?v=4';

/** Shared tap-to-skip typewriter. A button can always be shown if the promise rejects. */
export function makeTyper(scene) {
  const api = {
    dead: false,
    skipWait: null,
    typer: null,
    skip() {
      Audio.unlock();
      api.skipWait?.();
    },
    say(textObj, text, blips = true) {
      if (api.dead) return Promise.resolve();
      textObj.setText('');
      return new Promise((resolve) => {
        api.typer = runTypewriter(scene, textObj, text, () => {
          if (api.dead) { api.skipWait = null; resolve(); return; }
          const hold = scene.time.delayedCall(readHold(text, scene.tapToContinue), () => {
            api.skipWait = null;
            resolve();
          });
          api.skipWait = () => {
            hold.remove(false);
            api.skipWait = null;
            resolve();
          };
        }, blips);
        api.skipWait = () => api.typer?.skip();
      });
    },
    wait(ms) {
      if (api.dead) return Promise.resolve();
      return new Promise((resolve) => {
        const timer = scene.time.delayedCall(ms, () => {
          api.skipWait = null;
          resolve();
        });
        api.skipWait = () => {
          timer.remove(false);
          api.skipWait = null;
          resolve();
        };
      });
    },
    banner(text) {
      if (api.dead) return Promise.resolve();
      return new Promise((resolve) => {
        const root = scene.add.container(0, 0).setDepth(90);
        const dim = scene.add.rectangle(640, 360, 1280, 720, 0x070b12, 0.78).setInteractive();
        const label = addText(scene, 640, 330, text, {
          fontFamily: CONFIG.FONTS.display,
          fontSize: '96px',
          color: CONFIG.COLORS.orangeCss,
          originX: 0.5,
          originY: 0.5,
          align: 'center',
          wordWrap: { width: 1100 },
        });
        const sub = addText(scene, 640, 430, 'Tap', {
          fontFamily: CONFIG.FONTS.body,
          fontSize: '16px',
          color: CONFIG.COLORS.textMuted,
          originX: 0.5,
          originY: 0.5,
        });
        root.add([dim, label, sub]);
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          api.skipWait = null;
          root.destroy();
          resolve();
        };
        api.skipWait = finish;
        scene.time.delayedCall(1400, finish);
      });
    },
  };
  scene.input.on('pointerdown', () => api.skip());
  scene.events.once('shutdown', () => {
    api.dead = true;
    api.typer?.cancel();
    api.skipWait?.();
  });
  return api;
}
