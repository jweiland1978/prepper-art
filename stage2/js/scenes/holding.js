import { CONFIG } from '../config.js?v=4';
import { Game } from '../state.js?v=4';
import { Audio } from '../audio.js?v=4';
import { addButton, addPanel, addText } from '../ui.js?v=4';
import { attachAtmosphere } from '../fx.js?v=4';
import { beginScene, goTo, hideHud, showHud } from '../flow.js?v=4';

export function holding(scene, opts) {
  beginScene(scene);
  scene.cameras.main.setBackgroundColor('#070b12');
  if (opts.bg && scene.textures.exists(opts.bg)) {
    const image = scene.add.image(640, 360, opts.bg).setAlpha(opts.alpha ?? 0.5);
    if (opts.tint) image.setTint(opts.tint);
  }
  attachAtmosphere(scene, { rain: !!opts.rain, ash: !!opts.ash, depth: 8 });
  addPanel(scene, 230, 150, 820, 380).setDepth(20);
  if (opts.kicker) {
    addText(scene, 640, 190, opts.kicker, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '18px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(22);
  }
  addText(scene, 640, 250, opts.title, {
    fontFamily: CONFIG.FONTS.display,
    fontSize: '52px',
    color: CONFIG.COLORS.text,
    originX: 0.5,
    originY: 0.5,
    align: 'center',
    wordWrap: { width: 740 },
  }).setDepth(22);
  addText(scene, 640, 340, opts.body, {
    fontFamily: CONFIG.FONTS.radio,
    fontSize: '22px',
    color: CONFIG.COLORS.textMuted,
    originX: 0.5,
    originY: 0.5,
    align: 'center',
    wordWrap: { width: 700 },
  }).setDepth(22);
  addButton(scene, 640, 460, 'BACK TO TITLE', () => {
    Game.hudLock = false;
    hideHud(scene);
    Audio.stopMusic();
    Audio.stopRain();
    Audio.stopSirens();
    Audio.stopGenerator();
    goTo(scene, 'Title');
  }, { w: 300, h: 56, primary: true, depth: 24 });

  if (opts.hud) showHud(scene);
  else hideHud(scene);
  if (opts.music) Audio.startMusic(opts.music);
  if (opts.rain) Audio.startRain();
  else Audio.stopRain();

  scene.events.once('shutdown', () => {
    Audio.stopRain();
  });
}
