import Phaser from './phaser.js?v=3';
import { CONFIG } from './config.js?v=3';
import { Game } from './state.js?v=3';
import { Save } from './save.js?v=3';
import { Audio } from './audio.js?v=3';
import { BootScene } from './scenes/boot.js?v=3';
import { TitleScene } from './scenes/title.js?v=3';
import { NameScene } from './scenes/name.js?v=3';
import { IntroScene } from './scenes/intro.js?v=3';
import { SettingsScene } from './scenes/settings.js?v=3';
import { CreditsScene } from './scenes/credits.js?v=3';
import { HudScene } from './scenes/hud.js?v=3';
import { RadioScene } from './scenes/radio.js?v=3';
import { MapScene } from './scenes/map.js?v=3';
import { ScavengeScene } from './scenes/scavenge.js?v=3';
import { BunkerScene } from './scenes/bunker.js?v=3';
import { NightScene } from './scenes/night.js?v=3';
import { ApocalypseScene } from './scenes/apocalypse.js?v=3';
import { SurvivalScene } from './scenes/survival.js?v=3';
import { EndingScene } from './scenes/ending.js?v=3';

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
