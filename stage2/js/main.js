import Phaser from './phaser.js?v=4';
import { CONFIG } from './config.js?v=4';
import { Game } from './state.js?v=4';
import { Save } from './save.js?v=4';
import { Audio } from './audio.js?v=4';
import { BootScene } from './scenes/boot.js?v=4';
import { TitleScene } from './scenes/title.js?v=4';
import { NameScene } from './scenes/name.js?v=4';
import { IntroScene } from './scenes/intro.js?v=4';
import { SettingsScene } from './scenes/settings.js?v=4';
import { CreditsScene } from './scenes/credits.js?v=4';
import { HudScene } from './scenes/hud.js?v=4';
import { RadioScene } from './scenes/radio.js?v=4';
import { MapScene } from './scenes/map.js?v=4';
import { ScavengeScene } from './scenes/scavenge.js?v=4';
import { BunkerScene } from './scenes/bunker.js?v=4';
import { NightScene } from './scenes/night.js?v=4';
import { ApocalypseScene } from './scenes/apocalypse.js?v=4';
import { SurvivalScene } from './scenes/survival.js?v=4';
import { EndingScene } from './scenes/ending.js?v=4';
import './heist.js?v=4';

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
