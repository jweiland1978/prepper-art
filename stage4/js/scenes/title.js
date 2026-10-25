import Phaser from '../phaser.js?v=1';
import { CONFIG } from '../config.js?v=1';
import { Game, bus, newRun, replaceState } from '../state.js?v=1';
import { devBootRun, devGrant, mountDevTools } from '../dev.js?v=1';
import { claimLegacyRun } from '../meta.js?v=1';
import { Save } from '../save.js?v=1';
import { Audio } from '../audio.js?v=1';
import { addButton, addDialog, addText } from '../ui.js?v=1';
import { attachAtmosphere } from '../fx.js?v=1';
import { beginScene, goTo } from '../flow.js?v=1';
import { addCornerDial } from '../widgets.js?v=1';
import { achUnlocked, devGrantAch, devSetRun } from '../achievements.js?v=1';
import { readMeta, resetMeta } from '../meta.js?v=1';
import { showAchUnlockCard } from './achcard.js?v=1';

const DEV_RUNS = [1, 2, 3, 6];

const GAMEPLAY = new Set([
  'Radio', 'Map', 'Scavenge', 'Bunker', 'NightSummary', 'Apocalypse', 'Survival', 'Ending',
]);

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.tuned = false;
    beginScene(this);
    this.cameras.main.setBackgroundColor('#070b12');
    Game.saveStatus = Save.peek();
    Audio.stopMusic();

    const bg = this.add.image(640, 360, 'bg-title').setScale(1.04);
    this.tweens.add({
      targets: bg,
      scale: 1,
      x: 640,
      y: 360,
      duration: 5600,
      ease: 'Sine.easeOut',
    });

    const glow = this.add.circle(370, 600, 78, CONFIG.COLORS.orange, 0.22).setBlendMode(Phaser.BlendModes.ADD);
    this.glow = this.tweens.add({
      targets: glow,
      alpha: 0.08,
      scale: 1.16,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.image(644, 132, 'logo-prepper').setScale(0.74).setTint(CONFIG.COLORS.rust).setAlpha(0.55).setDepth(40);
    this.add.image(640, 128, 'logo-prepper').setScale(0.74).setDepth(41);
    const rule = this.add.graphics().setDepth(42);
    rule.fillStyle(CONFIG.COLORS.orange, 1);
    rule.fillRect(430, 214, 420, 4);
    rule.fillStyle(0x6a320f, 0.8);
    rule.fillRect(430, 219, 300, 2);
    addText(this, 640, 248, CONFIG.TAGLINE, {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '20px',
      color: CONFIG.COLORS.text,
      originX: 0.5,
      originY: 0.5,
      align: 'center',
      wordWrap: { width: 760 },
    }).setDepth(42).setShadow(0, 2, '#000000', 6, true, true);

    this.layoutButtons();
    addText(this, 1256, 22, CONFIG.STAGE_LABEL, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '18px',
      color: CONFIG.COLORS.orangeCss,
      originX: 1,
      originY: 0,
    }).setDepth(70).setShadow(0, 1, '#000000', 4, true, true);
    addText(this, 24, 688, CONFIG.AI_CREDIT, {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '14px',
      color: CONFIG.COLORS.text,
      originX: 0,
      originY: 1,
    }).setDepth(70).setShadow(0, 1, '#000000', 4, true, true);

    this.dial = addCornerDial(this, 1188, 560);
    this.dial.setDepth(50);
    this.prompt = addText(this, 1188, 470, 'Tap to tune in', {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '18px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(70);
    this.tweens.add({
      targets: this.prompt,
      alpha: 0.35,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    attachAtmosphere(this, { rain: true, depth: 24 });
    this.offAudio = bus.on('audio-unlocked', () => this.tuneIn());
    if (Audio.unlocked) this.tuneIn();
    this.applyEffects();
    this.offSettings = bus.on('settings', () => this.applyEffects());
    this.events.once('shutdown', () => {
      this.offAudio?.();
      this.offSettings?.();
      Audio.stopStatic();
      Audio.stopRain();
    });

    if (Game.saveStatus.corrupt) this.offerFreshStart();
    mountDevTools(this, {
      mode: 'row',
      y: 618,
      onSkip: (day) => {
        devBootRun(day);
        goTo(this, 'Radio');
      },
      onGrant: () => {
        devGrant(newRun('Neighbor'));
        goTo(this, 'Radio');
      },
    });
    this.mountAchDev();
    if (readMeta().achCardPending) {
      this.time.delayedCall(500, () => {
        if (this.sys?.isActive()) showAchUnlockCard(this, { depth: 3000 });
      });
    }
  }

  /** ?dev=1 only: achievement test buttons (left column). */
  mountAchDev() {
    if (!Game.dev) return;
    const flash = (msg) => {
      console.log(`[PREPPER] ${msg}`);
      const t = addText(this, 640, 290, msg, {
        fontFamily: CONFIG.FONTS.heading, fontSize: '20px', color: CONFIG.COLORS.orangeCss, originX: 0.5, originY: 0.5,
      }).setDepth(120);
      this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 400, onComplete: () => t.destroy() });
    };
    const meta = readMeta();
    addText(this, 120, 318, `DEV  runs ${meta.runCount}  done ${meta.finishedRuns}  ach ${achUnlocked() ? 'on' : 'off'}`, {
      fontFamily: CONFIG.FONTS.heading, fontSize: '14px', color: CONFIG.COLORS.orangeCss, originX: 0.5, originY: 0.5,
    }).setDepth(80);
    addButton(this, 120, 360, 'GRANT ACH', () => {
      const name = devGrantAch();
      flash(name ? `Granted: ${name}` : 'All achievements earned.');
    }, { w: 170, h: 40, fontSize: '15px', depth: 80 });
    addButton(this, 120, 410, 'RESET META', () => {
      resetMeta();
      this.scene.restart();
    }, { w: 170, h: 40, fontSize: '15px', depth: 80 });
    const now = Math.max(1, (meta.runCount || 0) + 1);
    const nextPick = DEV_RUNS.find((n) => n > now) || DEV_RUNS[0];
    addButton(this, 120, 460, `SET RUN # ${nextPick}`, () => {
      devSetRun(nextPick);
      this.scene.restart();
    }, { w: 170, h: 40, fontSize: '15px', depth: 80 });
  }

  applyEffects() {
    if (Game.settings?.reduceEffects) this.glow?.pause();
    else this.glow?.resume();
  }

  tuneIn() {
    if (this.tuned) return;
    this.tuned = true;
    this.prompt?.setVisible(false);
    Audio.startStatic(0.03);
    Audio.startRain();
  }

  layoutButtons() {
    const save = Game.saveStatus;
    const items = [
      { label: 'NEW GAME', primary: true, action: () => this.onNewGame() },
    ];
    if (save?.ok && !save.data?.finished) {
      items.push({
        label: 'CONTINUE',
        primary: false,
        subtitle: `Day ${save.data.day}, ${save.data.name}`,
        action: () => this.onContinue(),
      });
    }
    if (achUnlocked()) {
      items.push({ label: 'ACHIEVEMENTS', primary: false, action: () => goTo(this, 'Achievements') });
    }
    items.push(
      { label: 'SETTINGS', primary: false, action: () => goTo(this, 'Settings', { from: 'Title' }) },
      { label: 'CREDITS', primary: false, action: () => goTo(this, 'Credits', { from: 'Title' }) },
    );
    const tight = items.length >= 5;
    let y = 318;
    items.forEach((item) => {
      addButton(this, 640, y, item.label, item.action, {
        w: 320,
        h: item.subtitle ? (tight ? 60 : 64) : (tight ? 50 : 56),
        primary: item.primary,
        subtitle: item.subtitle,
        depth: 60,
      });
      y += item.subtitle ? (tight ? 70 : 78) : (tight ? 60 : 70);
    });
  }

  onNewGame() {
    try { Audio.unlock(); } catch (error) { console.warn('[PREPPER] Audio hiccup.', error); }
    if (Game.saveStatus?.ok && !Game.saveStatus.data?.finished) {
      addDialog(this, {
        title: 'START OVER',
        body: 'Leave the current save in the drawer and begin again?',
        buttons: [
          { label: 'NEVER MIND' },
          { label: 'NEW GAME', primary: true, onClick: () => goTo(this, 'NameEntry') },
        ],
      });
      return;
    }
    goTo(this, 'NameEntry');
  }

  onContinue() {
    // Same as NEW GAME: unlock inside the tap so iOS really resumes the context,
    // and cut the title hiss now instead of after the fade.
    try { Audio.unlock(); Audio.stopStatic(); } catch (error) { console.warn('[PREPPER] Audio hiccup.', error); }
    const loaded = Save.peek();
    if (!loaded.ok || loaded.data?.finished) {
      this.offerFreshStart();
      return;
    }
    if (loaded.data.flags?.fromStage2) claimLegacyRun();
    replaceState(loaded.data);
    const key = GAMEPLAY.has(loaded.data.lastScene) ? loaded.data.lastScene : 'Radio';
    goTo(this, key);
  }

  offerFreshStart() {
    addDialog(this, {
      title: 'BENT SAVE',
      body: 'This save is bent, or from an older apocalypse. Start fresh?',
      buttons: [
        { label: 'NOT NOW' },
        {
          label: 'START FRESH',
          primary: true,
          onClick: () => {
            Save.deleteSave();
            this.scene.restart();
          },
        },
      ],
    });
  }
}

