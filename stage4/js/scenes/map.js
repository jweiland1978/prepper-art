import Phaser from '../phaser.js?v=3';
import { CONFIG, phaseForDay } from '../config.js?v=3';
import { isHere, spotStatus, tickRoads } from '../crew.js?v=3';
import { MARKERS, markerDanger } from '../data/map.js?v=3';
import { phaseCopy } from '../data/phases.js?v=3';
import { Game, touchState } from '../state.js?v=3';
import { Save } from '../save.js?v=3';
import { Audio } from '../audio.js?v=3';
import { addButton, addText } from '../ui.js?v=3';
import { attachAtmosphere, fadeIn } from '../fx.js?v=3';
import { leave, showHud } from '../flow.js?v=3';
import { maybeGaryVisit } from '../logic.js?v=3';
import { fenceLine } from '../trade.js?v=3';
import { presentRecruit, showNotice } from './cards.js?v=3';
import { hasUnlock } from '../unlocks.js?v=3';
import { startClimb, towerOwned } from '../tower.js?v=3';
import { GARY_PIN, TOWER_PIN } from '../data/tower.js?v=3';
import { openMeet, openTrade } from './trade.js?v=3';

const LOOT_LABEL = {
  food: 'Cans',
  water: 'Jugs',
  materials: 'Planks',
  medicine: 'Meds',
  weapon: 'Gear',
  rumor: 'Gossip',
  morale: 'Mood',
  coffee: 'Coffee',
  snacks: 'Snacks',
  beer: 'Beer',
  rockets: 'Rockets',
  gas: 'Gas',
  battery: 'Batteries',
  tinfoil: 'Tinfoil',
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
    tickRoads(state);
    const visit = maybeGaryVisit(state);
    const fence = fenceLine(state);
    Save.write(state);
    Audio.startMusic('lounge');
    if (phase === 'panic' || phase === 'collapse') Audio.startSirens();
    else Audio.stopSirens();
    if (phase === 'collapse') {
      Audio.stopRain();
    } else {
      Audio.startRain();
    }
    if (state.flags?.snowNight === state.day) {
      Audio.stopRain();
      Audio.startSnow();
    }
    this.events.once('shutdown', () => {
      Audio.stopRain();
      Audio.stopSnow();
      Audio.stopSirens();
      Audio.stopJukebox();
      Audio.stopMurmur();
    });
    const afterCards = () => {
      if ((state.actionsLeft ?? 0) <= 0) this.promptNight();
    };
    const showFence = () => {
      if (!fence) {
        afterCards();
        return;
      }
      this.card = showNotice(this, {
        kicker: 'OVER THE FENCE',
        title: 'Gary',
        portrait: 'portrait-gary',
        body: fence,
        button: 'GOT IT',
        onClose: () => {
          this.card = null;
          afterCards();
        },
      });
    };
    const showPhase = () => {
      const copy = phaseCopy(state.day);
      if (!copy || state.flags.phaseCard === state.day) {
        showFence();
        return;
      }
      state.flags.phaseCard = state.day;
      Save.write(state);
      this.card = showNotice(this, {
        kicker: "WHAT'S CHANGED",
        title: copy.title,
        body: copy.card,
        button: 'ONWARD',
        onClose: () => {
          this.card = null;
          showFence();
        },
      });
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
          showPhase();
        },
      });
    } else {
      showPhase();
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
    const status = spotStatus(Game.state, marker);
    const open = status.code === 'open' || status.code === 'tower';
    const home = status.code === 'home';
    const color = status.grey ? 0x6a7380 : open ? CONFIG.COLORS.orange : home ? 0xe6d3ae : 0x8a93a3;
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
    } else if (status.code === 'landmark') {
      const g = this.add.graphics().setDepth(7);
      g.fillStyle(0x1c2430, 0.9);
      g.fillCircle(marker.x, pinY, 5);
      g.lineStyle(1, 0x9aa3b2, 0.6);
      g.strokeCircle(marker.x, pinY, 6);
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
    if (!marker.silent || (marker.id === 'tower' && towerOwned())) {
      const swap = marker.id === 'tavern' && Game.state.day >= 21 && Game.state.day <= 29;
    const label = (home ? 'YOUR HOUSE' : swap ? 'SWAP MEET' : marker.name).toUpperCase();
    const crawl = Game.state.flags?.crawl;
    if (crawl?.id === marker.id && Game.state.day >= crawl.from && Game.state.day <= crawl.until) {
      const warn = this.add.graphics().setDepth(8);
      warn.fillStyle(0xe85d4c, 1);
      warn.fillTriangle(marker.x + 14, pinY - 16, marker.x + 26, pinY - 16, marker.x + 20, pinY - 28);
    }
      const width = Math.min(168, Math.max(84, label.length * 7 + 18));
      // Part B: the tower sits under the HUD; its plate goes below the tap dot so it reads on an iPad.
      const plateY = marker.id === 'tower' ? CONFIG.HUD_H + 44 : pinY + (marker.labelDy || 28);
      const plate = this.add.container(marker.x, plateY).setDepth(8);
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
    const status = spotStatus(state, marker);
    if (marker.id === 'gary') {
      if (status.code !== 'open') {
        this.card = showNotice(this, {
          kicker: 'LOCKED',
          title: marker.name,
          body: status.line || marker.reason || marker.quip,
          button: 'NOT NOW',
          onClose: () => { this.card = null; },
        });
        return;
      }
      const noActions = (state.actionsLeft ?? 0) <= 0;
      // Part B: once unlocked, Gary can be asked to move in from his own gate. Asking is free.
      const canAsk = hasUnlock('gary') && !isHere(state, 'gary') && state.mode === 'prep';
      const buttons = [
        { label: 'NOT NOW', onClick: () => { this.card = null; } },
        noActions
          ? { label: 'HEAD HOME', primary: !canAsk, onClick: () => leave(this, 'NightSummary') }
          : { label: 'TRADE (1 ACTION)', primary: !canAsk, onClick: () => this.payTrade('gary') },
      ];
      if (canAsk) buttons.push({ label: GARY_PIN.ask, primary: true, onClick: () => this.askGary() });
      this.card = showNotice(this, {
        kicker: canAsk ? 'NEIGHBOR' : 'TRADE',
        title: "Gary's Place",
        portrait: 'portrait-gary',
        body: canAsk
          ? GARY_PIN.askBody
          : "The gate is unlatched. He trades water, planks, medicine, gas, batteries, and sometimes ammo. He does not haggle.",
        buttons,
      });
      return;
    }
    if (marker.id === 'tower') {
      this.openTower(marker, status);
      return;
    }
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
    if (status.code === 'landmark') {
      this.card = showNotice(this, {
        kicker: 'LANDMARK',
        title: marker.name,
        body: marker.reason || marker.quip,
        button: 'NOT NOW',
        onClose: () => { this.card = null; },
      });
      return;
    }
    if (marker.kind === 'locked' || status.code === 'boarded' || status.code === 'road' || status.code === 'locked') {
      this.card = showNotice(this, {
        kicker: status.code === 'boarded' ? 'BOARDED' : status.code === 'road' ? 'ROAD' : 'LOCKED',
        title: marker.silent ? 'RADIO TOWER' : marker.name,
        body: status.code === 'locked' ? (marker.reason || marker.quip) : status.line,
        button: 'NOT NOW',
        onClose: () => { this.card = null; },
      });
      return;
    }
    if (marker.id === 'tavern' && state.day >= 21 && state.day <= 29 && state.mode === 'prep') {
      const noActions = (state.actionsLeft ?? 0) <= 0;
      this.card = showNotice(this, {
        kicker: 'SWAP MEET',
        title: "Rusty's Tavern",
        body: 'The jukebox is a rumor. The tables are the point. Three stalls, one action, and somebody always has a story.',
        buttons: [
          { label: 'NOT NOW', onClick: () => { this.card = null; } },
          noActions
            ? { label: 'HEAD HOME', primary: true, onClick: () => leave(this, 'NightSummary') }
            : { label: 'BROWSE (1 ACTION)', primary: true, onClick: () => this.payMeet() },
        ],
      });
      return;
    }
    let skulls = markerDanger(marker, phase);
    if (marker.id === 'bait' && state.flags?.heistCaught) skulls = Math.min(3, skulls + 1);
    const expect = marker.expect?.[phase] || marker.expect?.collapse || '';
    const sheriff = status.code === 'open' && status.line ? `\n\n${status.line}` : '';
    const loot = (marker.loot || []).map((key) => LOOT_LABEL[key] || key).join(', ');
    const noActions = (state.actionsLeft ?? 0) <= 0;
    const crawl = state.flags?.crawl;
    const crawlNote = crawl?.id === marker.id && state.day >= crawl.from && state.day <= crawl.until
      ? '\n\nKevin says it is crawling today.'
      : '';
    this.card = showNotice(this, {
      kicker: phase === 'calm' ? 'OPEN' : phase === 'panic' ? 'THIN' : 'SCARCE',
      title: marker.name,
      body: `${marker.quip}\n\n${expect}\n\nLikely: ${loot || 'whatever is left.'}${sheriff}${crawlNote}`,
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

  /** Part B: Gary's recruit card at his gate. */
  askGary() {
    this.card = { close: () => {} };
    presentRecruit(this, 'gary', { source: 'pin' }).then((line) => {
      if (!this.sys?.isActive()) return;
      touchState();
      Save.write(Game.state);
      this.card = showNotice(this, {
        kicker: 'GARY',
        title: "Gary's Place",
        portrait: 'portrait-gary',
        body: line || 'Gary nods. That is the whole conversation.',
        button: 'OK',
        onClose: () => {
          this.card = null;
          if ((Game.state?.actionsLeft ?? 0) <= 0) this.promptNight();
        },
      });
    });
  }

  /** Part B: the Radio Tower pin. Open from Day 20 once the clue track is done; the climb takes the day. */
  openTower(marker, status) {
    const state = Game.state;
    if (status.code !== 'tower') {
      this.card = showNotice(this, {
        kicker: 'LOCKED',
        title: towerOwned() ? TOWER_PIN.title : 'RADIO TOWER',
        body: status.line || marker.reason || marker.quip,
        button: 'NOT NOW',
        onClose: () => { this.card = null; },
      });
      return;
    }
    const noActions = (state.actionsLeft ?? 0) <= 0;
    this.card = showNotice(this, {
      kicker: TOWER_PIN.kicker,
      title: TOWER_PIN.title,
      body: noActions ? TOWER_PIN.noActions : status.line,
      radio: true,
      buttons: [
        { label: 'NOT NOW', onClick: () => { this.card = null; } },
        noActions
          ? { label: 'HEAD HOME', primary: true, onClick: () => leave(this, 'NightSummary') }
          : { label: TOWER_PIN.button, primary: true, fontSize: '18px', onClick: () => this.climbTower() },
      ],
      buttonW: 280,
    });
  }

  climbTower() {
    const state = Game.state;
    this.card = null;
    if (this.traveling || !startClimb(state)) return;
    this.traveling = true;
    touchState();
    leave(this, 'Tower');
  }

  payTrade(who) {
    const state = Game.state;
    if (this.traveling || (state.actionsLeft ?? 0) <= 0) return;
    state.actionsLeft -= 1;
    touchState();
    Save.write(state);
    this.card = null;
    openTrade(this, { who, onDone: () => Save.write(Game.state) });
  }

  payMeet() {
    const state = Game.state;
    if (this.traveling || (state.actionsLeft ?? 0) <= 0) return;
    state.actionsLeft -= 1;
    touchState();
    Save.write(state);
    this.card = null;
    openMeet(this, () => Save.write(Game.state));
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
