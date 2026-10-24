import Phaser from '../phaser.js?v=5';
import { CONFIG, phaseForDay } from '../config.js?v=5';
import { MARKERS, markerDanger } from '../data/map.js?v=5';
import { Game, touchState } from '../state.js?v=5';
import { Save } from '../save.js?v=5';
import { Audio } from '../audio.js?v=5';
import { addButton, addText } from '../ui.js?v=5';
import { attachAtmosphere, fadeIn } from '../fx.js?v=5';
import { leave, showHud } from '../flow.js?v=5';
import { maybeGaryVisit } from '../logic.js?v=5';
import { showNotice } from './cards.js?v=5';

const LOOT_LABEL = {
  food: 'Cans',
  water: 'Jugs',
  materials: 'Planks',
  medicine: 'Meds',
  weapon: 'Gear',
  rumor: 'Gossip',
  morale: 'Mood',
};

export class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create() {
    this.traveling = false;
    this.departed = false;
    this.card = null;
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    fadeIn(this, 320);
    this.cameras.main.setBackgroundColor('#101820');
    this.drawMap();
    const phase = phaseForDay(state.day);
    const shade = phase === 'collapse' ? 0.38 : phase === 'panic' ? 0.2 : 0.08;
    this.add.rectangle(640, 360, 1280, 720, 0x070b12, shade).setDepth(2);
    this.drawMoon(phase);
    this.drawFog();
    const weather = attachAtmosphere(this, {
      rain: phase !== 'collapse',
      ash: phase === 'collapse',
      depth: 16,
    });
    if (phase === 'collapse') weather.setWeather('ash');
    MARKERS.forEach((marker) => this.drawMarker(marker));
    this.nightButton = addButton(this, 1088, 688, 'CALL IT A NIGHT', () => {
      if (this.traveling) return;
      this.closeCard();
      leave(this, 'NightSummary');
    }, { w: 250, h: 48, primary: false, depth: 10 });
    this.readout = addText(this, 16, 704, '', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '16px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0,
      originY: 1,
    }).setDepth(48);
    this.input.on('pointerdown', (pointer) => {
      if (!Game.settings?.debugCoords || Game.hudLock) return;
      const x = Math.round(pointer.worldX ?? pointer.x);
      const y = Math.round(pointer.worldY ?? pointer.y);
      this.readout.setText(`${x}, ${y}`);
    });
    showHud(this);
    state.lastScene = 'Map';
    const visit = maybeGaryVisit(state);
    Save.write(state);
    Audio.startMusic('lounge');
    if (phase === 'panic' || phase === 'collapse') Audio.startSirens();
    else Audio.stopSirens();
    if (phase === 'collapse') {
      Audio.stopRain();
    } else {
      Audio.startRain();
    }
    this.events.once('shutdown', () => {
      Audio.stopRain();
      Audio.stopSirens();
    });
    const afterVisit = () => {
      if ((state.actionsLeft ?? 0) <= 0) this.promptNight();
    };
    if (visit) {
      this.card = showNotice(this, {
        kicker: 'OVER THE FENCE',
        title: visit.who,
        portrait: visit.portrait,
        body: `${visit.line}\n\n${visit.bonus}`,
        button: 'GOT IT',
        onClose: () => {
          this.card = null;
          afterVisit();
        },
      });
    } else {
      afterVisit();
    }
  }

  drawMap() {
    if (!this.textures.exists('map-lake-orwell')) return;
    const image = this.add.image(640, 360, 'map-lake-orwell').setDepth(0);
    const scale = Math.max(CONFIG.WIDTH / (image.width || CONFIG.WIDTH), CONFIG.HEIGHT / (image.height || CONFIG.HEIGHT));
    image.setScale(scale);
  }

  drawMoon(phase) {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(phase === 'collapse' ? 0xffb090 : 0xffe6c2, phase === 'calm' ? 0.07 : 0.12);
    g.fillCircle(1080, 36, 240);
  }

  drawFog() {
    const fog = this.add.graphics().setDepth(3).setAlpha(0.16);
    fog.fillStyle(0xd5dde6, 1);
    fog.fillEllipse(420, 280, 520, 160);
    fog.fillEllipse(860, 420, 480, 140);
    this.tweens.add({
      targets: fog,
      x: 70,
      duration: 16000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  drawMarker(marker) {
    const phase = phaseForDay(Game.state.day);
    const open = marker.kind === 'open';
    const home = marker.kind === 'home';
    const color = open ? CONFIG.COLORS.orange : home ? 0xe6d3ae : 0x8a93a3;
    const pinY = marker.y;
    if (open) {
      const ring = this.add.circle(marker.x, pinY, 15).setStrokeStyle(2, color, 0.95).setDepth(6);
      this.add.circle(marker.x, pinY, 6, color).setDepth(7);
      this.tweens.add({
        targets: ring,
        scale: 1.45,
        alpha: 0.25,
        duration: 900,
        yoyo: true,
        repeat: -1,
      });
    } else if (home) {
      const g = this.add.graphics().setDepth(7);
      g.lineStyle(2, color, 1);
      g.strokeRoundedRect(marker.x - 11, pinY - 11, 22, 22, 3);
      g.lineBetween(marker.x - 7, pinY - 7, marker.x + 7, pinY + 7);
      g.lineBetween(marker.x + 7, pinY - 7, marker.x - 7, pinY + 7);
    } else {
      const g = this.add.graphics().setDepth(7);
      g.fillStyle(0x2a3140, 0.92);
      g.fillCircle(marker.x, pinY, 10);
      g.lineStyle(2, color, 0.9);
      g.strokeCircle(marker.x, pinY, 10);
      g.strokeRoundedRect(marker.x - 4, pinY - 1, 8, 7, 1);
      g.beginPath();
      g.arc(marker.x, pinY - 2, 3, Math.PI, 0, false);
      g.strokePath();
    }
    if (!marker.silent) {
      const label = (home ? 'YOUR HOUSE' : marker.name).toUpperCase();
      const width = Math.min(168, Math.max(84, label.length * 7 + 18));
      const plate = this.add.container(marker.x, pinY + (marker.labelDy || 28)).setDepth(8);
      const g = this.add.graphics();
      g.fillStyle(CONFIG.COLORS.navy, 0.9);
      g.fillRoundedRect(-width / 2, -12, width, 22, 4);
      g.lineStyle(1, CONFIG.COLORS.rust, 1);
      g.strokeRoundedRect(-width / 2, -12, width, 22, 4);
      const text = addText(this, 0, 0, label, {
        fontFamily: CONFIG.FONTS.heading,
        fontSize: '12px',
        color: CONFIG.COLORS.text,
        originX: 0.5,
        originY: 0.5,
      });
      plate.add([g, text]);
    }
    const hitY = pinY < CONFIG.HUD_H + 8 ? CONFIG.HUD_H + 18 : pinY;
    if (hitY !== pinY) {
      const stalk = this.add.graphics().setDepth(6);
      stalk.lineStyle(2, color, 0.7);
      stalk.lineBetween(marker.x, pinY, marker.x, hitY);
      this.add.circle(marker.x, hitY, 5, color, 0.8).setDepth(7);
    }
    const zone = this.add.zone(marker.x, hitY, 64, 64).setOrigin(0.5).setDepth(9);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => this.openMarker(marker));
  }

  closeCard() {
    this.card?.close?.();
    this.card = null;
  }

  openMarker(marker) {
    if (this.traveling || this.card) return;
    Audio.click();
    const state = Game.state;
    const phase = phaseForDay(state.day);
    if (marker.kind === 'home') {
      this.card = showNotice(this, {
        kicker: 'HOME',
        title: marker.name,
        body: `${marker.quip}\n\nThe hatch is free. Digging still costs an action, once you are downstairs.`,
        buttons: [
          { label: 'NOT NOW', onClick: () => { this.card = null; } },
          { label: 'OPEN THE HATCH', primary: true, onClick: () => leave(this, 'Bunker') },
        ],
      });
      return;
    }
    if (marker.kind === 'locked') {
      this.card = showNotice(this, {
        kicker: 'LOCKED',
        title: marker.silent ? 'RADIO TOWER' : marker.name,
        body: marker.reason || marker.quip,
        button: 'NOT NOW',
        onClose: () => { this.card = null; },
      });
      return;
    }
    const skulls = markerDanger(marker, phase);
    const expect = marker.expect?.[phase] || marker.expect?.collapse || '';
    const loot = (marker.loot || []).map((key) => LOOT_LABEL[key] || key).join(', ');
    const noActions = (state.actionsLeft ?? 0) <= 0;
    this.card = showNotice(this, {
      kicker: phase === 'calm' ? 'OPEN' : phase === 'panic' ? 'THIN' : 'SCARCE',
      title: marker.name,
      body: `${marker.quip}\n\n${expect}\n\nLikely: ${loot || 'whatever is left.'}`,
      decorate: (root) => {
        this.drawSkulls(root, 500, 468, skulls);
        this.drawLoot(root, 760, 468, marker.loot || []);
      },
      buttons: [
        { label: 'NOT NOW', onClick: () => { this.card = null; } },
        noActions
          ? { label: 'HEAD HOME', primary: true, onClick: () => leave(this, 'NightSummary') }
          : { label: 'GO (1 ACTION)', primary: true, onClick: () => this.travel(marker) },
      ],
    });
  }

  drawSkulls(root, x, y, count) {
    const g = this.add.graphics();
    for (let i = 0; i < 3; i += 1) {
      const cx = x - 36 + i * 36;
      const on = i < count;
      g.lineStyle(2, on ? 0xe85d4c : 0x5c6570, 1);
      g.strokeCircle(cx, y, 10);
      g.lineBetween(cx - 4, y - 3, cx - 1, y + 1);
      g.lineBetween(cx - 1, y - 3, cx - 4, y + 1);
      g.lineBetween(cx + 1, y - 3, cx + 4, y + 1);
      g.lineBetween(cx + 4, y - 3, cx + 1, y + 1);
    }
    root.add(g);
  }

  drawLoot(root, x, y, loot) {
    const g = this.add.graphics();
    loot.slice(0, 4).forEach((key, index) => {
      const cx = x + index * 36;
      if (key === 'food') {
        g.fillStyle(0xc45c38, 1);
        g.fillRoundedRect(cx - 8, y - 10, 14, 18, 2);
      } else if (key === 'water') {
        g.fillStyle(0x7eb0d4, 1);
        g.fillRoundedRect(cx - 7, y - 8, 14, 16, 3);
      } else if (key === 'medicine') {
        g.fillStyle(0xf4efe4, 1);
        g.fillRoundedRect(cx - 8, y - 8, 16, 16, 2);
        g.fillStyle(0xe85d4c, 1);
        g.fillRect(cx - 2, y - 6, 4, 12);
        g.fillRect(cx - 6, y - 2, 12, 4);
      } else {
        g.fillStyle(0xb5834a, 1);
        g.fillRoundedRect(cx - 10, y - 4, 20, 8, 2);
      }
    });
    root.add(g);
  }

  travel(marker) {
    if (this.traveling) return;
    const state = Game.state;
    if ((state.actionsLeft ?? 0) <= 0) {
      this.promptNight();
      return;
    }
    this.traveling = true;
    this.closeCard();
    const home = MARKERS.find((pin) => pin.kind === 'home') || { x: 675, y: 519 };
    const from = { x: home.x, y: home.y };
    const to = { x: marker.x, y: marker.y };
    const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 36 };
    const points = [from, mid, to];
    const g = this.add.graphics().setDepth(18);
    const progress = { t: 0 };
    state.flags.trip = { location: marker.id, paid: false, eventId: null, applied: false, resultText: '' };
    const depart = () => {
      if (this.departed || !this.sys?.isActive()) return;
      this.departed = true;
      g.destroy();
      if (state.flags.trip && !state.flags.trip.paid && (state.actionsLeft ?? 0) > 0) {
        state.flags.trip.paid = true;
        state.actionsLeft -= 1;
        touchState();
      }
      leave(this, 'Scavenge');
    };
    this.tweens.add({
      targets: progress,
      t: 1,
      duration: 900,
      onUpdate: () => {
        if (this.departed) return;
        g.clear();
        g.lineStyle(3, CONFIG.COLORS.orange, 0.95);
        const steps = 36;
        const n = Math.floor(progress.t * steps);
        for (let i = 0; i < n; i += 2) {
          const p = pointAlong(points, i / steps);
          const q = pointAlong(points, Math.min(1, (i + 0.55) / steps));
          g.lineBetween(p.x, p.y, q.x, q.y);
        }
      },
      onComplete: depart,
    });
    this.time.delayedCall(1600, depart);
  }

  promptNight() {
    if (this.card) return;
    this.card = showNotice(this, {
      kicker: 'THAT IS THE DAY',
      title: 'HEAD HOME',
      body: 'No actions left. The map will keep. The night summary will not start itself, unless you ask.',
      buttons: [
        { label: 'NOT YET', onClick: () => { this.card = null; } },
        { label: 'HEAD HOME', primary: true, onClick: () => leave(this, 'NightSummary') },
      ],
    });
  }
}

function pointAlong(points, t) {
  const spans = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const len = Phaser.Math.Distance.Between(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    spans.push(len);
    total += len;
  }
  let remain = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < spans.length; i += 1) {
    if (remain <= spans[i] || i === spans.length - 1) {
      const u = spans[i] ? remain / spans[i] : 0;
      return {
        x: Phaser.Math.Linear(points[i].x, points[i + 1].x, u),
        y: Phaser.Math.Linear(points[i].y, points[i + 1].y, u),
      };
    }
    remain -= spans[i];
  }
  return points[points.length - 1];
}
