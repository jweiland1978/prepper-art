/**
 * The Bait & Brew job. Offered from NightSummary. Not a map event.
 * globalThis.__PREPPER_HEIST: open, openRun2, force, forceTrap, forceDougie,
 * forceSearch, larry, state.
 */
import { CONFIG } from './config.js?v=6';
import { Game, changeStat, touchState } from './state.js?v=6';
import { Save } from './save.js?v=6';
import { addButton, addPanel, addText } from './ui.js?v=6';

const BOARDS = [
  { name: 'The dock', creaky: false },
  { name: 'The gangway', creaky: false },
  { name: 'The third board', creaky: true },
  { name: 'The cooler', creaky: false },
];

const BRAGS = [
  'I have forty cans of Pine Lake Light in the cooler at the Bait & Brew. I count them every night. Sometimes twice.',
  'The Bait & Brew cooler hums like it has a job. It does. The job is beer. I am the supervisor.',
  'Pine Lake Light. Silver can. I own the cooler and the count. The count is the only thing in town that still balances.',
  'Someone asked what I would save in a fire. I said the cooler. They thought I was joking. I was not done counting.',
  'Forty cans. I said forty. If you heard thirty-nine, that was the radio, not the cooler.',
];

const OFF = [
  'I counted the cooler twice. I got two numbers. I am going to sit with that.',
  'The Bait & Brew cooler is light a few cans. I have not decided if I noticed. I noticed.',
  'If you are drinking Pine Lake Light tonight, I hope you paid for it. I also hope I am bad at math. I am not bad at math.',
];

const TAUNTS = [
  '{{NAME}} was at the Bait & Brew. I did not say that. The cans said it. They are poor liars.',
  'Second trip, {{NAME}}. The cooler keeps a guest book. The name is in there twice, and the count is not.',
  '{{NAME}}, if you are listening: the dock remembers feet. I remember names. Pine Lake Light remembers nothing, which is why this town trusts it more than you.',
  'Two runs, {{NAME}}. The sheriff has a flashlight. I have a microphone. We are not the same department. The cans do not care which of us you disappoint.',
];

const LOOT_WORDS = {
  snacks: ['snack', 'snacks'],
  coffee: ['coffee', 'coffee'],
  cigarettes: ['cigarette', 'cigarettes'],
  tp: ['t.p.', 't.p.'],
  gas: ['gas', 'gas'],
  ammo: ['ammo', 'ammo'],
  tinfoil: ['tinfoil', 'tinfoil'],
  battery: ['battery', 'batteries'],
};

const CALM_GOODS = [
  ['snacks', 'snacks'],
  ['coffee', 'coffee'],
  ['cigarettes', 'cigarettes'],
  ['tp', 't.p.'],
  ['gas', 'gas'],
];

function roll(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function playerName(state) {
  const name = String(state?.name || '').trim();
  return name || 'Neighbor';
}

function tauntLine(line, state) {
  return String(line || '').replaceAll('{{NAME}}', playerName(state));
}

function haulFor(prior) {
  const table = CONFIG.HEIST.haul || [6, 12];
  return table[Math.min(Math.max(0, prior), table.length - 1)] || table[0] || 6;
}

function beerReady(state, hand) {
  return (state?.stash?.beer || 0) + (hand?.n || 0);
}

function spendCans(state, hand, cost) {
  state.stash = state.stash || {};
  let left = Math.max(0, cost || 0);
  const fromStash = Math.min(state.stash.beer || 0, left);
  state.stash.beer = (state.stash.beer || 0) - fromStash;
  left -= fromStash;
  const fromHand = Math.min(hand?.n || 0, left);
  if (hand) hand.n = (hand.n || 0) - fromHand;
  left -= fromHand;
  return left === 0;
}

function takeSearchBeer(state) {
  const pct = CONFIG.HEIST.searchBeerPct || [50, 70];
  const have = state.stash?.beer || 0;
  if (have <= 0) return 0;
  const rate = roll(pct[0], pct[1]);
  const take = Math.min(have, Math.ceil((have * rate) / 100));
  state.stash.beer = have - take;
  return take;
}

function takeSearchLoot(state) {
  const rules = CONFIG.HEIST;
  if (Math.random() >= (rules.searchLootChance ?? 0.5)) return '';
  const keys = Object.keys(LOOT_WORDS).filter((id) => (state.stash?.[id] || 0) > 0);
  if (!keys.length) return '';
  const id = keys[Math.floor(Math.random() * keys.length)];
  const n = Math.min(rules.searchLootMax || 1, state.stash[id]);
  if (n <= 0) return '';
  state.stash[id] -= n;
  const word = n === 1 ? LOOT_WORDS[id][0] : LOOT_WORDS[id][1];
  return `${n} ${word}`;
}

function applySearch(state, run2, caughtHit) {
  const rules = CONFIG.HEIST;
  const force = !!state.flags.heistForceSearch;
  if (!force && !run2) return '';
  if (!force && Math.random() >= (rules.searchChance ?? 0.88)) return '';
  state.flags.heistForceSearch = false;
  state.flags.heistSearched = Math.min(4, (state.flags.heistSearched || 0) + 1);
  state.stash = state.stash || {};
  const beer = takeSearchBeer(state);
  const loot = takeSearchLoot(state);
  const hit = changeStat('morale', rules.searchMorale ?? -3);
  const respect = rules.searchRespect ?? 4;
  const taken = loot ? `${beer} Pine Lake Light and ${loot}` : `${beer} Pine Lake Light`;
  const moraleBit = hit ? `morale ${hit}` : 'morale already on the floor';
  const dock = caughtHit ? `morale ${caughtHit}` : 'the dock hit';
  return `The sheriff searched the place. Taken: ${taken}. Search reputation: ${moraleBit}, respect -${respect}. That sits on top of the dock hit (${dock}).`;
}

export function heistEligible(state, opts = {}) {
  if (!state || state.mode === 'survival') return false;
  if (opts.dev) return true;
  if ((state.day || 1) < CONFIG.HEIST.fromDay) return false;
  if ((state.flags?.heistsDone || 0) >= CONFIG.HEIST.max) return false;
  const last = state.flags?.lastHeistDay || 0;
  if (last && (state.day - last) < CONFIG.HEIST.cooldown) return false;
  return true;
}

/** One unused host line, or ''. Search counts go first. Run-2 taunts beat the old brags. */
export function heistMorning(state) {
  if (!state) return '';
  state.flags = state.flags || {};
  if (state.flags.heistSearchNote) {
    const line = state.flags.heistSearchNote;
    state.flags.heistSearchNote = '';
    return line;
  }
  const done = state.flags.heistsDone || 0;
  if (done >= 2) {
    const at = state.flags.heistTauntsHeard || 0;
    if (at < TAUNTS.length) {
      state.flags.heistTauntsHeard = at + 1;
      return tauntLine(TAUNTS[at], state);
    }
    return '';
  }
  const offAt = state.flags.heistOffHeard || 0;
  if (done >= 1 && offAt < OFF.length) {
    const line = OFF[offAt];
    state.flags.heistOffHeard = offAt + 1;
    return line;
  }
  const bragAt = state.flags.heistBragsHeard || 0;
  if (bragAt < BRAGS.length && (state.day || 1) >= 2) {
    const line = BRAGS[bragAt];
    state.flags.heistBragsHeard = bragAt + 1;
    return line;
  }
  return '';
}

function hostScene(scene) {
  if (scene?.add) return scene;
  const list = globalThis.__PREPPER_GAME?.scene?.getScenes?.(true) || [];
  return list.find((item) => item.scene?.key !== 'HUD') || list[0] || null;
}

function addQuietButton(scene, x, y, label, subtitle, opts = {}) {
  const w = opts.w || 280;
  const h = opts.h || 72;
  const g = scene.add.graphics();
  g.fillStyle(0x141820, 0.5);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 7);
  g.lineStyle(2, 0x5c5346, 0.4);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 7);
  const text = addText(scene, 0, subtitle ? -11 : 0, label, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: opts.fontSize || '18px',
    color: CONFIG.COLORS.textMuted,
    originX: 0.5,
    originY: 0.5,
  });
  const parts = [g, text];
  if (subtitle) {
    parts.push(addText(scene, 0, 16, subtitle, {
      fontFamily: CONFIG.FONTS.body,
      fontSize: '14px',
      color: CONFIG.COLORS.textMuted,
      originX: 0.5,
      originY: 0.5,
    }));
  }
  const root = scene.add.container(x, y, parts);
  root.setAlpha(0.55);
  return root;
}

function payHeist(state, caught, hauled) {
  const prior = state.flags.heistsDone || 0;
  const run2 = prior >= 1;
  const rules = CONFIG.HEIST;
  const haul = Number.isFinite(hauled) ? Math.max(0, hauled) : haulFor(prior);
  state.stash = state.stash || {};
  state.stash.beer = Math.min(99, (state.stash.beer || 0) + haul);
  state.flags.heistsDone = Math.min(rules.max, prior + 1);
  state.flags.lastHeistDay = state.day || 1;
  let line = `The cooler pays ${haul} Pine Lake Light. Biscuit was home the whole time.`;
  if (caught) {
    state.flags.heistCaught = true;
    state.flags.heistCaughtRun = Math.max(state.flags.heistCaughtRun || 0, run2 ? 2 : 1);
    const mood = run2 ? (rules.caughtMoraleRun2 ?? -2) : (rules.caughtMorale ?? -1);
    const hit = changeStat('morale', mood);
    line = `The sheriff is on the dock by morning. The beer still came home. ${haul} cans.${hit ? ` Morale ${hit}.` : ''} Biscuit stayed home.`;
    const search = applySearch(state, run2, hit);
    if (search) {
      state.flags.heistSearchNote = search;
      line = `${line} ${search}`;
    }
  }
  touchState();
  Save.write(state);
  return line;
}

/** Dock-to-cooler minigame. Resolves with the result line, or '' if it could not open. */
export function openHeist(scene, opts = {}) {
  const host = hostScene(scene);
  const state = Game.state;
  if (!host || !state) return Promise.resolve('');
  state.flags = state.flags || {};
  state.stash = state.stash || {};
  if (opts.dev) state.flags.lastHeistDay = 0;
  const prior = state.flags.heistsDone || 0;
  const alert = prior >= 1;
  const rules = CONFIG.HEIST;
  const hand = { n: 0, got: false };
  let index = 0;
  let noise = alert ? (rules.alertStart ?? 50) : 0;
  let note = 'Biscuit stays home. The bandana does not do docks.';
  let finished = false;
  let dougieDone = false;
  let dougieAt = -1;
  if (state.flags.heistForceDougie) {
    state.flags.heistForceDougie = false;
    dougieAt = roll(0, BOARDS.length);
  } else if (Math.random() < (rules.dougieChance ?? 0.4)) {
    dougieAt = roll(0, BOARDS.length);
  }
  let trap = false;
  if (state.flags.heistForceTrap) {
    state.flags.heistForceTrap = false;
    trap = true;
  } else if (alert && Math.random() < (rules.trapChance ?? 0.5)) {
    trap = true;
  }

  return new Promise((resolve) => {
    const prevLock = Game.hudLock;
    Game.hudLock = true;
    const root = host.add.container(0, 0).setDepth(78);
    const blocker = host.add.rectangle(640, 360, 1280, 720, 0x000000, 0.72).setInteractive();
    root.add(blocker);
    root.add(addPanel(host, 140, 70, 1000, 580));
    const title = addText(host, 640, 100, 'THE BAIT & BREW JOB', {
      fontFamily: CONFIG.FONTS.display, fontSize: '40px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
    });
    const body = addText(host, 640, 158, '', {
      fontFamily: CONFIG.FONTS.body, fontSize: '20px', color: CONFIG.COLORS.text,
      originX: 0.5, originY: 0, align: 'center', wordWrap: { width: 860 },
    });
    const hint = addText(host, 640, 418, '', {
      fontFamily: CONFIG.FONTS.radio, fontSize: '16px', color: CONFIG.COLORS.textMuted,
      originX: 0.5, originY: 0, align: 'center', wordWrap: { width: 880 },
    });
    const meterLabel = addText(host, 200, 348, 'NOISE', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '16px', color: CONFIG.COLORS.orangeCss, originX: 0, originY: 0.5,
    });
    const meter = host.add.graphics();
    root.add([title, body, hint, meterLabel, meter]);
    let controls = host.add.container(0, 0);
    root.add(controls);

    const close = (line) => {
      if (root.active) root.destroy();
      Game.hudLock = prevLock;
      resolve(line || '');
    };

    const drawMeter = () => {
      meter.clear();
      meter.fillStyle(0x1a120c, 1);
      meter.fillRoundedRect(200, 368, 880, 28, 6);
      const frac = Math.max(0, Math.min(1, noise / 100));
      const color = frac >= 0.8 ? 0xc4452d : frac >= 0.5 ? 0xe39b2b : 0x6fbf4a;
      meter.fillStyle(color, 1);
      if (frac > 0) meter.fillRoundedRect(200, 368, Math.max(8, 880 * frac), 28, 6);
      meter.lineStyle(2, 0xf4efe4, 0.7);
      meter.strokeRoundedRect(200, 368, 880, 28, 6);
    };

    const hintText = () => {
      const cord = trap ? ' A new orange extension cord runs along the doorframe.' : '';
      return `The third board has opinions.${cord}`;
    };

    const arrive = () => {
      if (hand.got) return;
      hand.got = true;
      hand.n = haulFor(state.flags.heistsDone || 0);
    };

    const endCard = (caught) => {
      if (finished) return;
      finished = true;
      const line = payHeist(state, caught, hand.got ? hand.n : undefined);
      controls.removeAll(true);
      body.setText(line);
      hint.setText(caught ? 'Caught. The run continues. The dock does not.' : 'You made the cooler. Try to look like a customer.');
      drawMeter();
      controls.add(addButton(host, 640, 560, 'BACK TO THE NIGHT', () => close(line), { w: 360, h: 64, primary: true }));
    };

    const paint = () => {
      const board = BOARDS[index];
      const left = BOARDS.length - index;
      const listening = alert ? ' The town is already listening. One wrong step and you are caught.' : '';
      body.setText(`${board.name}${board.creaky ? ' — CREAKY' : ''}.\n\n${note}\n\n${left} board${left === 1 ? '' : 's'} to the cooler. Noise ${Math.round(noise)}.${listening}`);
      hint.setText(hintText());
      drawMeter();
      controls.removeAll(true);
      if (trap) {
        controls.add(addButton(host, 300, 545, 'CAREFUL', () => take(false), {
          w: 230, h: 64, fontSize: '20px', subtitle: 'Less noise',
        }));
        controls.add(addButton(host, 640, 545, 'BACK DOOR', () => takeDoor(), {
          w: 270, h: 64, fontSize: '20px', primary: true, subtitle: 'Unlocked. Looks easy',
        }));
        controls.add(addButton(host, 980, 545, 'FAST', () => take(true), {
          w: 230, h: 64, fontSize: '20px', subtitle: alert ? 'Louder. No room for it' : 'Louder. Might skip one',
        }));
      } else {
        controls.add(addButton(host, 420, 530, 'CAREFUL', () => take(false), {
          w: 300, h: 72, subtitle: 'Less noise',
        }));
        controls.add(addButton(host, 860, 530, 'FAST', () => take(true), {
          w: 300, h: 72, primary: true, subtitle: alert ? 'Louder. No room for it' : 'Louder. Might skip one',
        }));
      }
    };

    const showDougie = () => {
      if (finished || dougieDone) return;
      dougieDone = true;
      const cost = rules.bribeCost ?? 1;
      body.setText('Dougie from the boat launch is on the dock. It is 2 AM. He is holding a conversation with a piling, and he might look up.');
      hint.setText(hintText());
      drawMeter();
      controls.removeAll(true);
      const settle = (line) => {
        body.setText(line);
        controls.removeAll(true);
        controls.add(addButton(host, 640, 530, 'CONTINUE', () => proceed(), { w: 300, h: 64, primary: true }));
      };
      controls.add(addButton(host, 300, 545, 'FREEZE', () => {
        const spotted = Math.random() < (rules.dougieFreezeRisk ?? 0.55);
        if (spotted) noise = Math.min(100, noise + (rules.dougieFreezeNoise ?? 18));
        drawMeter();
        settle(spotted
          ? 'You freeze. Dougie squints at the shape. "That you?" The dock gets louder.'
          : 'You freeze. Dougie studies a piling, loses the argument, and wanders off.');
      }, { w: 230, h: 64, fontSize: '18px', subtitle: 'He might look' }));
      controls.add(addButton(host, 640, 545, 'WAIT IT OUT', () => {
        const spotted = Math.random() < (rules.dougieWaitRisk ?? 0.35);
        if (spotted) noise = Math.min(100, noise + (rules.dougieWaitNoise ?? 12));
        drawMeter();
        settle(spotted
          ? 'You wait. Dougie waits longer, then waves at the shape he thinks is a gull. It is you.'
          : 'You wait it out. Dougie gets bored of standing and leaves toward the water.');
      }, { w: 240, h: 64, fontSize: '16px', subtitle: 'He might leave' }));
      if (beerReady(state, hand) >= cost) {
        controls.add(addButton(host, 980, 545, 'BRIBE WITH A CAN', () => {
          if (!spendCans(state, hand, cost)) return;
          if (rules.bribeWorks !== false) noise = Math.min(100, noise + (rules.bribeNoise || 0));
          else noise = Math.min(100, noise + (rules.dougieWaitNoise ?? 12));
          drawMeter();
          settle(`Dougie accepts the can like a sacrament. "I didn't see nothing. I never see nothing." He wanders off toward the water.`);
        }, { w: 260, h: 64, fontSize: '15px', primary: true, subtitle: `${cost} can. No noise. He leaves` }));
      } else {
        controls.add(addQuietButton(host, 980, 545, 'BRIBE WITH A CAN', 'No can on you', { w: 260, h: 64, fontSize: '15px' }));
      }
    };

    // Build Dougie's buttons after the tap that summoned him has finished.
    const later = (fn) => {
      if (host.time?.delayedCall) host.time.delayedCall(30, () => { if (root.active) fn(); });
      else window.setTimeout(() => { if (root.active) fn(); }, 30);
    };

    const proceed = () => {
      if (finished) return;
      if (noise >= 100) {
        endCard(true);
        return;
      }
      if (index >= BOARDS.length) {
        arrive();
        if (dougieAt === BOARDS.length && !dougieDone) later(showDougie);
        else endCard(false);
        return;
      }
      if (dougieAt === index && !dougieDone) later(showDougie);
      else paint();
    };

    const takeDoor = () => {
      if (finished) return;
      noise = Math.min(100, noise + (rules.trapFill ?? 100));
      note = 'The motion light trips. Someone left the back door hungry.';
      if (noise >= 100) endCard(true);
      else proceed();
    };

    const take = (fast) => {
      if (finished) return;
      const board = BOARDS[index];
      if (alert && rules.run2CatchFast !== false && fast) {
        noise = 100;
        note = 'One wrong step. The town was already listening.';
        endCard(true);
        return;
      }
      const span = fast ? rules.fast : rules.careful;
      let hit = roll(span[0], span[1]);
      if (board.creaky) hit += rules.creaky || 0;
      const mul = alert ? (rules.alertMul ?? 1) : 1;
      hit = Math.max(1, Math.round(hit * mul));
      noise = Math.min(100, noise + hit);
      if (noise >= 100) {
        note = 'Too much board. The dock keeps the complaint.';
        endCard(true);
        return;
      }
      if (fast && index < BOARDS.length - 1 && Math.random() < (rules.skip ?? 0.45)) {
        index += 2;
        note = 'You hurry and skip a board. The skipped one stays quiet out of spite.';
      } else {
        index += 1;
        note = board.creaky
          ? 'That board had opinions. You heard every one.'
          : (fast ? 'Fast. The lake heard it too.' : 'Careful. The dock only suspected you.');
      }
      proceed();
    };

    hint.setText(hintText());
    drawMeter();
    proceed();
  });
}

/** Night offer. Declining is free and does not start the cooldown. */
export function offerHeist(scene) {
  const state = Game.state;
  if (!scene || !heistEligible(state)) return Promise.resolve('');
  if (state.flags?.heistAsked === state.day) return Promise.resolve('');
  state.flags = state.flags || {};
  state.flags.heistAsked = state.day;
  Save.write(state);
  const second = (state.flags.heistsDone || 0) >= 1;
  const pitch = second
    ? 'The town is already listening. The cooler pays double, and one wrong step gets you caught. Careful is the quiet way. Fast is the wrong one. Biscuit stays home. He has the bandana and the better judgment.'
    : 'The cooler on Pine Lake is four boards from the dock. Careful is quieter. Fast is ruder, and sometimes shorter. Biscuit stays home. He has the bandana and the better judgment.';
  return new Promise((resolve) => {
    const root = scene.add.container(0, 0).setDepth(72);
    const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.62).setInteractive();
    root.add(blocker);
    root.add(addPanel(scene, 150, 140, 980, 440));
    root.add(addText(scene, 640, 190, 'THE BAIT & BREW JOB', {
      fontFamily: CONFIG.FONTS.display, fontSize: '40px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
    }));
    root.add(addText(scene, 640, 250, pitch, {
      fontFamily: CONFIG.FONTS.body, fontSize: '20px', color: CONFIG.COLORS.text,
      originX: 0.5, originY: 0, align: 'center', wordWrap: { width: 860 },
    }));
    const close = (line) => {
      if (root.active) root.destroy();
      resolve(line || '');
    };
    root.add(addButton(scene, 460, 500, 'NOT TONIGHT', () => close(''), { w: 280, h: 64 }));
    root.add(addButton(scene, 820, 500, 'TAKE THE JOB', () => {
      if (root.active) root.destroy();
      openHeist(scene).then((line) => resolve(line || ''));
    }, { w: 300, h: 64, primary: true }));
  });
}

export function calmOffer(state) {
  if (!state) return null;
  const beerCost = CONFIG.HEIST.larryCalmBeer || 1;
  if ((state.stash?.beer || 0) >= beerCost) {
    return { kind: 'beer', n: beerCost, label: `${beerCost} Pine Lake Light` };
  }
  for (const [id, word] of CALM_GOODS) {
    if ((state.stash?.[id] || 0) >= 1) return { kind: id, n: 1, label: `1 ${word}` };
  }
  if ((state.stats?.materials || 0) >= 1) return { kind: 'materials', n: 1, label: '1 materials' };
  return null;
}

function payCalm(state, offer) {
  if (!offer) return false;
  if (offer.kind === 'materials') return changeStat('materials', -offer.n) !== 0;
  state.stash = state.stash || {};
  const have = state.stash[offer.kind] || 0;
  if (have < offer.n) return false;
  state.stash[offer.kind] = have - offer.n;
  return true;
}

function finishLarry(state, calm) {
  const already = !!state.flags.heistCaught;
  let line;
  if (calm) {
    const offer = calmOffer(state);
    if (!payCalm(state, offer)) return 'The payment is gone. Larry is still holding the theory.';
    line = `You hand over ${offer.label}. Larry takes it like a fee for silence. He nods. The nod is the whole receipt.`;
  } else if (!already) {
    state.flags.heistCaught = true;
    state.flags.heistCaughtRun = Math.max(state.flags.heistCaughtRun || 0, 1);
    const hit = changeStat('morale', CONFIG.HEIST.larryRideMorale ?? -1);
    const morale = hit ? ` Morale ${hit}.` : '';
    line = `You let him talk. By dark the sheriff walks the dock with a flashlight and a count, and the tables creep their prices.${morale}`;
  } else {
    state.flags.heistHeat = Math.min(4, (state.flags.heistHeat || 0) + 1);
    const hit = changeStat('morale', CONFIG.HEIST.larryRideMorale ?? -1);
    const morale = hit ? ` Morale ${hit}.` : '';
    line = `You let him talk. The dock already had a sheriff. The tables add another bump, and the story gets longer.${morale}`;
  }
  touchState();
  Save.write(state);
  return line;
}

export function larryPanicDue(state) {
  if (!state || state.mode === 'survival') return false;
  const done = state.flags?.heistsDone || 0;
  if (done < 1) return false;
  return (state.flags.heistLarrySeen || 0) < done;
}

/** Larry at Rusty's. force ignores the once-per-heist latch. */
export function presentLarryPanic(scene, opts = {}) {
  const host = hostScene(scene);
  const state = Game.state;
  if (!host || !state) return Promise.resolve('');
  if (!opts.force && !larryPanicDue(state)) return Promise.resolve('');
  state.flags = state.flags || {};
  const done = state.flags.heistsDone || 0;
  if (done > 0) state.flags.heistLarrySeen = Math.max(state.flags.heistLarrySeen || 0, done);
  return new Promise((resolve) => {
    const prevLock = Game.hudLock;
    Game.hudLock = true;
    const root = host.add.container(0, 0).setDepth(opts.depth || 74);
    const blocker = host.add.rectangle(640, 360, 1280, 720, 0x000000, 0.72).setInteractive();
    root.add(blocker);
    root.add(addPanel(host, 150, 120, 980, 480));
    root.add(addText(host, 640, 168, 'LARRY', {
      fontFamily: CONFIG.FONTS.display, fontSize: '40px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
    }));
    const body = addText(host, 640, 220, `Larry is at the edge of Rusty's with a silver can and a theory. The theory is that the can used to live at the Bait & Brew, and that you have been there. He is about to tell this to anyone who will stand still.`, {
      fontFamily: CONFIG.FONTS.body, fontSize: '20px', color: CONFIG.COLORS.text,
      originX: 0.5, originY: 0, align: 'center', wordWrap: { width: 860 },
    });
    root.add(body);
    const controls = host.add.container(0, 0);
    root.add(controls);
    const close = (line) => {
      if (root.active) root.destroy();
      Game.hudLock = prevLock;
      resolve(line || '');
    };
    const showChoice = () => {
      controls.removeAll(true);
      const offer = calmOffer(state);
      if (offer) {
        controls.add(addButton(host, 420, 520, 'CALM HIM DOWN', () => {
          body.setText(finishLarry(state, true));
          controls.removeAll(true);
          controls.add(addButton(host, 640, 530, `BACK TO RUSTY'S`, () => close(body.text), { w: 340, h: 64, primary: true }));
        }, { w: 320, h: 72, subtitle: `Costs ${offer.label}` }));
      } else {
        controls.add(addQuietButton(host, 420, 520, 'CALM HIM DOWN', 'Nothing to offer', { w: 320, h: 72 }));
      }
      controls.add(addButton(host, 860, 520, 'LET IT RIDE', () => {
        body.setText(finishLarry(state, false));
        controls.removeAll(true);
        controls.add(addButton(host, 640, 530, `BACK TO RUSTY'S`, () => close(body.text), { w: 340, h: 64, primary: true }));
      }, { w: 320, h: 72, primary: true, subtitle: 'He keeps talking' }));
    };
    showChoice();
  });
}

export function forceHeistRun2(state = Game.state) {
  if (!state) return;
  state.flags = state.flags || {};
  if ((state.flags.heistsDone || 0) < 1) state.flags.heistsDone = 1;
  touchState();
  Save.write(state);
}

const FORCE_FLAGS = {
  trap: 'heistForceTrap',
  dougie: 'heistForceDougie',
  search: 'heistForceSearch',
};

export function armHeist(which) {
  const key = FORCE_FLAGS[which];
  const state = Game.state;
  if (!state || !key) return;
  state.flags = state.flags || {};
  state.flags[key] = true;
  touchState();
  Save.write(state);
}

function readHeistState() {
  const flags = Game.state?.flags || {};
  const rules = CONFIG.HEIST;
  return {
    name: Game.state?.name || '',
    beer: Game.state?.stash?.beer || 0,
    heistsDone: flags.heistsDone || 0,
    lastHeistDay: flags.lastHeistDay || 0,
    heistCaught: !!flags.heistCaught,
    heistCaughtRun: flags.heistCaughtRun || 0,
    heistSearched: flags.heistSearched || 0,
    heistHeat: flags.heistHeat || 0,
    heistLarrySeen: flags.heistLarrySeen || 0,
    forceTrap: !!flags.heistForceTrap,
    forceDougie: !!flags.heistForceDougie,
    forceSearch: !!flags.heistForceSearch,
    searchNote: flags.heistSearchNote || '',
    tauntsHeard: flags.heistTauntsHeard || 0,
    eligible: heistEligible(Game.state),
    run2: (flags.heistsDone || 0) >= 1,
    alertStart: rules.alertStart,
    haul: rules.haul,
    searchChance: rules.searchChance,
    searchBeerPct: rules.searchBeerPct,
    trapChance: rules.trapChance,
    dougieChance: rules.dougieChance,
    bribeCost: rules.bribeCost,
    bribeWorks: rules.bribeWorks,
    bribeNoise: rules.bribeNoise,
  };
}

globalThis.__PREPPER_HEIST = {
  open(scene) {
    return openHeist(scene, { dev: true });
  },
  openRun2(scene) {
    forceHeistRun2(Game.state);
    return openHeist(scene, { dev: true });
  },
  force(opts = {}) {
    const state = Game.state;
    if (!state) return readHeistState();
    state.flags = state.flags || {};
    if (opts.trap) state.flags.heistForceTrap = true;
    if (opts.dougie) state.flags.heistForceDougie = true;
    if (opts.search) state.flags.heistForceSearch = true;
    if (opts.run2 && (state.flags.heistsDone || 0) < 1) state.flags.heistsDone = 1;
    touchState();
    Save.write(state);
    return readHeistState();
  },
  forceTrap() {
    armHeist('trap');
    return readHeistState();
  },
  forceDougie() {
    armHeist('dougie');
    return readHeistState();
  },
  forceSearch() {
    armHeist('search');
    return readHeistState();
  },
  larry(scene) {
    return presentLarryPanic(scene, { force: true });
  },
  state: readHeistState,
};
