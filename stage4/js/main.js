import Phaser from './phaser.js?v=5';
import { CONFIG } from './config.js?v=5';
import { Game } from './state.js?v=5';
import { Save } from './save.js?v=5';
import { Audio } from './audio.js?v=5';
import { BootScene } from './scenes/boot.js?v=5';
import { TitleScene } from './scenes/title.js?v=5';
import { NameScene } from './scenes/name.js?v=5';
import { IntroScene } from './scenes/intro.js?v=5';
import { PerkScene } from './scenes/perk.js?v=5';
import { SettingsScene } from './scenes/settings.js?v=5';
import { CreditsScene } from './scenes/credits.js?v=5';
import { HudScene } from './scenes/hud.js?v=5';
import { RadioScene } from './scenes/radio.js?v=5';
import { MapScene } from './scenes/map.js?v=5';
import { ScavengeScene } from './scenes/scavenge.js?v=5';
import { BunkerScene } from './scenes/bunker.js?v=5';
import { NightScene } from './scenes/night.js?v=5';
import { ApocalypseScene } from './scenes/apocalypse.js?v=5';
import { SurvivalScene } from './scenes/survival.js?v=5';
import { EndingScene } from './scenes/ending.js?v=5';
import { TowerScene } from './scenes/tower.js?v=5';
import { AchievementsScene } from './scenes/achwall.js?v=5';
import { ToastScene } from './scenes/toast.js?v=5';
import { FieldGuideScene } from './scenes/fieldguide.js?v=5';
import './achdev.js?v=5';
import './heist.js?v=5';

Save.boot();
Audio.applySettings(Game.settings);
Game.dev = new URLSearchParams(globalThis.location?.search || '').get('dev') === '1';

const unlock = () => Audio.unlock();
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
// Part C: iOS only lets audio start inside certain gestures (touchend / click), so the very
// first tap unlocks on whichever of these it gets.
window.addEventListener('touchend', unlock, { passive: true });
window.addEventListener('pointerup', unlock);
window.addEventListener('click', unlock);

// Stop the radio hiss (and everything else) while the game can't be seen.
const portrait = window.matchMedia ? window.matchMedia('(orientation: portrait) and (max-width: 900px)') : null;
const syncHidden = () => Audio.setHidden(document.hidden || !!portrait?.matches);
document.addEventListener('visibilitychange', syncHidden);
window.addEventListener('pagehide', () => Audio.setHidden(true));
window.addEventListener('pageshow', syncHidden);
portrait?.addEventListener?.('change', syncHidden);

globalThis.__PREPPER_GAME = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: '#070b12',
  banner: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
  },
  fps: { target: 60 },
  audio: { disableWebAudio: true },
  scene: [
    BootScene,
    TitleScene,
    NameScene,
    PerkScene,
    IntroScene,
    SettingsScene,
    CreditsScene,
    RadioScene,
    MapScene,
    ScavengeScene,
    BunkerScene,
    NightScene,
    ApocalypseScene,
    SurvivalScene,
    TowerScene,
    EndingScene,
    AchievementsScene,
    FieldGuideScene,
    HudScene,
    ToastScene,
  ],
});
