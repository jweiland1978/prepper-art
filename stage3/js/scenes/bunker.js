import Phaser from '../phaser.js?v=6';
import { CONFIG } from '../config.js?v=6';
import { NEIGHBORS } from '../data/neighbors.js?v=6';
import { MARKERS } from '../data/map.js?v=6';
import {
  cotCount,
  generatorOn,
  idleLine,
  isActive,
  materialCost,
  memorialEntries,
  oddsWordSafe,
  recruited,
  resolveNotice,
  sendSolo,
  setJob,
  soloOdds,
  spotStatus,
  wearingCoat,
  workRoom,
} from '../crew.js?v=6';
import { Game, bus, changeStat, foodCap, roomLevel, touchState, waterCap } from '../state.js?v=6';
import { Save } from '../save.js?v=6';
import { Audio } from '../audio.js?v=6';
import { addButton, addText } from '../ui.js?v=6';
import { attachAtmosphere, fadeIn } from '../fx.js?v=6';
import { leave, showHud } from '../flow.js?v=6';
import { maybeGaryVisit, memorialCopy } from '../logic.js?v=6';
import { larryKnocking, maybeJulyBox, noteWaterBuilt, repairScorch } from '../trade.js?v=6';
import { showNotice } from './cards.js?v=6';
import {
  canDistress,
  distressWord,
  drawSilverCan,
  followDistress,
  openTrade,
  presentLaunch,
} from './trade.js?v=6';

const COLS = [48, 300, 736, 988];
const ROWS = [268, 468];
const SLOT_W = 236;
const SLOT_H = 156;
const SHAFT = { x: 548, y: 268, w: 176, h: 356 };

const BISCUIT_LINES = [
  'Biscuit has eaten something. You will find out what later.',
  'Employed.',
  'He is not a resource. He is the reason.',
  'Half a can a night. It banks. He does not do fractions out loud.',
  'The bandana is not a costume. It is a job.',
];

export class BunkerScene extends Phaser.Scene {
  constructor() {
    super('Bunker');
  }

  create() {
    this.modal = null;
    this.busy = false;
    this.wag = { v: 0 };
    this.flicker = { v: 0.04 };
    this.peopleSig = '';
    this.personPoints = {};
    this.personZones = [];
    this.bubble = null;
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    fadeIn(this, 320);
    this.cameras.main.setBackgroundColor('#070b12');
    if (this.textures.exists('bg-bunker')) {
      const image = this.add.image(640, 360, 'bg-bunker').setDepth(0);
      const scale = Math.max(CONFIG.WIDTH / (image.width || CONFIG.WIDTH), CONFIG.HEIGHT / (image.height || CONFIG.HEIGHT));
      image.setScale(scale);
      image.setAlpha(0.88);
    }
    attachAtmosphere(this, { depth: 3 });
    this.world = this.add.graphics().setDepth(5);
    this.folk = this.add.graphics().setDepth(8);
    this.dog = this.add.graphics().setDepth(9);
    this.labels = [];
    state.slots.forEach((slot) => {
      const rect = slotRect(slot);
      const label = addText(this, rect.x + rect.w / 2, rect.y + rect.h - 18, '', {
        fontFamily: CONFIG.FONTS.heading,
        fontSize: '16px',
        color: CONFIG.COLORS.text,
        originX: 0.5,
        originY: 0.5,
      }).setDepth(6);
      this.labels.push(label);
      const zone = this.add.zone(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h).setOrigin(0.5).setDepth(7);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => this.openSlot(slot));
    });
    this.plaqueLabels = [];
    this.memorialText = addText(this, SHAFT.x + SHAFT.w / 2, 236, 'MEMORIAL', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '14px',
      color: CONFIG.COLORS.textMuted,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(8);
    const memorialZone = this.add.zone(SHAFT.x + SHAFT.w / 2, 236, 150, 36).setOrigin(0.5).setDepth(9);
    memorialZone.setInteractive({ useHandCursor: true });
    memorialZone.on('pointerup', () => this.openMemorial());

    const dogZone = this.add.zone(SHAFT.x + SHAFT.w / 2, SHAFT.y + SHAFT.h - 48, 90, 50).setOrigin(0.5).setDepth(9);
    dogZone.setInteractive({ useHandCursor: true });
    dogZone.on('pointerup', () => this.openBiscuit());

    addButton(this, 180, 124, 'BACK TO MAP', () => {
      if (this.busy) return;
      this.closeModal();
      leave(this, 'Map');
    }, { w: 210, h: 48, depth: 12 });
    addButton(this, 420, 124, 'CREW', () => {
      if (this.busy) return;
      this.openCrew();
    }, { w: 140, h: 48, depth: 12 });
    this.distressBtn = addButton(this, 980, 680, 'DISTRESS', () => this.askDistress(), { w: 200, h: 44, depth: 12 });
    this.larryBtn = addButton(this, 740, 680, 'HATCH', () => this.openLarry(), { w: 160, h: 44, depth: 12 });
    const board = this.add.zone(SHAFT.x + 41, SHAFT.y + 32, 54, 36).setOrigin(0.5).setDepth(11);
    board.setInteractive({ useHandCursor: true });
    board.on('pointerup', () => this.openBoard());
    addButton(this, 680, 124, 'CALL IT A NIGHT', () => {
      if (this.busy) return;
      this.closeModal();
      leave(this, 'NightSummary');
    }, { w: 260, h: 48, primary: true, depth: 12 });
    this.status = addText(this, 1040, 124, '', {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '16px',
      color: CONFIG.COLORS.textMuted,
      originX: 0.5,
      originY: 0.5,
      align: 'center',
    }).setDepth(12);

    this.tweens.add({
      targets: this.wag,
      v: 7,
      duration: 680,
      yoyo: true,
      repeat: -1,
      onUpdate: () => this.drawDog(),
    });
    this.tweens.add({
      targets: this.flicker,
      v: 0.16,
      duration: 420,
      yoyo: true,
      repeat: -1,
      onUpdate: () => this.paintRooms(),
    });
    this.time.addEvent({
      delay: 5200,
      loop: true,
      callback: () => this.popBubble(),
    });
    this.offStat = bus.on('stat', () => this.refresh());
    this.offState = bus.on('state', () => this.refresh());
    this.events.once('shutdown', () => {
      this.offStat?.();
      this.offState?.();
      Audio.stopGenerator();
    });
    showHud(this);
    state.lastScene = 'Bunker';
    const visit = maybeGaryVisit(state);
    Save.write(state);
    if (generatorOn(state)) Audio.startGenerator();
    Audio.startMusic('lounge');
    this.refresh();
    if (visit) {
      showNotice(this, {
        kicker: 'AT THE HATCH',
        title: visit.who,
        portrait: visit.portrait,
        body: `${visit.line}\n\n${visit.bonus}`,
        button: 'GOT IT',
      });
    }
  }

  refresh() {
    const state = Game.state;
    if (!state || !this.world?.active) return;
    this.paintRooms();
    state.slots.forEach((slot, index) => {
      this.labels[index]?.setText(slotLabel(state, slot));
    });
    const left = state.actionsLeft ?? 0;
    const cots = cotCount(state);
    const mouths = recruited(state).length;
    this.status?.setText(`${left} action${left === 1 ? '' : 's'}\n${state.stats.materials} planks\n${mouths}/${cots} cots`);
    const remembered = memorialEntries(state).length;
    this.memorialText?.setColor(remembered ? '#e6c15a' : CONFIG.COLORS.textMuted);
    this.drawDog();
    this.syncPeople(state);
    if (generatorOn(state)) Audio.startGenerator();
    else Audio.stopGenerator();
    this.distressBtn?.setVisible(canDistress(state));
    this.larryBtn?.setVisible(larryKnocking(state));
  }

  paintRooms() {
    const state = Game.state;
    if (!state || !this.world?.active) return;
    this.world.clear();
    this.folk?.clear();
    this.drawShaft(state);
    state.slots.forEach((slot) => this.drawSlot(state, slot));
    this.drawPeople(state);
    this.drawWearer(state);
  }

  drawShaft(state) {
    const g = this.world;
    const powered = generatorOn(state);
    g.fillStyle(0x120e0c, 0.94);
    g.fillRoundedRect(SHAFT.x, SHAFT.y, SHAFT.w, SHAFT.h, 16);
    g.lineStyle(5, 0x6b4524, 1);
    g.strokeRoundedRect(SHAFT.x + 8, SHAFT.y + 8, SHAFT.w - 16, SHAFT.h - 16, 12);
    g.lineStyle(3, 0x3a2718, 1);
    const lx = SHAFT.x + 48;
    const rx = SHAFT.x + SHAFT.w - 48;
    g.lineBetween(lx, SHAFT.y + 28, lx, SHAFT.y + SHAFT.h - 28);
    g.lineBetween(rx, SHAFT.y + 28, rx, SHAFT.y + SHAFT.h - 28);
    for (let i = 0; i < 8; i += 1) {
      const y = SHAFT.y + 40 + i * 36;
      g.lineBetween(lx, y, rx, y);
    }
    g.fillStyle(powered ? CONFIG.COLORS.orange : 0x3a342c, powered ? 0.95 : 0.8);
    g.fillCircle(SHAFT.x + SHAFT.w / 2, SHAFT.y + 28, powered ? 8 : 5);
    g.fillStyle(0x6b4428, 1);
    g.fillRoundedRect(SHAFT.x + 18, SHAFT.y + 18, 46, 28, 3);
    g.fillStyle(0xc4a574, 1);
    g.fillRect(SHAFT.x + 24, SHAFT.y + 24, 34, 16);
    const notes = Math.min(4, (state.notices || []).length);
    for (let i = 0; i < notes; i += 1) {
      g.fillStyle(0xf4efe4, 1);
      g.fillRect(SHAFT.x + 26 + (i % 2) * 16, SHAFT.y + 22 + Math.floor(i / 2) * 10, 12, 8);
      g.fillStyle(0xc45c38, 1);
      g.fillCircle(SHAFT.x + 32 + (i % 2) * 16, SHAFT.y + 24 + Math.floor(i / 2) * 10, 1.4);
    }
    if (state.flags?.scorch === 'shaft') {
      g.lineStyle(2, 0x2a241c, 0.9);
      g.lineBetween(SHAFT.x + 70, SHAFT.y + 90, SHAFT.x + 120, SHAFT.y + 140);
      g.lineBetween(SHAFT.x + 120, SHAFT.y + 90, SHAFT.x + 70, SHAFT.y + 140);
    }
    this.plaqueLabels?.forEach((label) => label.destroy());
    this.plaqueLabels = [];
    const names = memorialEntries(state).slice(0, 4);
    if (names.length) {
      g.fillStyle(0xffc27a, 0.28);
      g.fillCircle(SHAFT.x + SHAFT.w / 2, SHAFT.y + 58, 22);
      g.fillStyle(0xffe0b0, 0.95);
      g.fillCircle(SHAFT.x + SHAFT.w / 2, SHAFT.y + 58, 4);
    }
    names.forEach((entry, index) => {
      const y = SHAFT.y + 78 + index * 64;
      g.fillStyle(0xc4a574, 1);
      g.fillRoundedRect(SHAFT.x + 22, y, SHAFT.w - 44, 58, 3);
      g.fillStyle(0x8a6a3a, 1);
      g.fillRect(SHAFT.x + 28, y + 4, SHAFT.w - 56, 50);
      const label = addText(this, SHAFT.x + SHAFT.w / 2, y + 29, `${entry.name}\nDay ${entry.day}`, {
        fontFamily: CONFIG.FONTS.heading,
        fontSize: '10px',
        color: '#1a120c',
        originX: 0.5,
        originY: 0.5,
        align: 'center',
        wordWrap: { width: SHAFT.w - 64 },
      }).setDepth(6);
      this.plaqueLabels.push(label);
    });
  }

  drawSlot(state, slot) {
    const rect = slotRect(slot);
    const g = this.world;
    if (!slot.dug) {
      g.lineStyle(2, CONFIG.COLORS.rust, 0.85);
      dashRect(g, rect.x, rect.y, rect.w, rect.h);
      return;
    }
    g.fillStyle(0x1a120c, 0.94);
    g.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 12);
    g.fillStyle(0x000000, 0.28);
    g.fillRoundedRect(rect.x + 8, rect.y + 8, rect.w - 16, 18, 4);
    g.lineStyle(4, 0x6b4524, 1);
    g.strokeRoundedRect(rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12, 10);
    const powered = generatorOn(state);
    paintLight(g, rect, powered, this.flicker?.v || 0);
    if (slot.room === 'pantry') drawPantry(g, rect, state);
    else if (slot.room === 'water') drawWater(g, rect, state);
    else if (slot.room === 'generator') drawGenerator(g, rect, powered);
    else if (slot.room === 'barricade') drawBarricade(g, rect, slot.level);
    else if (slot.room === 'grow') drawGrow(g, rect, powered);
    else if (slot.room === 'rec') drawRec(g, rect);
    else if (slot.room === 'faraday') drawFaraday(g, rect);
    else if (slot.room === 'lead') drawLead(g, rect);
    if (state.flags?.scorch && state.flags.scorch === slot.room) {
      g.lineStyle(3, 0x2a241c, 0.85);
      g.lineBetween(rect.x + 28, rect.y + 36, rect.x + rect.w - 28, rect.y + 88);
      g.lineBetween(rect.x + rect.w - 28, rect.y + 36, rect.x + 28, rect.y + 88);
    }
    if (slot.room) drawCot(g, rect);
  }

  drawDog() {
    if (!this.dog?.active) return;
    const state = Game.state;
    const hiding = state?.flags?.biscuitHiding === (state?.mode === 'survival' ? `s${state.survivalDay || 1}` : state?.day);
    const x = SHAFT.x + SHAFT.w / 2 - 6;
    const y = SHAFT.y + SHAFT.h - (hiding ? 24 : 46);
    const wag = this.wag?.v || 0;
    const g = this.dog;
    g.clear();
    g.fillStyle(0x6b3e22, 1);
    g.fillEllipse(x, y, 62, 30);
    g.fillCircle(x + 30, y - 10, 16);
    g.fillEllipse(x + 40, y - 24, 12, 16);
    g.fillTriangle(x - 34, y - 10 - wag * 0.4, x - 18, y - 2, x - 36, y + 8 + wag);
    g.fillStyle(0xff1f1f, 1);
    g.fillRoundedRect(x + 16, y - 12, 26, 8, 2);
    g.fillTriangle(x + 18, y - 8, x + 42, y - 16, x + 40, y + 2);
    g.fillStyle(0x1a120c, 1);
    g.fillCircle(x + 36, y - 10, 1.7);
    g.fillStyle(0x4a2c18, 1);
    g.fillCircle(x + 44, y - 6, 2.4);
    if (hiding) {
      g.fillStyle(0x6b4428, 1);
      g.fillRect(x - 36, y - 18, 78, 8);
    }
  }

  openBiscuit() {
    if (this.modal || this.busy) return;
    Audio.bark();
    const line = BISCUIT_LINES[Math.floor(Math.random() * BISCUIT_LINES.length)];
    this.modal = showNotice(this, {
      kicker: 'BISCUIT',
      title: 'Employed.',
      portrait: 'portrait-biscuit',
      body: `He eats half a can a night. It banks until it is a whole can. He is not a resource. He is the reason.\n\n${line}`,
      button: 'BACK',
      onClose: () => { this.modal = null; },
    });
  }

  openMemorial() {
    if (this.modal || this.busy) return;
    const entries = memorialEntries(Game.state);
    if (!entries.length) {
      this.modal = showNotice(this, {
        kicker: 'MEMORIAL',
        title: 'THE PLANK',
        body: memorialCopy(Game.state),
        button: 'BACK',
        onClose: () => { this.modal = null; },
      });
      return;
    }
    const root = this.add.container(0, 0).setDepth(40);
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.62).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(CONFIG.COLORS.navy, 0.96);
    panel.fillRoundedRect(120, 80, 1040, 560, 10);
    panel.lineStyle(2, CONFIG.COLORS.rust, 1);
    panel.strokeRoundedRect(120, 80, 1040, 560, 10);
    root.add([blocker, panel]);
    const close = () => {
      root.destroy();
      this.modal = null;
    };
    this.modal = { close };
    root.add(addText(this, 640, 112, 'THE PLANK', {
      fontFamily: CONFIG.FONTS.display, fontSize: '40px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
    }));
    entries.forEach((entry, index) => {
      const y = 180 + index * 100;
      const row = NEIGHBORS.find((item) => item.id === entry.id);
      if (row?.portrait && this.textures.exists(row.portrait)) {
        const frame = this.add.graphics();
        frame.lineStyle(3, 0x6a7380, 1);
        frame.strokeRect(160, y - 36, 72, 84);
        const img = this.add.image(196, y + 6, row.portrait).setTint(0x888888);
        const scale = Math.min(64 / (img.width || 64), 76 / (img.height || 76));
        img.setScale(scale);
        root.add([frame, img]);
      }
      root.add(addText(this, 260, y, `${entry.name} — Day ${entry.day} — ${entry.epitaph}`, {
        fontFamily: CONFIG.FONTS.body,
        fontSize: '18px',
        color: CONFIG.COLORS.text,
        originX: 0,
        originY: 0.5,
        wordWrap: { width: 840 },
      }));
    });
    root.add(addButton(this, 640, 590, 'BACK', close, { w: 180, h: 44 }));
  }

  openSlot(slot) {
    if (this.modal || this.busy) return;
    const state = Game.state;
    const root = this.add.container(0, 0).setDepth(40);
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.62).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(CONFIG.COLORS.navy, 0.94);
    panel.fillRoundedRect(80, 96, 1120, 560, 10);
    panel.lineStyle(2, CONFIG.COLORS.rust, 1);
    panel.strokeRoundedRect(80, 96, 1120, 560, 10);
    root.add([blocker, panel]);
    const title = !slot.dug ? 'UNDUG' : slot.room ? `${CONFIG.ROOMS[slot.room]?.name || slot.room}  L${slot.level}` : 'DUG OUT';
    root.add(addText(this, 640, 132, title, {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '40px',
      color: CONFIG.COLORS.text,
      originX: 0.5,
      originY: 0.5,
    }));
    const reason = addText(this, 640, 168, slotBlurb(state, slot), {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '16px',
      color: CONFIG.COLORS.textMuted,
      originX: 0.5,
      originY: 0,
      align: 'center',
      wordWrap: { width: 1000 },
    });
    root.add(reason);
    const close = () => {
      root.destroy();
      this.modal = null;
    };
    this.modal = { close };
    const buttons = [];
    if (!slot.dug) {
      const cost = materialCost(state, CONFIG.DIG_COST);
      buttons.push(this.actionButton(state, `DIG (${cost} PLANKS)`, canPay(state, cost), () => {
        close();
        this.dig(slot);
      }));
    } else if (!slot.room) {
      Object.values(CONFIG.ROOMS).forEach((room) => {
        const taken = state.slots.some((other) => other.room === room.id);
        const cost = materialCost(state, CONFIG.BUILD_COSTS[0]);
        const note = clipLine([room.blurb, ...(room.levels || []), room.tag].filter(Boolean).join(' · '), 46);
        buttons.push({
          label: `${room.name.toUpperCase()} (${cost})`,
          subtitle: taken ? 'Already built' : note,
          room: room.id,
          enabled: !taken && canPay(state, cost),
          onClick: () => {
            close();
            this.build(slot, room.id);
          },
        });
      });
    } else if (slot.level < 3) {
      const cost = materialCost(state, CONFIG.BUILD_COSTS[slot.level]);
      buttons.push(this.actionButton(state, `UPGRADE (${cost} PLANKS)`, canPay(state, cost), () => {
        close();
        this.upgrade(slot);
      }));
    } else {
      reason.setText('The room is as improved as your carpentry.');
    }
    buttons.forEach((button, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = buttons.length === 1 ? 640 : 400 + col * 460;
      const y = 300 + row * 68;
      if (button.room) {
        const icon = this.add.graphics();
        drawRoomIcon(icon, button.room, 0, 0);
        root.add(this.add.container(x - 176, y, [icon]));
      }
      if (!button.enabled) {
        root.add(dimButton(this, x, y, button.label, button.subtitle));
        return;
      }
      root.add(addButton(this, x, y, button.label, button.onClick, {
        w: 300,
        h: button.subtitle ? 58 : 52,
        primary: true,
        subtitle: button.subtitle || '',
        fontSize: '16px',
      }));
    });
    root.add(addButton(this, 640, 612, 'NOT NOW', close, { w: 220, h: 44 }));
  }

  actionButton(state, label, enabled, onClick) {
    return {
      label,
      enabled,
      reason: payReason(state, 0),
      onClick,
    };
  }

  dig(slot) {
    const state = Game.state;
    const cost = materialCost(state, CONFIG.DIG_COST);
    if (this.busy || slot.dug) return;
    if (!canPay(state, cost)) return;
    this.busy = true;
    changeStat('materials', -cost);
    state.actionsLeft -= 1;
    touchState();
    Audio.dig();
    this.time.delayedCall(420, () => {
      if (!this.sys?.isActive()) return;
      slot.dug = true;
      const july = maybeJulyBox(state);
      Save.write(state);
      this.busy = false;
      this.refresh();
      if (july) {
        this.modal = showNotice(this, {
          kicker: 'A BOX',
          title: 'Fourth of July',
          body: july,
          button: 'NICE',
          onClose: () => { this.modal = null; },
        });
      }
    });
    dirtBurst(this, slotRect(slot));
  }

  build(slot, roomId) {
    const state = Game.state;
    const cost = materialCost(state, CONFIG.BUILD_COSTS[0]);
    if (this.busy || !slot.dug || slot.room) return;
    if (state.slots.some((other) => other.room === roomId)) return;
    if (!canPay(state, cost)) return;
    this.busy = true;
    changeStat('materials', -cost);
    state.actionsLeft -= 1;
    slot.room = roomId;
    slot.level = 1;
    if (roomId === 'faraday') state.flags.faradayCheerPending = true;
    if (roomId === 'water') noteWaterBuilt(state);
    touchState();
    Audio.hammer();
    Save.write(state);
    this.busy = false;
    this.refresh();
  }

  upgrade(slot) {
    const state = Game.state;
    if (this.busy || !slot.room || slot.level >= 3) return;
    const cost = materialCost(state, CONFIG.BUILD_COSTS[slot.level]);
    if (!canPay(state, cost)) return;
    this.busy = true;
    changeStat('materials', -cost);
    state.actionsLeft -= 1;
    slot.level += 1;
    touchState();
    Audio.hammer();
    Save.write(state);
    this.busy = false;
    this.refresh();
  }

  closeModal() {
    this.modal?.close?.();
    this.modal = null;
  }

  openCrew() {
    if (this.modal || this.busy) return;
    const state = Game.state;
    const root = this.add.container(0, 0).setDepth(40);
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.62).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(CONFIG.COLORS.navy, 0.96);
    panel.fillRoundedRect(140, 90, 1000, 560, 10);
    panel.lineStyle(2, CONFIG.COLORS.rust, 1);
    panel.strokeRoundedRect(140, 90, 1000, 560, 10);
    root.add([blocker, panel]);
    const close = () => {
      root.destroy();
      this.modal = null;
      this.refresh();
    };
    this.modal = { close };
    root.add(addText(this, 640, 122, 'CREW', {
      fontFamily: CONFIG.FONTS.display, fontSize: '40px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
    }));
    const mouths = recruited(state);
    const stash = state.stash || {};
    root.add(addText(this, 640, 164, `${mouths.length} aboard. ${cotCount(state)} cots. Foil ${stash.tinfoil || 0}  Batt ${stash.battery || 0}  Coffee ${stash.coffee || 0}  Notices ${state.violations || 0}`, {
      fontFamily: CONFIG.FONTS.body, fontSize: '15px', color: CONFIG.COLORS.textMuted, originX: 0.5, originY: 0.5,
    }));
    if (!mouths.length) {
      root.add(addText(this, 640, 320, 'The bunker is you, Biscuit, and a lot of opinions you have not invited yet.', {
        fontFamily: CONFIG.FONTS.body, fontSize: '20px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
        align: 'center', wordWrap: { width: 760 },
      }));
    }
    mouths.forEach((row, index) => {
      const y = 214 + index * 72;
      const body = state.crew[row.id];
      const laid = body.laidUp > 0;
      const health = laid ? 'Laid up' : `${body.health}/${CONFIG.CREW.healthMax}`;
      root.add(addText(this, 170, y, `${row.name}  ${health}  ${laid ? 'RESTING IT OFF' : (body.job || 'rest').toUpperCase()}`, {
        fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.text, originX: 0, originY: 0.5,
      }));
      if (!laid && state.mode !== 'survival') {
        const odds = soloOdds(state, row.id);
        const out = state.flags?.soloDay === state.day;
        root.add(addButton(this, 620, y, out ? 'OUT' : 'SOLO', () => {
          close();
          this.time.delayedCall(0, () => this.openSolo(row.id));
        }, {
          w: 120, h: 36, fontSize: '13px', subtitle: oddsWordSafe(odds.loss),
        }));
      }
      ['rest', 'guard', 'work', 'along'].forEach((job, jobIndex) => {
        const current = !laid && body.job === job;
        root.add(addButton(this, 760 + jobIndex * 86, y, job.toUpperCase(), () => {
          if (laid) return;
          setJob(state, row.id, job);
          Save.write(state);
          close();
          this.time.delayedCall(0, () => this.openCrew());
        }, {
          w: 80, h: 36, primary: current, fontSize: '13px',
        }));
      });
    });
    root.add(addButton(this, 640, 604, 'BACK', close, { w: 180, h: 44 }));
  }

  openSolo(id) {
    if (this.modal || this.busy) return;
    const state = Game.state;
    const row = NEIGHBORS.find((item) => item.id === id);
    if (!row || !state?.crew?.[id]) return;
    if (state.flags?.soloDay === state.day) {
      this.modal = showNotice(this, {
        kicker: 'SOLO',
        title: row.name,
        body: 'Somebody already went out today. The hatch can wait until morning.',
        button: 'BACK',
        onClose: () => { this.modal = null; },
      });
      return;
    }
    const spots = MARKERS.filter((marker) => marker.kind !== 'home' && marker.kind !== 'landmark' && spotStatus(state, marker).code === 'open');
    const buttons = spots.slice(0, 4).map((marker) => ({
      label: marker.name.toUpperCase(),
      fontSize: '16px',
      onClick: () => {
        const result = sendSolo(state, id, marker.id);
        Save.write(state);
        this.modal = null;
        this.refresh();
        this.modal = showNotice(this, {
          kicker: 'SOLO',
          title: row.name,
          body: result.line,
          button: 'OK',
          onClose: () => { this.modal = null; },
        });
      },
    }));
    buttons.push({ label: 'NOT NOW', onClick: () => { this.modal = null; } });
    const odds = oddsWordSafe(soloOdds(state, id).loss);
    this.modal = showNotice(this, {
      kicker: 'SOLO',
      title: row.name,
      body: spots.length
        ? `${row.name} goes alone. No action. Home odds: ${odds}. The Mackinaw stays with you.`
        : 'Every useful door is shut. The hatch is still free.',
      buttons: spots.length ? buttons : [{ label: 'BACK', onClick: () => { this.modal = null; } }],
    });
  }

  syncPeople(state) {
    const sig = recruited(state).map((row) => `${row.id}:${state.crew[row.id]?.job}:${state.crew[row.id]?.laidUp}`).join('|');
    if (sig === this.peopleSig) return;
    this.peopleSig = sig;
    this.personZones.forEach((zone) => zone.destroy());
    this.personZones = [];
    recruited(state).forEach((row) => {
      const spot = this.personPoints[row.id];
      if (!spot) return;
      const zone = this.add.zone(spot.x, spot.y, 36, 48).setOrigin(0.5).setDepth(11);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => this.openPerson(row.id));
      this.personZones.push(zone);
    });
  }

  openPerson(id) {
    if (this.modal || this.busy) return;
    const row = NEIGHBORS.find((item) => item.id === id);
    const body = Game.state?.crew?.[id];
    if (!row || !body) return;
    const laid = body.laidUp > 0;
    const line = idleLine(id);
    const buttons = [{ label: 'BACK', onClick: () => { this.modal = null; } }];
    if (!laid && id === 'larry') {
      buttons.unshift({
        label: 'TRADE',
        primary: true,
        onClick: () => {
          this.modal = null;
          openTrade(this, { who: 'larry', onDone: () => this.refresh() });
        },
      });
    }
    if (!laid && id === 'kevin') {
      buttons.unshift({
        label: 'TIP',
        primary: true,
        onClick: () => {
          this.modal = null;
          openTrade(this, { who: 'kevin', onDone: () => this.refresh() });
        },
      });
    }
    this.modal = showNotice(this, {
      kicker: laid ? 'LAID UP' : 'CREW',
      title: row.name,
      portrait: row.portrait,
      body: `${row.skill}\n\nQuirk: ${row.quirk}\n\nHealth ${laid ? '0, laid up' : `${body.health}/${CONFIG.CREW.healthMax}`}. Job: ${(body.job || 'rest').toUpperCase()}.\n\n${line}`,
      buttons,
    });
  }

  openBoard() {
    if (this.modal || this.busy) return;
    const state = Game.state;
    const notices = state.notices || [];
    const lines = notices.length
      ? notices.map((notice) => notice.rule).join('\n')
      : 'The board is clear. Dale will invent something.';
    const scorch = state.flags?.scorch ? `\n\nA scorch mark is still on the ${state.flags.scorch}. One plank sands it.` : '';
    const buttons = [{ label: 'BACK', onClick: () => { this.modal = null; } }];
    if (notices.length && (state.stats.materials || 0) >= 1) {
      buttons.push({
        label: 'PAY 1 PLANK',
        primary: true,
        onClick: () => this.settleBoard('materials'),
      });
    }
    if (notices.length && (state.stash?.snacks || 0) >= 1) {
      buttons.push({
        label: 'PAY 1 SNACK',
        onClick: () => this.settleBoard('snacks'),
      });
    }
    if (state.flags?.scorch && (state.stats.materials || 0) >= 1) {
      buttons.push({
        label: 'SAND SCORCH',
        onClick: () => {
          const result = repairScorch(state);
          Save.write(state);
          this.modal = null;
          this.refresh();
          this.modal = showNotice(this, {
            kicker: 'SCORCH',
            title: 'Sanded',
            body: result.line,
            button: 'OK',
            onClose: () => { this.modal = null; },
          });
        },
      });
    }
    this.modal = showNotice(this, {
      kicker: 'CORKBOARD',
      title: notices.length ? `${notices.length} notice${notices.length === 1 ? '' : 's'}` : 'Clear',
      body: `${lines}${scorch}`,
      buttons,
    });
  }

  settleBoard(pay) {
    const state = Game.state;
    const result = resolveNotice(state, pay);
    Save.write(state);
    this.modal = null;
    this.refresh();
    this.modal = showNotice(this, {
      kicker: 'CORKBOARD',
      title: result.ok ? 'Taken down' : 'Still pinned',
      body: result.line,
      button: 'OK',
      onClose: () => { this.modal = null; },
    });
  }

  askDistress() {
    if (this.modal || this.busy) return;
    const state = Game.state;
    if (!canDistress(state)) return;
    this.modal = showNotice(this, {
      kicker: 'DISTRESS',
      title: 'Fire a distress rocket',
      body: `One rocket and one action. Odds: ${distressWord(state)}.`,
      buttons: [
        { label: 'NOT NOW', onClick: () => { this.modal = null; } },
        {
          label: 'LIGHT IT',
          primary: true,
          onClick: () => {
            this.modal = null;
            presentLaunch(this, { mode: 'distress', where: 'bunker' }).then((result) => {
              if (!this.sys?.isActive()) return;
              followDistress(this, result, () => this.refresh());
            });
          },
        },
      ],
    });
  }

  openLarry() {
    if (this.modal || this.busy) return;
    openTrade(this, { who: 'larry', onDone: () => this.refresh() });
  }

  drawWearer(state) {
    if (!wearingCoat(state) || !this.folk?.active) return;
    const g = this.folk;
    const x = SHAFT.x + SHAFT.w / 2 + 28;
    const y = SHAFT.y + SHAFT.h - 78;
    g.fillStyle(0xe6d3ae, 1);
    g.fillCircle(x, y - 18, 6);
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        g.fillStyle((row + col) % 2 ? 0x8f1d1d : 0x1a120c, 1);
        g.fillRect(x - 10 + col * 7, y - 8 + row * 6, 7, 6);
      }
    }
  }

  drawPeople(state) {
    if (!this.folk?.active) return;
    const g = this.folk;
    recruited(state).forEach((row, index) => {
      const spot = personSpot(state, row.id, index);
      this.personPoints[row.id] = spot;
      drawNeighbor(g, spot.x, spot.y, row.id, isActive(state, row.id));
    });
  }

  popBubble() {
    if (this.modal || !this.sys?.isActive()) return;
    const state = Game.state;
    const folks = recruited(state);
    if (!folks.length) return;
    const row = folks[Math.floor(Math.random() * folks.length)];
    const spot = this.personPoints[row.id];
    if (!spot) return;
    this.bubble?.destroy();
    Audio.voice(row.id);
    const text = addText(this, spot.x, spot.y - 36, idleLine(row.id), {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '13px',
      color: CONFIG.COLORS.inkCss,
      backgroundColor: '#e6d3ae',
      padding: { x: 6, y: 4 },
      originX: 0.5,
      originY: 1,
      align: 'center',
      wordWrap: { width: 180 },
    }).setDepth(14);
    this.bubble = text;
    this.time.delayedCall(2400, () => {
      if (this.bubble === text) {
        text.destroy();
        this.bubble = null;
      }
    });
  }
}

function clipLine(text, max) {
  const line = String(text || '');
  if (line.length <= max) return line;
  return `${line.slice(0, Math.max(0, max - 1))}…`;
}

function slotRect(slot) {
  return { x: COLS[slot.col], y: ROWS[slot.row], w: SLOT_W, h: SLOT_H };
}

function slotLabel(state, slot) {
  if (!slot.dug) return 'DIRT';
  if (!slot.room) return 'EMPTY';
  const room = CONFIG.ROOMS[slot.room];
  return `${room?.name || slot.room}  L${slot.level}`;
}

function slotBlurb(state, slot) {
  const dale = isActive(state, 'dale') ? ' Dale has already taken his plank off the price.' : '';
  if (!slot.dug) {
    const cost = materialCost(state, CONFIG.DIG_COST);
    return `Digging costs ${cost} planks and 1 action. A finished room is also a cot.${dale} ${payReason(state, cost)}`;
  }
  if (!slot.room) {
    const rooms = Object.values(CONFIG.ROOMS);
    const takenAll = rooms.every((room) => state.slots.some((other) => other.room === room.id));
    if (takenAll) return 'Every room you know how to build is already here. Extra holes can wait.';
    const cost = materialCost(state, CONFIG.BUILD_COSTS[0]);
    return `Pick a room. First build is ${cost} planks and 1 action. Each room is also a cot.${dale} ${payReason(state, cost)}`;
  }
  const room = CONFIG.ROOMS[slot.room];
  const levels = room?.levels?.join(' / ') || '';
  if (slot.level >= 3) return `${room?.blurb || ''} ${room?.tag || ''} ${levels} The room is as improved as your carpentry.`;
  const cost = materialCost(state, CONFIG.BUILD_COSTS[slot.level]);
  return `${room?.blurb || ''} ${room?.tag || ''} ${levels} Upgrade to L${slot.level + 1} costs ${cost} planks and 1 action.${dale} ${payReason(state, cost)}`;
}

function canPay(state, cost) {
  return (state.actionsLeft ?? 0) > 0 && state.stats.materials >= cost;
}

function payReason(state, cost) {
  if ((state.actionsLeft ?? 0) <= 0) return 'No actions left. The dirt can wait.';
  if (cost && state.stats.materials < cost) return 'Not enough planks. Or ambition.';
  return 'You can swing a hammer at this.';
}

function dimButton(scene, x, y, label, subtitle) {
  const g = scene.add.graphics();
  g.fillStyle(0x1a120c, 0.85);
  g.fillRoundedRect(-150, -26, 300, subtitle ? 56 : 48, 6);
  g.lineStyle(2, 0x3a4250, 1);
  g.strokeRoundedRect(-150, -26, 300, subtitle ? 56 : 48, 6);
  const text = addText(scene, 0, subtitle ? -10 : 0, label, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '18px',
    color: '#8a847a',
    originX: 0.5,
    originY: 0.5,
  });
  const parts = [g, text];
  if (subtitle) {
    parts.push(addText(scene, 0, 12, subtitle, {
      fontFamily: CONFIG.FONTS.body, fontSize: '12px', color: '#8a847a', originX: 0.5, originY: 0.5,
    }));
  }
  return scene.add.container(x, y, parts);
}

function dashRect(g, x, y, w, h) {
  const step = 14;
  for (let px = x; px < x + w; px += step) g.lineBetween(px, y, Math.min(px + 7, x + w), y);
  for (let px = x; px < x + w; px += step) g.lineBetween(px, y + h, Math.min(px + 7, x + w), y + h);
  for (let py = y; py < y + h; py += step) g.lineBetween(x, py, x, Math.min(py + 7, y + h));
  for (let py = y; py < y + h; py += step) g.lineBetween(x + w, py, x + w, Math.min(py + 7, y + h));
}

function drawPantry(g, rect, state) {
  const cans = Math.max(0, Math.min(10, Math.round(state.stats.food / Math.max(1, foodCap(state) / 10))));
  g.lineStyle(2, 0x6b4524, 0.8);
  g.lineBetween(rect.x + 24, rect.y + 48, rect.x + rect.w - 24, rect.y + 48);
  g.lineBetween(rect.x + 24, rect.y + 88, rect.x + rect.w - 24, rect.y + 88);
  for (let i = 0; i < cans; i += 1) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    g.fillStyle(0xc45c38, 1);
    g.fillRoundedRect(rect.x + 28 + col * 28, rect.y + 28 + row * 40, 16, 22, 2);
  }
  if ((state.stash?.beer || 0) > 0) drawSilverCan(g, rect.x + rect.w - 36, rect.y + 78, 0.9);
}

function drawWater(g, rect, state) {
  const cap = Math.max(1, waterCap(state));
  const ratio = Math.max(0, Math.min(1, state.stats.water / cap));
  g.fillStyle(0x243044, 1);
  g.fillRoundedRect(rect.x + 70, rect.y + 36, 90, 78, 8);
  g.fillStyle(0x7eb0d4, 0.9);
  const h = Math.round(70 * ratio);
  g.fillRect(rect.x + 76, rect.y + 42 + (70 - h), 78, h);
  g.lineStyle(2, 0xc9d7e4, 0.8);
  g.strokeRoundedRect(rect.x + 70, rect.y + 36, 90, 78, 8);
}

function drawGenerator(g, rect, on) {
  g.fillStyle(0x2a3138, 1);
  g.fillRoundedRect(rect.x + 36, rect.y + 48, 120, 58, 6);
  g.fillStyle(on ? CONFIG.COLORS.orange : 0x3a342c, 1);
  g.fillCircle(rect.x + 170, rect.y + 58, on ? 10 : 6);
  g.lineStyle(2, 0x8a93a3, 0.7);
  g.strokeCircle(rect.x + 170, rect.y + 58, 14);
}

function paintLight(g, rect, powered, flicker) {
  g.fillStyle(powered ? 0xffc27a : 0x9bb0c4, powered ? 0.14 : 0.04 + flicker);
  g.fillEllipse(rect.x + rect.w / 2, rect.y + 46, rect.w - 48, 28);
}

function drawCot(g, rect) {
  g.fillStyle(0x6e4b32, 1);
  g.fillRoundedRect(rect.x + 16, rect.y + rect.h - 36, 78, 16, 3);
  g.fillStyle(0xd9c7a4, 1);
  g.fillRect(rect.x + 20, rect.y + rect.h - 34, 62, 8);
  g.fillStyle(0xf4efe4, 1);
  g.fillRect(rect.x + 20, rect.y + rect.h - 34, 14, 8);
}

function drawGrow(g, rect, on) {
  g.fillStyle(on ? 0x7cff6b : 0x2f4a34, on ? 0.28 : 0.16);
  g.fillRect(rect.x + 20, rect.y + 22, rect.w - 40, 18);
  for (let i = 0; i < 4; i += 1) {
    g.fillStyle(0x6b4428, 1);
    g.fillRect(rect.x + 28 + i * 42, rect.y + 52, 22, 14);
    g.fillStyle(on ? 0x3f8f4a : 0x2c4a32, 1);
    g.fillCircle(rect.x + 39 + i * 42, rect.y + 48, 7);
  }
}

function drawRec(g, rect) {
  g.fillStyle(0x6b4428, 1);
  g.fillRoundedRect(rect.x + 24, rect.y + 58, 54, 22, 3);
  g.fillStyle(0x2a3140, 1);
  g.fillCircle(rect.x + rect.w - 48, rect.y + 40, 14);
  g.fillStyle(0xe85d4c, 1);
  g.fillCircle(rect.x + rect.w - 48, rect.y + 40, 3);
  g.fillStyle(0x3a2a38, 1);
  g.fillRoundedRect(rect.x + 90, rect.y + 62, 70, 18, 6);
  g.fillStyle(0x1a120c, 1);
  g.fillRect(rect.x + 108, rect.y + 46, 28, 16);
  g.fillStyle(0xc45c38, 1);
  g.fillRect(rect.x + 116, rect.y + 40, 12, 6);
}

function drawFaraday(g, rect) {
  g.fillStyle(0xc9d0d6, 0.85);
  g.fillRoundedRect(rect.x + 54, rect.y + 28, 86, 78, 4);
  g.lineStyle(1, 0x6a7380, 0.9);
  for (let i = 0; i < 5; i += 1) g.lineBetween(rect.x + 60, rect.y + 36 + i * 14, rect.x + 132, rect.y + 36 + i * 14);
  g.lineStyle(2, 0xe8eef4, 0.8);
  g.strokeRoundedRect(rect.x + 54, rect.y + 28, 86, 78, 4);
}

function drawLead(g, rect) {
  g.fillStyle(0x4a515c, 1);
  g.fillRoundedRect(rect.x + 28, rect.y + 26, rect.w - 56, 78, 4);
  g.fillStyle(0x2a3138, 1);
  g.fillRoundedRect(rect.x + 78, rect.y + 36, 48, 60, 3);
  g.fillStyle(0xd7d0c4, 1);
  g.fillCircle(rect.x + 114, rect.y + 68, 3);
  g.lineStyle(4, 0x1a1e24, 1);
  g.strokeRoundedRect(rect.x + 28, rect.y + 26, rect.w - 56, 78, 4);
}

function drawRoomIcon(g, id, x, y) {
  g.fillStyle(0x1a120c, 1);
  g.fillRoundedRect(x - 16, y - 16, 32, 32, 4);
  g.lineStyle(2, CONFIG.COLORS.rust, 1);
  g.strokeRoundedRect(x - 16, y - 16, 32, 32, 4);
  if (id === 'pantry') {
    g.fillStyle(0xc45c38, 1);
    g.fillRect(x - 8, y - 8, 6, 14);
    g.fillRect(x + 1, y - 6, 6, 12);
  } else if (id === 'water') {
    g.fillStyle(0x7eb0d4, 1);
    g.fillRoundedRect(x - 7, y - 8, 14, 16, 3);
  } else if (id === 'generator') {
    g.fillStyle(CONFIG.COLORS.orange, 1);
    g.fillCircle(x, y, 6);
  } else if (id === 'barricade') {
    g.fillStyle(0x8a5a32, 1);
    g.fillRect(x - 10, y - 6, 20, 4);
    g.fillRect(x - 10, y + 2, 20, 4);
  } else if (id === 'grow') {
    g.fillStyle(0x3f8f4a, 1);
    g.fillCircle(x, y - 2, 7);
  } else if (id === 'rec') {
    g.fillStyle(0xe85d4c, 1);
    g.fillCircle(x, y, 6);
  } else if (id === 'faraday') {
    g.lineStyle(2, 0xe8eef4, 1);
    g.strokeRect(x - 8, y - 8, 16, 16);
  } else if (id === 'lead') {
    g.fillStyle(0x6a7380, 1);
    g.fillRect(x - 8, y - 8, 16, 16);
  }
}

function personSpot(state, id, index) {
  const job = state.crew?.[id]?.job;
  const roomId = job === 'work' ? workRoom(id) : null;
  const workSlot = roomId ? state.slots.find((slot) => slot.room === roomId) : null;
  if (workSlot) {
    const rect = slotRect(workSlot);
    return { x: rect.x + rect.w / 2, y: rect.y + 70 };
  }
  if (job === 'guard') return { x: SHAFT.x + 36 + (index % 2) * 28, y: SHAFT.y + SHAFT.h - 88 };
  const cots = state.slots.filter((slot) => slot.room);
  const order = NEIGHBORS.filter((row) => state.crew?.[row.id]).map((row) => row.id);
  const slot = cots[order.indexOf(id)];
  if (slot) {
    const rect = slotRect(slot);
    return { x: rect.x + 48, y: rect.y + rect.h - 52 };
  }
  return { x: SHAFT.x + 70, y: SHAFT.y + 120 + index * 18 };
}

function drawNeighbor(g, x, y, id, active) {
  g.fillStyle(active ? 0x2a241c : 0x1a1816, 0.95);
  g.fillRoundedRect(x - 7, y - 6, 14, 22, 4);
  g.fillCircle(x, y - 14, 7);
  if (id === 'larry') {
    g.fillStyle(0xd7dde4, 1);
    g.fillTriangle(x - 8, y - 16, x, y - 28, x + 8, y - 16);
  } else if (id === 'kowalski') {
    g.fillStyle(0xc45c38, 1);
    g.fillEllipse(x + 12, y, 10, 6);
  } else if (id === 'dale') {
    g.fillStyle(0xf4efe4, 1);
    g.fillRect(x + 8, y - 4, 8, 12);
  } else if (id === 'tina') {
    g.fillStyle(0x1f8a92, 1);
    g.fillRect(x - 7, y - 2, 14, 10);
  } else if (id === 'kevin') {
    g.fillStyle(0x7ee0ff, 0.95);
    g.fillRoundedRect(x + 8, y - 2, 7, 10, 1);
  }
}

function drawBarricade(g, rect, level) {
  const boards = Math.max(1, level);
  for (let i = 0; i < boards + 1; i += 1) {
    g.fillStyle(i % 2 ? 0x8a5a32 : 0x6b4428, 1);
    g.fillRect(rect.x + 28, rect.y + 36 + i * 16, rect.w - 70, 12);
  }
  g.lineStyle(2, 0xd7d0c4, 0.7);
  g.strokeEllipse(rect.x + rect.w - 48, rect.y + 78, 36, 48);
}

function dirtBurst(scene, rect) {
  if (!scene.textures.exists('p-ash')) return;
  const burst = scene.add.particles(rect.x + rect.w / 2, rect.y + rect.h / 2, 'p-ash', {
    speed: { min: 40, max: 180 },
    angle: { min: 200, max: 340 },
    lifespan: 480,
    scale: { start: 1.1, end: 0.2 },
    tint: 0x6b4428,
    emitting: false,
  }).setDepth(30);
  burst.explode(16);
  scene.time.delayedCall(560, () => burst.destroy());
}
