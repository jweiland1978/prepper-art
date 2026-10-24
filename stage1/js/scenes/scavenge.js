import Phaser from '../phaser.js?v=6';
import { CONFIG, phaseForDay } from '../config.js?v=6';
import { markerById } from '../data/map.js?v=6';
import { Game } from '../state.js?v=6';
import { Save } from '../save.js?v=6';
import { Audio } from '../audio.js?v=6';
import { addText } from '../ui.js?v=6';
import { attachAtmosphere, fadeIn } from '../fx.js?v=6';
import { endRun, leave, showHud } from '../flow.js?v=6';
import {
  applyDeltas,
  eventLookup,
  maybeGaryVisit,
  pickEvent,
  resolveChoice,
  resolveDanger,
  rollLoot,
} from '../logic.js?v=6';
import { showDanger, showNotice } from './cards.js?v=6';

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
    if (this.textures.exists('bg-mainstreet')) {
      const image = this.add.image(640, 360, 'bg-mainstreet').setDepth(0);
      const scale = Math.max(CONFIG.WIDTH / (image.width || CONFIG.WIDTH), CONFIG.HEIGHT / (image.height || CONFIG.HEIGHT));
      image.setScale(scale);
      image.setAlpha(0.78);
    }
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
          this.present();
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

  present() {
    const event = this.event;
    if (!event) {
      this.finish('The spot had nothing to say. You still went.');
      return;
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
    this.faceFind(event);
  }

  faceFind(event) {
    showNotice(this, {
      kicker: this.marker.name.toUpperCase(),
      title: 'SEARCH',
      body: event.text,
      button: 'SEARCH',
      onClose: () => {
        const state = Game.state;
        const deltas = rollLoot(event.bias, phaseForDay(state.day));
        if (event.grantRumor) deltas.rumor = event.grantRumor;
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
    showDanger(this, {
      face: event.face || 'Trouble',
      text: event.text,
      onPick: (action) => {
        const outcome = resolveDanger(action, Game.state, event.bias);
        this.commit(outcome.text, outcome.deltas);
      },
    });
  }

  commit(text, deltas) {
    const state = Game.state;
    const trip = this.trip;
    if (trip.applied) {
      this.finish(trip.resultText || text);
      return;
    }
    const gained = applyDeltas(state, deltas);
    if (gained) Audio.loot();
    trip.applied = true;
    trip.resultText = gained ? `${text}\n\n${gained}` : text;
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
  if (grant.loot) Object.assign(deltas, rollLoot(grant.bias, phaseForDay(state.day)));
  ['food', 'water', 'materials', 'medicine', 'health', 'morale'].forEach((key) => {
    if (grant[key]) deltas[key] = (deltas[key] || 0) + grant[key];
  });
  if (grant.weapon) deltas.weapon = grant.weapon;
  if (grant.rumor) deltas.rumor = grant.rumor;
  return deltas;
}
