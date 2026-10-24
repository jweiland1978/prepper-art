import Phaser from '../phaser.js?v=7';
import { CONFIG, phaseForDay } from '../config.js?v=7';
import { nickCrew, spotStatus, tripExtras } from '../crew.js?v=7';
import { markerById } from '../data/map.js?v=7';
import { Game } from '../state.js?v=7';
import { Save } from '../save.js?v=7';
import { Audio } from '../audio.js?v=7';
import { addText } from '../ui.js?v=7';
import { attachAtmosphere, fadeIn } from '../fx.js?v=7';
import { endRun, leave, showHud } from '../flow.js?v=7';
import {
  applyDeltas,
  eventLookup,
  maybeGaryVisit,
  pickEvent,
  resolveChoice,
  resolveDanger,
  rollLoot,
} from '../logic.js?v=7';
import { presentRecruit, showDanger, showNotice } from './cards.js?v=7';
import { openTrade, presentCoat, presentLaunch } from './trade.js?v=7';
import { grantCoat, rummageCoatRoll } from '../trade.js?v=7';

export class ScavengeScene extends Phaser.Scene {
  constructor() {
    super('Scavenge');
  }

  create() {
    const state = Game.state;
    if (!state) {
      this.scene.start('Title');
      return;
    }
    const phase = phaseForDay(state.day);
    fadeIn(this, 320);
    this.cameras.main.setBackgroundColor('#070b12');
    const loc = state.flags.trip?.location;
    const spot = markerById(loc);
    const wanted = spot?.bg;
    const bgKey = wanted && this.textures.exists(wanted)
      ? wanted
      : loc === 'tavern' && this.textures.exists('bg-tavern')
        ? 'bg-tavern'
        : 'bg-mainstreet';
    let backdrop = null;
    if (this.textures.exists(bgKey)) {
      backdrop = this.add.image(640, 360, bgKey).setDepth(0);
      const scale = Math.max(CONFIG.WIDTH / (backdrop.width || CONFIG.WIDTH), CONFIG.HEIGHT / (backdrop.height || CONFIG.HEIGHT));
      backdrop.setScale(scale);
      backdrop.setAlpha(0.78);
    }
    this.dressSpot(spot, backdrop);
    this.add.rectangle(640, 360, 1280, 720, 0x070b12, phase === 'collapse' ? 0.45 : 0.28).setDepth(1);
    attachAtmosphere(this, { rain: phase !== 'collapse', ash: phase === 'collapse', depth: 8 });
    showHud(this);
    state.lastScene = 'Scavenge';
    Audio.startMusic('lounge');
    if (phase === 'collapse') {
      Audio.stopRain();
      Audio.startSirens();
    } else if (phase === 'panic') {
      Audio.startRain();
      Audio.startSirens();
    } else {
      Audio.startRain();
      Audio.stopSirens();
    }
    this.events.once('shutdown', () => {
      Audio.stopRain();
      Audio.stopSirens();
      Audio.stopJukebox();
      Audio.stopMurmur();
    });

    const trip = state.flags.trip;
    if (!trip?.location || !markerById(trip.location) || markerById(trip.location).kind !== 'open') {
      showNotice(this, {
        kicker: 'OUT ON FOOT',
        title: 'NOWHERE IN PARTICULAR',
        body: 'You are in the street with no errand. Embarrassing, and easy to fix.',
        button: 'HEAD BACK',
        onClose: () => leave(this, 'Map'),
      });
      return;
    }
    this.trip = trip;
    this.marker = markerById(trip.location);
    const closed = spotStatus(state, this.marker);
    if (closed.code !== 'open') {
      showNotice(this, {
        kicker: 'CLOSED',
        title: this.marker.name,
        body: closed.line,
        button: 'HEAD BACK',
        onClose: () => leave(this, 'Map'),
      });
      return;
    }
    if (!trip.paid) {
      if ((state.actionsLeft ?? 0) > 0) state.actionsLeft -= 1;
      trip.paid = true;
    }
    if (trip.applied) {
      Save.write(state);
      this.finish(trip.resultText || 'You already did this errand.');
      return;
    }
    if (!trip.eventId) {
      const event = pickEvent(state, trip.location);
      trip.eventId = event.id;
    }
    Save.write(state);
    this.event = eventLookup(trip.eventId) || pickEvent(state, trip.location);
    this.slideTitle();
    this.time.delayedCall(420, () => {
      if (!this.sys.isActive()) return;
      const visit = maybeGaryVisit(state);
      const start = () => {
        try {
          this.beginErrand();
        } catch (error) {
          console.error('[PREPPER] Errand failed.', error);
          this.finish('The errand fell apart. You can still head back.');
        }
      };
      if (visit) {
        Save.write(state);
        showNotice(this, {
          kicker: 'OVER THE FENCE',
          title: visit.who,
          portrait: visit.portrait,
          body: `${visit.line}\n\n${visit.bonus}`,
          button: 'BACK TO THE ERRAND',
          onClose: start,
        });
        return;
      }
      start();
    });
  }

  slideTitle() {
    const title = addText(this, 1500, 120, `${this.marker.name.toUpperCase()}`, {
      fontFamily: CONFIG.FONTS.display,
      fontSize: '54px',
      color: CONFIG.COLORS.text,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(12);
    const sub = addText(this, 1500, 168, this.marker.quip, {
      fontFamily: CONFIG.FONTS.radio,
      fontSize: '18px',
      color: CONFIG.COLORS.textMuted,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(12);
    this.tweens.add({ targets: [title, sub], x: 640, duration: 420, ease: 'Cubic.easeOut' });
  }

  dressSpot(marker, image) {
    if (!marker) return;
    if (marker.tint && image) image.setTint(marker.tint);
    if (marker.mist) {
      const mist = this.add.graphics().setDepth(3).setAlpha(0.28);
      mist.fillStyle(0xb7c7d6, 1);
      mist.fillEllipse(220, 540, 760, 200);
    }
    if (marker.id === 'tavern') {
      const glow = this.add.rectangle(200, 150, 110, 26, 0xff4d6a, 0.5).setDepth(4);
      this.tweens.add({ targets: glow, alpha: 0.12, duration: 420, yoyo: true, repeat: -1 });
      Audio.startJukebox();
      if ((Game.state?.day || 1) >= 21) Audio.startMurmur();
    }
    if (marker.flicker === 'fluorescent' || marker.id === 'church') {
      const tube = this.add.rectangle(640, 86, 440, 8, 0xdfffea, 0.4).setDepth(4);
      this.tweens.add({ targets: tube, alpha: 0.08, duration: 70, yoyo: true, repeat: -1, hold: 360 });
    }
    if (marker.id === 'dairy') {
      const neon = this.add.rectangle(640, 96, 280, 16, 0xffb7d5, 0.5).setDepth(4);
      this.tweens.add({ targets: neon, alpha: 0.18, duration: 800, yoyo: true, repeat: -1 });
    }
    if (marker.id === 'tent') {
      const bulb = this.add.circle(1000, 130, 11, 0xffe7a0, 0.9).setDepth(4);
      this.tweens.add({ targets: bulb, x: 1024, duration: 900, yoyo: true, repeat: -1 });
      const sparks = this.add.graphics().setDepth(5);
      for (let i = 0; i < 8; i += 1) {
        sparks.fillStyle(0xffc14a, 0.85);
        sparks.fillCircle(640 + i * 36, 210 + (i % 3) * 24, 2);
      }
      this.tweens.add({ targets: sparks, y: -16, alpha: 0.25, duration: 480, yoyo: true, repeat: -1 });
    }
  }

  beginErrand() {
    const state = Game.state;
    if (this.marker?.id === 'church' && (state?.day || 1) >= 6 && rummageCoatRoll(state) && grantCoat(state, 'rummage')) {
      Save.write(state);
      presentCoat(this, 'rummage', () => this.present());
      return;
    }
    this.present();
  }

  present() {
    const event = this.event;
    if (!event) {
      this.finish('The spot had nothing to say. You still went.');
      return;
    }
    if (event.kind !== 'recruit') {
      const company = tripExtras(Game.state);
      if (company.line) Game.state.flags.alongLine = company.line;
    }
    if (event.kind === 'danger') {
      this.faceDanger(event);
      return;
    }
    if (event.kind === 'choice') {
      this.faceChoice(event);
      return;
    }
    if (event.kind === 'cameo') {
      this.faceCameo(event);
      return;
    }
    if (event.kind === 'trade') {
      this.faceTrade(event);
      return;
    }
    if (event.kind === 'recruit') {
      this.faceRecruit(event);
      return;
    }
    this.faceFind(event);
  }

  faceRecruit(event) {
    presentRecruit(this, event.neighbor, { source: 'trip' }).then((line) => {
      if (!this.sys?.isActive()) return;
      this.commit(line || event.text, {});
    });
  }

  faceFind(event) {
    showNotice(this, {
      kicker: this.marker.name.toUpperCase(),
      title: 'SEARCH',
      body: event.text,
      button: 'SEARCH',
      onClose: () => {
        const state = Game.state;
        const deltas = rollLoot(event.bias, phaseForDay(state.day), state);
        mergeStash(deltas, event.stash);
        this.commit(event.text, deltas);
      },
    });
  }

  faceCameo(event) {
    showNotice(this, {
      kicker: 'NEIGHBOR',
      title: event.who || 'Neighbor',
      portrait: event.portrait,
      body: event.text,
      button: event.button || 'TAKE IT',
      onClose: () => {
        const deltas = grantDeltas(event.grant, Game.state);
        this.commit(event.text, deltas);
      },
    });
  }

  faceTrade(event) {
    if (event.id === 'super-kevin' || event.trader === 'kevin') {
      openTrade(this, {
        who: 'kevin',
        onDone: (line) => {
          if (!this.sys?.isActive()) return;
          this.commit(`${event.text}\n\n${line || 'You keep walking.'}`, {});
        },
      });
      return;
    }
    const state = Game.state;
    const canPay = (state.stats.food || 0) >= (event.cost?.food || 1);
    const buttons = [
      {
        label: event.leaveLabel || 'KEEP WALKING',
        onClick: () => this.commit(`${event.text}\n\nYou keep walking. He keeps the livestream.`, {}),
      },
    ];
    if (canPay) {
      buttons.push({
        label: event.payLabel || 'TRADE',
        primary: true,
        onClick: () => {
          const deltas = { ...(event.cost ? negative(event.cost) : {}), ...(event.grant || {}) };
          this.commit(`${event.text}\n\nYou trade a can for the tip.`, deltas);
        },
      });
    } else {
      buttons.push({
        label: 'NO SNACKS',
        onClick: () => this.commit('You have no snacks. He has no viewers. You are even.', {}),
      });
    }
    showNotice(this, {
      kicker: 'NEIGHBOR',
      title: event.who || 'Neighbor',
      portrait: event.portrait,
      body: event.text,
      buttons,
    });
  }

  faceChoice(event) {
    const choices = event.choices?.length ? event.choices : [{ label: 'LOOK AROUND', risk: 'Safe', success: { loot: true, text: 'You look. You find a little.' } }];
    showNotice(this, {
      kicker: this.marker.name.toUpperCase(),
      title: 'CHOOSE',
      body: event.text,
      buttons: choices.map((choice, index) => ({
        label: choice.label,
        subtitle: choice.risk || 'Safe',
        primary: index === 0,
        onClick: () => {
          const outcome = resolveChoice(choice, event, Game.state);
          this.commit(outcome.text, outcome.deltas);
        },
      })),
    });
  }

  faceDanger(event) {
    const ask = () => {
      if (!this.sys?.isActive()) return;
      if (Game.state?.flags) Game.state.flags.dangerWhere = 'trip';
      showDanger(this, {
        face: event.face || 'Trouble',
        text: event.text,
        onPick: (action) => {
          const state = Game.state;
          if (!state) return;
          state.flags.dangerWhere = 'trip';
          if (action === 'light') {
            presentLaunch(this, {
              mode: 'light',
              event,
              where: 'trip',
              kevin: event.neighbor === 'kevin' || event.who === 'Kevin',
            }).then((result) => {
              if (!this.sys?.isActive()) return;
              if (!result?.tactical) {
                ask();
                return;
              }
              if (result.crowd) {
                const deltas = doubled(rollLoot(event.bias, phaseForDay(state.day), state));
                this.commit(`${result.text}\n\nThe shelf paid double.`, deltas);
                return;
              }
              this.commit(result.text, {});
            });
            return;
          }
          const outcome = resolveDanger(action, state, event.bias);
          const nick = !outcome.ok ? nickCrew(state, 1) : '';
          const text = nick ? `${outcome.text}\n\n${nick}` : outcome.text;
          this.commit(text, outcome.deltas);
        },
      });
    };
    ask();
  }

  commit(text, deltas) {
    const state = Game.state;
    const trip = this.trip;
    if (trip.applied) {
      this.finish(trip.resultText || text);
      return;
    }
    let body = text;
    if (state.flags.moraleLootLine) {
      body = `${body}\n\n${state.flags.moraleLootLine}`;
      state.flags.moraleLootLine = '';
    }
    if (state.flags.alongLine) {
      body = `${body}\n\n${state.flags.alongLine}`;
      state.flags.alongLine = '';
    }
    if (state.flags.boostLine) {
      body = `${body}\n\n${state.flags.boostLine}`;
      state.flags.boostLine = '';
    }
    if (state.flags.coatLootLine) {
      body = `${body}\n\n${state.flags.coatLootLine}`;
      state.flags.coatLootLine = '';
    }
    if (state.flags.dockReady && trip.location === 'super') {
      state.flags.dockReady = false;
      body = `${body}\n\nThe loading dock was the quiet side.`;
    }
    if (this.marker?.id === 'tent' && !trip.rocketsGiven) {
      const span = CONFIG.ITEMS.tentRockets || [2, 5];
      const count = span[0] + Math.floor(Math.random() * (Math.max(span[1] - span[0], 0) + 1));
      deltas.stash = { ...(deltas.stash || {}) };
      deltas.stash.rockets = (deltas.stash.rockets || 0) + count;
      trip.rocketsGiven = true;
      body = `${body}\n\nBottle rockets +${count}. He says they are basically safe. He is missing two eyebrows.`;
    }
    const gained = applyDeltas(state, deltas);
    if (gained) Audio.loot();
    trip.applied = true;
    trip.resultText = gained ? `${body}\n\n${gained}` : body;
    Save.write(state);
    this.finish(trip.resultText);
  }

  finish(text) {
    const down = (Game.state?.stats.health ?? 1) <= 0;
    showNotice(this, {
      kicker: this.marker?.name?.toUpperCase() || 'TRIP',
      title: down ? 'THAT DID IT' : 'HEAD BACK',
      body: text,
      button: down ? "THAT'S THE RUN" : 'HEAD BACK',
      onClose: () => {
        if (down) {
          endRun(this);
          return;
        }
        Game.state.flags.trip = null;
        leave(this, 'Map');
      },
    });
  }
}

function mergeStash(deltas, stash) {
  if (!stash) return deltas;
  deltas.stash = deltas.stash || {};
  Object.entries(stash).forEach(([key, value]) => {
    deltas.stash[key] = (deltas.stash[key] || 0) + value;
  });
  return deltas;
}

function negative(cost) {
  const deltas = {};
  Object.entries(cost).forEach(([key, value]) => {
    deltas[key] = -Math.abs(value);
  });
  return deltas;
}

function grantDeltas(grant, state) {
  if (!grant) return {};
  const deltas = {};
  if (grant.loot) Object.assign(deltas, rollLoot(grant.bias, phaseForDay(state.day), state));
  mergeStash(deltas, grant.stash);
  ['food', 'water', 'materials', 'medicine', 'health', 'morale'].forEach((key) => {
    if (grant[key]) deltas[key] = (deltas[key] || 0) + grant[key];
  });
  if (grant.weapon) deltas.weapon = grant.weapon;
  if (grant.rumor) deltas.rumor = grant.rumor;
  return deltas;
}

function doubled(deltas) {
  const out = {};
  Object.entries(deltas || {}).forEach(([key, value]) => {
    if (key === 'stash' && value && typeof value === 'object') {
      out.stash = {};
      Object.entries(value).forEach(([stashKey, count]) => {
        out.stash[stashKey] = count * 2;
      });
      return;
    }
    if (typeof value === 'number') out[key] = value * 2;
  });
  return out;
}
