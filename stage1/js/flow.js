import { HUD_SCENES } from './config.js';
import { Audio } from './audio.js';
import { fadeIn } from './fx.js';
import { Save } from './save.js';
import { Game } from './state.js';
import { EARLY_END_LINE } from './logic.js';

export function goTo(scene, key, data) {
  if (!scene.sys?.isActive() || scene._leaving) return;
  scene._leaving = true;
  scene.events.once('shutdown', () => { scene._leaving = false; });
  Game.hudLock = false;
  let left = false;
  const leaveNow = () => {
    if (left) return;
    left = true;
    try {
      scene.scene.start(key, data || {});
    } catch (error) {
      console.error('[PREPPER] Scene change failed.', error);
      scene.game?.scene?.start(key, data || {});
    }
  };
  try {
    scene.cameras.main.fadeOut(280, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', leaveNow);
    scene.time.delayedCall(700, leaveNow);
  } catch (error) {
    console.error('[PREPPER] Fade failed.', error);
  }
  window.setTimeout(leaveNow, 1200);
  try { Audio.staticBurst(0.28); } catch (error) { console.warn('[PREPPER] Audio hiccup.', error); }
}

/** Saves, remembers where to resume, then changes scene. */
export function leave(scene, key, data) {
  const state = Game.state;
  if (state) {
    state.lastScene = key;
    Save.write(state);
  }
  goTo(scene, key, data);
}

/** Health hit zero before day 30. The ending screen still has a way out. */
export function endRun(scene) {
  const state = Game.state;
  if (!state) {
    goTo(scene, 'Title');
    return;
  }
  state.ending = 'early';
  state.flags = state.flags || {};
  state.flags.endingLine = EARLY_END_LINE;
  leave(scene, 'Ending');
}

export function beginScene(scene) {
  fadeIn(scene, 320);
}

export function showHud(scene) {
  if (!HUD_SCENES.has(scene.scene.key)) return;
  const manager = scene.scene;
  if (manager.isActive('HUD')) {
    manager.get('HUD')?.closeNote?.();
    manager.bringToTop('HUD');
    return;
  }
  manager.launch('HUD');
  manager.bringToTop('HUD');
}

export function hideHud(scene) {
  const manager = scene.scene;
  if (manager.isActive('HUD') || manager.isSleeping('HUD')) manager.stop('HUD');
}
