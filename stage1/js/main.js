import Phaser from './phaser.js';
import { CONFIG } from './config.js';
import { Game } from './state.js';
import { Save } from './save.js';
import { Audio } from './audio.js';
import { BootScene } from './scenes/boot.js';
import { TitleScene } from './scenes/title.js';
import { NameScene } from './scenes/name.js';
import { IntroScene } from './scenes/intro.js';
import { SettingsScene } from './scenes/settings.js';
import { CreditsScene } from './scenes/credits.js';
import { HudScene } from './scenes/hud.js';
import { RadioScene } from './scenes/radio.js';
import { MapScene } from './scenes/map.js';
import { ScavengeScene } from './scenes/scavenge.js';
import { BunkerScene } from './scenes/bunker.js';
import { NightScene } from './scenes/night.js';
import { ApocalypseScene } from './scenes/apocalypse.js';
import { SurvivalScene } from './scenes/survival.js';
import { EndingScene } from './scenes/ending.js';

Save.boot();
Audio.applySettings(Game.settings);
Game.dev = new URLSearchParams(globalThis.location?.search || '').get('dev') === '1';

const unlock = () => Audio.unlock();
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);

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
    HudScene,
  ],
});
