import Phaser from '../phaser.js?v=5';
import { CONFIG } from '../config.js?v=5';
import { Game, bus, changeStat, foodCap, roomLevel, touchState, waterCap } from '../state.js?v=5';
import { Save } from '../save.js?v=5';
import { Audio } from '../audio.js?v=5';
import { addButton, addText } from '../ui.js?v=5';
import { attachAtmosphere, fadeIn } from '../fx.js?v=5';
import { leave, showHud } from '../flow.js?v=5';
import { maybeGaryVisit, memorialCopy } from '../logic.js?v=5';
import { showNotice } from './cards.js?v=5';

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
    this.dog = this.add.graphics().setDepth(8);
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

    addButton(this, 210, 124, 'BACK TO MAP', () => {
      if (this.busy) return;
      this.closeModal();
      leave(this, 'Map');
    }, { w: 230, h: 48, depth: 12 });
    addButton(this, 640, 124, 'CALL IT A NIGHT', () => {
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
    if (roomLevel(state, 'generator') >= 1) Audio.startGenerator();
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
    this.world.clear();
    this.drawShaft(state);
    state.slots.forEach((slot, index) => {
      this.drawSlot(state, slot);
      this.labels[index]?.setText(slotLabel(state, slot));
    });
    const left = state.actionsLeft ?? 0;
    this.status?.setText(`${left} action${left === 1 ? '' : 's'}\n${state.stats.materials} planks`);
    this.drawDog();
    if (roomLevel(state, 'generator') >= 1) Audio.startGenerator();
  }

  drawShaft(state) {
    const g = this.world;
    const powered = roomLevel(state, 'generator') >= 1;
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
    if (slot.room === 'pantry') drawPantry(g, rect, state);
    else if (slot.room === 'water') drawWater(g, rect, state);
    else if (slot.room === 'generator') drawGenerator(g, rect, roomLevel(state, 'generator') >= 1);
    else if (slot.room === 'barricade') drawBarricade(g, rect, slot.level);
  }

  drawDog() {
    if (!this.dog?.active) return;
    const x = SHAFT.x + SHAFT.w / 2 - 6;
    const y = SHAFT.y + SHAFT.h - 46;
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
    this.modal = showNotice(this, {
      kicker: 'MEMORIAL',
      title: 'THE PLANK',
      body: memorialCopy(Game.state),
      button: 'BACK',
      onClose: () => { this.modal = null; },
    });
  }

  openSlot(slot) {
    if (this.modal || this.busy) return;
    const state = Game.state;
    const root = this.add.container(0, 0).setDepth(40);
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.62).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(CONFIG.COLORS.navy, 0.94);
    panel.fillRoundedRect(180, 150, 920, 440, 10);
    panel.lineStyle(2, CONFIG.COLORS.rust, 1);
    panel.strokeRoundedRect(180, 150, 920, 440, 10);
    root.add([blocker, panel]);
    const title = !slot.dug ? 'UNDUG' : slot.room ? `${CONFIG.ROOMS[slot.room]?.name || slot.room}  L${slot.level}` : 'DUG OUT';
    root.add(addText(this, 640, 190, title, {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '42px',
      color: CONFIG.COLORS.text,
      originX: 0.5,
      originY: 0.5,
    }));
    const reason = addText(this, 640, 250, slotBlurb(state, slot), {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '18px',
      color: CONFIG.COLORS.textMuted,
      originX: 0.5,
      originY: 0,
      align: 'center',
      wordWrap: { width: 820 },
    });
    root.add(reason);
    const close = () => {
      root.destroy();
      this.modal = null;
    };
    this.modal = { close };
    const buttons = [];
    if (!slot.dug) {
      buttons.push(this.actionButton(state, `DIG (${CONFIG.DIG_COST} PLANKS)`, canPay(state, CONFIG.DIG_COST), () => {
        close();
        this.dig(slot);
      }));
    } else if (!slot.room) {
      Object.values(CONFIG.ROOMS).forEach((room) => {
        const taken = state.slots.some((other) => other.room === room.id);
        buttons.push({
          label: room.name.toUpperCase(),
          enabled: !taken && canPay(state, CONFIG.BUILD_COSTS[0]),
          reason: taken ? 'One is enough. It is already trying.' : payReason(state, CONFIG.BUILD_COSTS[0]),
          onClick: () => {
            close();
            this.build(slot, room.id);
          },
        });
      });
    } else if (slot.level < 3) {
      const cost = CONFIG.BUILD_COSTS[slot.level];
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
      const x = buttons.length === 1 ? 640 : 460 + col * 360;
      const y = 360 + row * 74;
      if (!button.enabled) {
        root.add(dimButton(this, x, y, button.label));
        return;
      }
      root.add(addButton(this, x, y, button.label, button.onClick, { w: 280, h: 52, primary: true }));
    });
    root.add(addButton(this, 640, 540, 'NOT NOW', close, { w: 220, h: 48 }));
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
    if (this.busy || slot.dug) return;
    if (!canPay(state, CONFIG.DIG_COST)) return;
    this.busy = true;
    changeStat('materials', -CONFIG.DIG_COST);
    state.actionsLeft -= 1;
    touchState();
    Audio.dig();
    this.time.delayedCall(420, () => {
      if (!this.sys?.isActive()) return;
      slot.dug = true;
      Save.write(state);
      this.busy = false;
      this.refresh();
    });
    dirtBurst(this, slotRect(slot));
  }

  build(slot, roomId) {
    const state = Game.state;
    const cost = CONFIG.BUILD_COSTS[0];
    if (this.busy || !slot.dug || slot.room) return;
    if (state.slots.some((other) => other.room === roomId)) return;
    if (!canPay(state, cost)) return;
    this.busy = true;
    changeStat('materials', -cost);
    state.actionsLeft -= 1;
    slot.room = roomId;
    slot.level = 1;
    touchState();
    Audio.hammer();
    Save.write(state);
    this.busy = false;
    this.refresh();
  }

  upgrade(slot) {
    const state = Game.state;
    if (this.busy || !slot.room || slot.level >= 3) return;
    const cost = CONFIG.BUILD_COSTS[slot.level];
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
  if (!slot.dug) {
    return `Digging costs ${CONFIG.DIG_COST} planks and 1 action. It does not open the neighbors. ${payReason(state, CONFIG.DIG_COST)}`;
  }
  if (!slot.room) {
    const rooms = Object.values(CONFIG.ROOMS);
    const takenAll = rooms.every((room) => state.slots.some((other) => other.room === room.id));
    if (takenAll) return 'Every room you know how to build is already here. Extra holes can wait.';
    return `Pick a room. First build costs ${CONFIG.BUILD_COSTS[0]} planks and 1 action. ${payReason(state, CONFIG.BUILD_COSTS[0])}`;
  }
  const room = CONFIG.ROOMS[slot.room];
  if (slot.level >= 3) return `${room?.blurb || ''} The room is as improved as your carpentry.`;
  const cost = CONFIG.BUILD_COSTS[slot.level];
  return `${room?.blurb || ''} Upgrade to L${slot.level + 1} costs ${cost} planks and 1 action. ${payReason(state, cost)}`;
}

function canPay(state, cost) {
  return (state.actionsLeft ?? 0) > 0 && state.stats.materials >= cost;
}

function payReason(state, cost) {
  if ((state.actionsLeft ?? 0) <= 0) return 'No actions left. The dirt can wait.';
  if (cost && state.stats.materials < cost) return 'Not enough planks. Or ambition.';
  return 'You can swing a hammer at this.';
}

function dimButton(scene, x, y, label) {
  const g = scene.add.graphics();
  g.fillStyle(0x1a120c, 0.85);
  g.fillRoundedRect(-140, -24, 280, 48, 6);
  g.lineStyle(2, 0x3a4250, 1);
  g.strokeRoundedRect(-140, -24, 280, 48, 6);
  const text = addText(scene, 0, 0, label, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '20px',
    color: '#8a847a',
    originX: 0.5,
    originY: 0.5,
  });
  return scene.add.container(x, y, [g, text]);
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
