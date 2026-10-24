import Phaser from '../phaser.js?v=6';
import { CONFIG, countdownPhrase } from '../config.js?v=6';
import { moraleWord } from '../crew.js?v=6';
import { Game, bus, formatStat } from '../state.js?v=6';
import { Audio } from '../audio.js?v=6';
import { addPanel, addText, tweenNumber } from '../ui.js?v=6';
import { openStash } from './trade.js?v=6';
import { itemBlurb } from '../trade.js?v=6';
import { devGrant, devSkip, mountDevTools } from '../dev.js?v=6';

const STATS = [
  { key: 'food', x: 548, icon: 'can' },
  { key: 'water', x: 658, icon: 'jug' },
  { key: 'health', x: 768, icon: 'heart' },
  { key: 'morale', x: 888, icon: 'smile' },
  { key: 'materials', x: 1008, icon: 'plank' },
];

export class HudScene extends Phaser.Scene {
  constructor() {
    super('HUD');
  }

  create() {
    this.cameras.main.transparent = true;
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    const bar = this.add.graphics().setDepth(1);
    bar.fillStyle(CONFIG.COLORS.navy, 0.92);
    bar.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HUD_H);
    bar.lineStyle(2, CONFIG.COLORS.rust, 1);
    bar.lineBetween(0, CONFIG.HUD_H, CONFIG.WIDTH, CONFIG.HUD_H);

    this.icons = this.add.graphics().setDepth(2);
    this.dayText = addText(this, 46, 10, '', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '26px', color: CONFIG.COLORS.text, originX: 0, originY: 0,
    }).setDepth(3);
    this.nameText = addText(this, 46, 42, '', {
      fontFamily: CONFIG.FONTS.radio, fontSize: '14px', color: CONFIG.COLORS.textMuted, originX: 0, originY: 0,
    }).setDepth(3);
    this.phrase = addText(this, 214, 18, '', {
      fontFamily: CONFIG.FONTS.radio, fontSize: '15px', color: CONFIG.COLORS.text, originX: 0, originY: 0,
      wordWrap: { width: 200 },
    }).setDepth(3);
    this.values = {};
    STATS.forEach((stat) => {
      this.values[stat.key] = addText(this, stat.x + 18, 22, '', {
        fontFamily: CONFIG.FONTS.heading, fontSize: '26px', color: CONFIG.COLORS.text, originX: 0, originY: 0.5,
      }).setDepth(3);
    });
    this.moodText = addText(this, 906, 58, '', {
      fontFamily: CONFIG.FONTS.body, fontSize: '11px', color: CONFIG.COLORS.textMuted, originX: 0, originY: 0.5,
    }).setDepth(3);
    this.weaponText = addText(this, 1048, 62, '', {
      fontFamily: CONFIG.FONTS.body, fontSize: '11px', color: CONFIG.COLORS.textMuted, originX: 0.5, originY: 0.5,
    }).setDepth(3);
    this.bagText = addText(this, 1084, 62, '', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '11px', color: CONFIG.COLORS.orangeCss, originX: 0.5, originY: 0.5,
    }).setDepth(3);

    const actions = this.add.zone(452, 36, 90, 52).setOrigin(0.5).setDepth(4);
    actions.setInteractive({ useHandCursor: true });
    actions.on('pointerup', () => {
      Audio.click();
      this.toggleNote('actions');
    });

    const duffel = this.add.zone(1084, 30, 36, 36).setOrigin(0.5).setDepth(4);
    duffel.setInteractive({ useHandCursor: true });
    duffel.on('pointerup', () => {
      if (this.note) this.closeNote();
      Audio.click();
      this.stash?.close?.();
      this.stash = openStash(this, () => this.sync());
    });
    const coat = this.add.zone(1124, 30, 32, 36).setOrigin(0.5).setDepth(4);
    coat.setInteractive({ useHandCursor: true });
    coat.on('pointerup', () => {
      Audio.click();
      this.toggleCoat();
    });

    const book = this.add.zone(1164, 36, 44, 52).setOrigin(0.5).setDepth(4);
    book.setInteractive({ useHandCursor: true });
    book.on('pointerup', () => {
      Audio.click();
      this.toggleNote('notebook');
    });

    const radio = this.add.zone(1232, 36, 52, 52).setOrigin(0.5).setDepth(4);
    radio.setInteractive({ useHandCursor: true });
    radio.on('pointerup', () => {
      Audio.click();
      this.toggleNote('radio');
    });

    this.note = null;
    this.sync();
    mountDevTools(this, {
      mode: 'toggle',
      y: 618,
      onOpen: () => this.closeNote(),
      onSkip: (day) => {
        if (!Game.state) return;
        devSkip(Game.state, day);
        const keys = ['Radio', 'Map', 'Scavenge', 'Bunker', 'NightSummary', 'Survival', 'Apocalypse', 'Ending'];
        const active = keys.find((key) => this.scene.isActive(key));
        Audio.stopSirens();
        Audio.stopRain();
        Audio.stopSnow();
        Audio.stopStatic();
        Audio.stopJingle();
        Audio.stopSponsor();
        Audio.stopJukebox();
        Audio.stopMurmur();
        Audio.stopGenerator();
        if (active) this.scene.get(active).scene.start('Radio');
      },
      onGrant: () => {
        if (!Game.state) return;
        devGrant(Game.state);
      },
    });
    this.offStat = bus.on('stat', (payload) => this.onStat(payload));
    this.offState = bus.on('state', () => this.sync());
    this.events.once('shutdown', () => {
      this.offStat?.();
      this.offState?.();
      Game.hudLock = false;
    });
  }

  sync() {
    const state = Game.state;
    this.icons.clear();
    iconCalendar(this.icons, 24, 36);
    if (!state) {
      this.dayText.setText('DAY —/30');
      this.nameText.setText('');
      this.phrase.setText('');
      this.moodText?.setText('');
      return;
    }
    if (state.mode === 'survival') {
      this.dayText.setText(`DAY ${state.survivalDay}/${CONFIG.SURVIVAL_DAYS}`);
      this.phrase.setText('The world already ended. Probably.');
    } else {
      this.dayText.setText(`DAY ${state.day}/${CONFIG.PREP_DAYS}`);
      this.phrase.setText(countdownPhrase(state.day));
    }
    this.nameText.setText(state.name || '');
    STATS.forEach((stat) => {
      drawIcon(this.icons, stat.icon, stat.x, 32);
      this.values[stat.key].setText(formatStat(stat.key, state.stats[stat.key]));
    });
    this.moodText?.setText(moraleWord(state.stats.morale));
    const left = state.actionsLeft ?? 0;
    for (let i = 0; i < CONFIG.ACTIONS_PER_DAY; i += 1) iconCup(this.icons, 424 + i * 26, 38, i < left);
    const weapon = CONFIG.WEAPONS[state.weapon] || CONFIG.WEAPONS.bare_hands;
    this.weaponText.setText(weapon.short);
    const stashCount = Object.values(state.stash || {}).reduce((sum, value) => sum + (value || 0), 0);
    this.bagText?.setText(stashCount ? `${stashCount}` : '');
    iconDuffel(this.icons, 1084, 28);
    iconCoat(this.icons, 1124, 28, (state.stash?.coat || 0) > 0 && state.flags?.coatWorn !== false);
    iconBook(this.icons, 1164, 34, this.note?.kind === 'notebook');
    iconRadio(this.icons, 1232, 34, this.note?.kind === 'radio');
  }

  onStat({ key, from, to }) {
    const label = this.values[key];
    if (!label) return;
    tweenNumber(this, label, from, to, (value) => formatStat(key, value));
  }

  toggleNote(kind) {
    if (this.note?.kind === kind) {
      this.closeNote();
      this.sync();
      return;
    }
    this.closeNote();
    const state = Game.state;
    const root = this.add.container(0, 0).setDepth(20);
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.35).setInteractive();
    blocker.on('pointerup', () => this.closeNote());
    root.add(blocker);
    if (kind === 'radio') {
      const lines = state?.lastBroadcast?.length
        ? state.lastBroadcast
        : ['The station is between thoughts.'];
      root.add(addPanel(this, 730, 96, 520, 430));
      root.add(addText(this, 990, 118, 'LAST BROADCAST', {
        fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.orangeCss, originX: 0.5, originY: 0,
      }));
      root.add(addText(this, 754, 156, lines.join('\n\n'), {
        fontFamily: CONFIG.FONTS.radio, fontSize: '16px', color: CONFIG.COLORS.text, originX: 0, originY: 0,
        wordWrap: { width: 472 }, lineSpacing: 4,
      }));
      root.add(noteButton(this, 990, 470, 'CLOSE', () => this.closeNote()));
    } else if (kind === 'notebook') {
      this.rumorPage = 0;
      root.add(addPanel(this, 220, 96, 840, 520));
      root.add(addText(this, 640, 122, 'RUMOR NOTEBOOK', {
        fontFamily: CONFIG.FONTS.heading, fontSize: '22px', color: CONFIG.COLORS.orangeCss, originX: 0.5, originY: 0,
      }));
      const body = addText(this, 250, 168, '', {
        fontFamily: CONFIG.FONTS.radio, fontSize: '16px', color: CONFIG.COLORS.text, originX: 0, originY: 0,
        wordWrap: { width: 780 }, lineSpacing: 4,
      });
      root.add(body);
      const pageLabel = addText(this, 640, 520, '', {
        fontFamily: CONFIG.FONTS.body, fontSize: '14px', color: CONFIG.COLORS.textMuted, originX: 0.5, originY: 0.5,
      });
      root.add(pageLabel);
      const render = () => {
        const rumors = (state?.rumors || []).filter((entry) => entry?.text);
        const pageSize = 3;
        const pages = Math.max(1, Math.ceil(rumors.length / pageSize));
        this.rumorPage = Math.max(0, Math.min(pages - 1, this.rumorPage || 0));
        if (!rumors.length) {
          body.setText('Nothing worth writing down. Yet.');
          pageLabel.setText('');
          return;
        }
        const slice = rumors.slice(this.rumorPage * pageSize, this.rumorPage * pageSize + pageSize);
        body.setText(slice.map((entry) => {
          const tally = (entry.count || 1) > 1 ? `  ×${entry.count}` : '';
          const stamp = entry.stamp ? `\n${entry.stamp}` : '';
          return `Day ${entry.day || '?'}${tally}\n${entry.text}${stamp}`;
        }).join('\n\n'));
        pageLabel.setText(`${this.rumorPage + 1} / ${pages}`);
      };
      render();
      root.add(noteButton(this, 420, 560, 'PREV', () => {
        this.rumorPage -= 1;
        render();
      }));
      root.add(noteButton(this, 860, 560, 'NEXT', () => {
        this.rumorPage += 1;
        render();
      }));
      root.add(noteButton(this, 640, 560, 'CLOSE', () => this.closeNote()));
    } else {
      const left = state?.actionsLeft ?? 0;
      root.add(addPanel(this, 300, 92, 420, 180));
      root.add(addText(this, 510, 150, `${left} action${left === 1 ? '' : 's'} left today. Scavenge or dig. Home is free.`, {
        fontFamily: CONFIG.FONTS.body, fontSize: '18px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
        align: 'center', wordWrap: { width: 380 },
      }));
      root.add(noteButton(this, 510, 230, 'CLOSE', () => this.closeNote()));
    }
    this.note = { kind, root };
    Game.hudLock = true;
    this.sync();
  }

  toggleCoat() {
    const state = Game.state;
    if (!state) return;
    if (!(state.stash?.coat > 0)) {
      this.closeNote();
      const root = this.add.container(0, 0).setDepth(24);
      const blocker = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.35).setInteractive();
      blocker.on('pointerup', () => this.closeNote());
      root.add(blocker);
      root.add(addPanel(this, 360, 180, 560, 160));
      root.add(addText(this, 640, 250, itemBlurb('coat') || 'No coat yet.', {
        fontFamily: CONFIG.FONTS.body, fontSize: '16px', color: CONFIG.COLORS.text,
        originX: 0.5, originY: 0.5, align: 'center', wordWrap: { width: 500 },
      }));
      this.note = { kind: 'coat', root };
      Game.hudLock = true;
      return;
    }
    state.flags.coatWorn = state.flags.coatWorn === false;
    this.sync();
  }

  closeNote() {
    this.note?.root?.destroy();
    this.note = null;
    Game.hudLock = false;
    if (this.icons?.active) this.sync();
  }
}

function iconCalendar(g, x, y) {
  g.fillStyle(0xf4efe4, 1);
  g.fillRoundedRect(x - 11, y - 12, 22, 22, 2);
  g.fillStyle(CONFIG.COLORS.orange, 1);
  g.fillRect(x - 11, y - 12, 22, 6);
  g.fillStyle(CONFIG.COLORS.ink, 1);
  g.fillRect(x - 6, y - 2, 4, 4);
  g.fillRect(x + 2, y - 2, 4, 4);
}

function iconDuffel(g, x, y) {
  g.fillStyle(0x6b4428, 1);
  g.fillRoundedRect(x - 12, y - 7, 24, 14, 3);
  g.lineStyle(2, 0xc4a574, 1);
  g.strokeRoundedRect(x - 12, y - 7, 24, 14, 3);
  g.lineBetween(x - 5, y - 7, x - 5, y - 13);
  g.lineBetween(x + 5, y - 7, x + 5, y - 13);
  g.lineBetween(x - 5, y - 13, x + 5, y - 13);
}

function iconCoat(g, x, y, worn) {
  g.lineStyle(2, CONFIG.COLORS.rust, 1);
  g.strokeRoundedRect(x - 12, y - 12, 24, 24, 4);
  if (!worn) return;
  g.fillStyle(0x8f1d1d, 1);
  g.fillRect(x - 8, y - 8, 16, 16);
  g.fillStyle(0x1a120c, 1);
  g.fillRect(x - 2, y - 8, 4, 16);
  g.fillRect(x - 8, y - 2, 16, 4);
}

function iconCup(g, x, y, on) {
  const color = on ? CONFIG.COLORS.orange : 0x3a4250;
  g.lineStyle(2, color, 1);
  g.strokeRoundedRect(x - 7, y - 6, 14, 11, 2);
  g.beginPath();
  g.arc(x + 9, y - 1, 4, Phaser.Math.DegToRad(-70), Phaser.Math.DegToRad(70), false);
  g.strokePath();
  if (!on) return;
  g.lineBetween(x - 2, y - 9, x - 3, y - 14);
  g.lineBetween(x + 3, y - 9, x + 4, y - 14);
}

function noteButton(scene, x, y, label, onClick) {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(CONFIG.COLORS.navy, 1);
  g.fillRoundedRect(-70, -18, 140, 36, 6);
  g.lineStyle(2, CONFIG.COLORS.orange, 1);
  g.strokeRoundedRect(-70, -18, 140, 36, 6);
  const text = addText(scene, 0, 0, label, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '16px',
    color: CONFIG.COLORS.text,
    originX: 0.5,
    originY: 0.5,
  });
  root.add([g, text]);
  root.setSize(140, 36);
  root.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(0, 0, 140, 36),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  });
  root.on('pointerup', (pointer, localX, localY, event) => {
    event?.stopPropagation?.();
    Audio.click();
    onClick();
  });
  return root;
}

function iconBook(g, x, y, on) {
  g.fillStyle(on ? CONFIG.COLORS.orange : 0xe6d3ae, 1);
  g.fillRoundedRect(x - 12, y - 12, 22, 26, 2);
  g.fillStyle(on ? CONFIG.COLORS.ink : 0x6e3a22, 1);
  g.fillRect(x - 2, y - 12, 2, 26);
  g.lineStyle(1, on ? CONFIG.COLORS.ink : 0x6e3a22, 1);
  g.lineBetween(x - 8, y - 4, x - 4, y - 4);
  g.lineBetween(x + 4, y - 4, x + 8, y - 4);
  g.lineBetween(x - 8, y + 2, x - 4, y + 2);
  g.lineBetween(x + 4, y + 2, x + 8, y + 2);
}

function iconRadio(g, x, y, on) {
  g.fillStyle(on ? CONFIG.COLORS.orange : 0x0b1018, 1);
  g.fillRoundedRect(x - 18, y - 12, 36, 26, 4);
  g.lineStyle(2, on ? CONFIG.COLORS.ink : CONFIG.COLORS.orange, 1);
  g.strokeRoundedRect(x - 18, y - 12, 36, 26, 4);
  g.lineBetween(x, y - 12, x - 8, y - 22);
  g.lineBetween(x, y - 12, x + 8, y - 22);
  g.fillStyle(on ? CONFIG.COLORS.ink : CONFIG.COLORS.orange, 1);
  g.fillCircle(x - 7, y + 1, 2);
  g.fillCircle(x, y + 1, 2);
  g.fillCircle(x + 7, y + 1, 2);
}

function drawIcon(g, kind, x, y) {
  if (kind === 'can') {
    g.fillStyle(0xc45c38, 1);
    g.fillRoundedRect(x - 9, y - 11, 16, 20, 2);
    g.fillStyle(0xe7d3ae, 1);
    g.fillRect(x - 9, y - 5, 16, 3);
    return;
  }
  if (kind === 'jug') {
    g.fillStyle(0x7eb0d4, 1);
    g.fillRoundedRect(x - 7, y - 8, 14, 18, 3);
    g.fillRect(x - 3, y - 14, 6, 7);
    return;
  }
  if (kind === 'heart') {
    g.fillStyle(0xd25b4c, 1);
    g.fillCircle(x - 4, y - 3, 5);
    g.fillCircle(x + 4, y - 3, 5);
    g.fillTriangle(x - 9, y - 1, x + 9, y - 1, x, y + 10);
    return;
  }
  if (kind === 'smile') {
    g.lineStyle(2, 0xf4efe4, 1);
    g.strokeCircle(x, y, 10);
    g.fillStyle(0xf4efe4, 1);
    g.fillCircle(x - 3, y - 2, 1.4);
    g.fillCircle(x + 3, y - 2, 1.4);
    g.beginPath();
    g.arc(x, y + 1, 5, 0.25, Math.PI - 0.25, false);
    g.strokePath();
    return;
  }
  g.fillStyle(0xb5834a, 1);
  g.fillRoundedRect(x - 12, y - 4, 24, 8, 2);
  g.fillStyle(0x6b4524, 1);
  g.fillCircle(x - 6, y, 1.2);
  g.fillCircle(x + 5, y, 1.2);
}
