import Phaser from './phaser.js?v=2';
import { CONFIG } from './config.js?v=2';
import { Game } from './state.js?v=2';
import { Save } from './save.js?v=2';
import { Audio } from './audio.js?v=2';
import { BootScene } from './scenes/boot.js?v=2';
import { TitleScene } from './scenes/title.js?v=2';
import { NameScene } from './scenes/name.js?v=2';
import { IntroScene } from './scenes/intro.js?v=2';
import { PerkScene } from './scenes/perk.js?v=2';
import { SettingsScene } from './scenes/settings.js?v=2';
import { CreditsScene } from './scenes/credits.js?v=2';
import { HudScene } from './scenes/hud.js?v=2';
import { RadioScene } from './scenes/radio.js?v=2';
import { MapScene } from './scenes/map.js?v=2';
import { ScavengeScene } from './scenes/scavenge.js?v=2';
import { BunkerScene } from './scenes/bunker.js?v=2';
import { NightScene } from './scenes/night.js?v=2';
import { ApocalypseScene } from './scenes/apocalypse.js?v=2';
import { SurvivalScene } from './scenes/survival.js?v=2';
import { EndingScene } from './scenes/ending.js?v=2';
import { AchievementsScene } from './scenes/achwall.js?v=2';
import { ToastScene } from './scenes/toast.js?v=2';
import './achdev.js?v=2';
import './heist.js?v=2';

Save.boot();
Audio.applySettings(Game.settings);
Game.dev = new URLSearchParams(globalThis.location?.search || '').get('dev') === '1';

const unlock = () => Audio.unlock();
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

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
    EndingScene,
    AchievementsScene,
    HudScene,
    ToastScene,
  ],
});
