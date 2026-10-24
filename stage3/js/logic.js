import { CONFIG, countdownPhrase, daysLeft, phaseForDay, phaseInfo } from './config.js?v=6';
import { EVENTS, eventById } from './data/events.js?v=6';
import { markerById, phaseProfile } from './data/map.js?v=6';
import { NIGHT_EVENTS } from './data/night.js?v=6';
import { phaseCopy } from './data/phases.js?v=6';
import {
  BEER_LINES,
  COAT_BRAGS,
  GREETINGS,
  JOKES,
  MARKET_LINES,
  MEMORIAL_SIGNOFFS,
  NEIGHBOR_LINES,
  PANCAKE_LINES,
  ROCKET_NEWS,
  SIGNOFFS,
  SPONSOR_LINES,
  TOWN_LINES,
  rumorById,
} from './data/radio.js?v=6';
import {
  hatchById,
  SURVIVAL_COLD,
  survivalDeck,
  survivalOpener,
} from './data/survival.js?v=6';
import {
  applyCold,
  applyCrewNight,
  applyStash,
  canOffer,
  dangerAdjust,
  forcedNightId,
  isActive,
  locationGoods,
  loseNeighbor,
  addNotice,
  maybeBarricadeLoss,
  memorialEntries,
  noteEmptyStores,
  recruited,
  resolveSurge,
  settleCrew,
  stampMorning,
  tickRoads,
  tripExtras,
  wearingCoat,
} from './crew.js?v=6';
import { maybeJulyBox, morningRadio, resolveSputter } from './trade.js?v=6';
import { heistMorning } from './heist.js?v=6';
import { apocalypseName, apocalypseOf, recordMorningRumor, rememberRumor } from './rumors.js?v=6';
import {
  changeStat,
  nightlyUpkeep,
  roomLevel,
  syncDerived,
  touchState,
} from './state.js?v=6';

const STAT_KEYS = ['food', 'water', 'materials', 'medicine', 'health', 'morale'];
const STAT_LABELS = {
  food: 'Food',
  water: 'Water',
  materials: 'Planks',
  medicine: 'Medicine',
  health: 'Health',
  morale: 'Morale',
};

export const EARLY_END_LINE = 'You are out of health. The calendar is not. Biscuit is fine. He still has the bandana and a better plan.';

function specForRoom(roomId, apoc) {
  const row = CONFIG.APOC_COUNTERS?.[roomId];
  if (!row) return null;
  return row[apoc] || row.all || null;
}

function addMods(mods, spec, level) {
  if (!spec || !level) return false;
  mods.threat += (spec.threat || 0) * level;
  mods.fight += (spec.fight || 0) * level;
  mods.hide += (spec.hide || 0) * level;
  mods.bargain += (spec.bargain || 0) * level;
  mods.run += (spec.run || 0) * level;
  mods.score += (spec.ready || 1) * level;
  return true;
}

/** Room bonuses for the secret apocalypse. Generator has no robots row. */
export function apocMods(state) {
  const apoc = apocalypseOf(state);
  const mods = { threat: 0, fight: 0, hide: 0, bargain: 0, run: 0, score: 0, rooms: 0 };
  Object.keys(CONFIG.ROOMS || {}).forEach((id) => {
    const level = roomLevel(state, id);
    if (!level) return;
    if (addMods(mods, specForRoom(id, apoc), level)) mods.rooms += 1;
  });
  const depth = (state?.slots || []).filter((slot) => slot.row === 1 && slot.room && slot.level > 0).length;
  if (depth) addMods(mods, specForRoom('depth', apoc), depth);
  return mods;
}

/** Collapse night line. Does not name the apocalypse. */
export function readinessLine(state) {
  const score = apocMods(state).score;
  if (score >= 8) return 'How ready are we? The hole feels like it was built on purpose.';
  if (score >= 4) return 'How ready are we? The hole is a hole. That is not nothing.';
  if (score >= 1) return 'How ready are we? We have a start. The start is a hole.';
  return 'How ready are we? The hole has feelings. They are mixed.';
}

export function fillLine(text, state) {
  const left = daysLeft(state.day);
  const daysPhrase = left <= 0 ? 'Today' : left === 1 ? 'One day' : `${left} days`;
  return String(text)
    .replaceAll('{daysPhrase}', daysPhrase)
    .replaceAll('{days}', String(left))
    .replaceAll('{day}', String(state.day))
    .replaceAll('{name}', state.name || CONFIG.DEFAULT_NAME)
    .replaceAll('{SPONSOR}', CONFIG.RADIO_JINGLE_SPONSOR || "Big Lou's Lumber");
}

/** Calm stays clean. Panic drops a word. Collapse and the last day cut the sentence off. */
export function degradeLine(text, phase) {
  if (!text || phase === 'calm') return text;
  const words = text.split(/\s+/).filter(Boolean);
  if (phase === 'panic') {
    if (words.length < 8) return text;
    words[3] = '—';
    return words.join(' ');
  }
  const kept = words.filter((_, index) => index % 7 !== 6);
  const sliced = kept.slice(0, Math.max(6, kept.length - 3));
  return `${sliced.join(' ')}—`;
}

function phaseAllows(item, phase) {
  if (item.calmOnly && (phase === 'collapse' || phase === 'end')) return false;
  if (Array.isArray(item.phases)) {
    const key = phase === 'end' ? 'collapse' : phase;
    if (!item.phases.includes(phase) && !item.phases.includes(key)) return false;
  }
  return true;
}

function pickOne(list) {
  if (!list?.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function weightedPick(list, phase) {
  if (!list.length) return null;
  const weightOf = (item) => item.weightByPhase?.[phase] || item.weight || 1;
  const total = list.reduce((sum, item) => sum + weightOf(item), 0);
  let roll = Math.random() * total;
  for (const item of list) {
    roll -= weightOf(item);
    if (roll <= 0) return item;
  }
  return list[list.length - 1];
}

export { rememberRumor };

export function ensureMorning(state) {
  syncDerived(state);
  tickRoads(state);
  const fresh = state.flags.scriptDay !== state.day;
  if (fresh) state.flags.biscuitHiding = '';
  if (!fresh && state.flags.script) return state.flags.script;
  const batteryLine = morningRadio(state);
  const phase = phaseForDay(state.day);
  const greetings = GREETINGS[phase] || GREETINGS.collapse;
  const greeting = fillLine(pickOne(greetings), state);
  const rumor = recordMorningRumor(state);
  const jokes = JOKES.filter((joke) => phaseAllows(joke, phase));
  const joke = (pickOne(jokes.length ? jokes : JOKES)).text;
  const heard = [greeting, rumor?.text || '', joke].filter((line) => line).map((line) => degradeLine(line, phase));
  const stamp = stampMorning(state);
  if (stamp) heard.push(degradeLine(stamp, phase));
  const copy = phaseCopy(state.day);
  if (copy?.radio) heard.push(degradeLine(copy.radio, phase));
  if (batteryLine) heard.push(degradeLine(batteryLine, phase));
  const searchPending = state.flags.heistSearchNote || '';
  const heistLine = heistMorning(state);
  if (heistLine) {
    const exact = !!(searchPending && heistLine === searchPending);
    heard.push(exact ? heistLine : degradeLine(heistLine, phase));
  }
  if (state.flags.coatRadio) {
    heard.push(degradeLine('You found the Mackinaw. The town noticed. Try not to let that go to the wool.', phase));
    heard.push(degradeLine(COAT_BRAGS[3], phase));
    state.flags.coatRadio = false;
  }
  if (Math.random() < 0.55) {
    const sponsor = pickOne(SPONSOR_LINES);
    if (sponsor) heard.push(degradeLine(fillLine(`{{JINGLE}} ${sponsor}`, state), phase));
  }
  if (phase === 'panic' || phase === 'collapse') {
    const market = state.flags.marketLine || pickOne(MARKET_LINES);
    if (market) heard.push(degradeLine(fillLine(market, state), phase));
    state.flags.marketLine = '';
  } else if (state.flags.marketLine) {
    heard.push(degradeLine(fillLine(state.flags.marketLine, state), phase));
    state.flags.marketLine = '';
  }
  if (state.day >= 6 && !state.flags.churchRadio) {
    state.flags.churchRadio = true;
    heard.push(degradeLine(TOWN_LINES[3], phase));
  }
  if (state.flags.swapRadio) {
    heard.push(degradeLine(MARKET_LINES[1], phase));
    state.flags.swapRadio = false;
    state.flags.swapHeard = true;
  }
  if (state.flags.rocketRadio) {
    heard.push(degradeLine(pickOne(ROCKET_NEWS), phase));
    state.flags.rocketRadio = false;
    state.flags.rocketHeard = true;
  }
  if (state.flags.radioFried) {
    heard.push(degradeLine('The morning broadcast is mostly static and a few words. A surge did that.', phase));
    state.flags.radioFried = false;
  }
  if (Math.random() < 0.4) heard.push(degradeLine(fillLine(pickOne(TOWN_LINES), state), phase));
  if (Math.random() < 0.28) heard.push(degradeLine(pickOne(PANCAKE_LINES), phase));
  if (Math.random() < 0.22) heard.push(degradeLine(pickOne(BEER_LINES), phase));
  if (Math.random() < 0.3) heard.push(degradeLine(pickOne(COAT_BRAGS.slice(0, 3)), phase));
  if (recruited(state).length && Math.random() < 0.35) {
    heard.push(degradeLine(pickOne(NEIGHBOR_LINES), phase));
  }
  if (state.flags.wallNote) {
    heard.unshift(state.flags.wallNote);
    state.flags.wallNote = '';
  }
  const script = { phase, lines: heard };
  state.flags.scriptDay = state.day;
  state.flags.script = script;
  state.lastBroadcast = heard.slice();
  return script;
}

export function pickSignoff(state) {
  const phase = phaseForDay(state.day);
  const names = memorialEntries(state).map((entry) => entry.name).filter(Boolean);
  if (names.length) {
    const line = pickOne(MEMORIAL_SIGNOFFS) || MEMORIAL_SIGNOFFS[0];
    return degradeLine(fillLine(line.replaceAll('{NAMES}', names.join('. ')), state), phase);
  }
  if ((phase === 'calm' || phase === 'panic') && Math.random() < 0.6) return SIGNOFFS[0];
  return degradeLine(fillLine(pickOne(SIGNOFFS) || SIGNOFFS[0], state), phase);
}

export function rollLoot(bias, phase, state) {
  const info = phaseInfo(phase === 'end' ? 'collapse' : phase);
  const min = info.lootMin ?? 1;
  const max = Math.max(min, info.lootMax ?? min);
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const bag = bias?.length ? bias : ['materials'];
  const deltas = {};
  for (let i = 0; i < count; i += 1) {
    let key = bag[i % bag.length];
    if (!STAT_KEYS.includes(key) || key === 'health' || key === 'morale') key = 'materials';
    deltas[key] = (deltas[key] || 0) + 1;
  }
  if (!Object.keys(deltas).length) deltas.materials = Math.max(1, min);
  if (state?.flags?.trip?.location) {
    const marker = markerById(state.flags.trip.location);
    const extra = locationGoods(state, marker);
    Object.entries(extra).forEach(([key, value]) => {
      if (key === 'stash' && value && typeof value === 'object') {
        deltas.stash = deltas.stash || {};
        Object.entries(value).forEach(([stashKey, count]) => {
          deltas.stash[stashKey] = (deltas.stash[stashKey] || 0) + count;
        });
        return;
      }
      if (typeof value === 'number') deltas[key] = (deltas[key] || 0) + value;
    });
    const trip = tripExtras(state);
    if (trip.loot > 0) {
      const bonusKey = bag.find((key) => STAT_KEYS.includes(key) && key !== 'health' && key !== 'morale') || 'materials';
      deltas[bonusKey] = (deltas[bonusKey] || 0) + trip.loot;
    }
    if (trip.line) state.flags.alongLine = trip.line;
    const boost = state.flags.lootBoost?.[state.flags.trip.location] || 0;
    if (boost > 0) {
      deltas.materials = (deltas.materials || 0) + boost;
      state.flags.lootBoost[state.flags.trip.location] = 0;
      state.flags.boostLine = 'Kevin was right. The shelf was full.';
    }
    if (wearingCoat(state) && Math.random() < (CONFIG.ITEMS.mackinawLoot || 0)) {
      deltas.materials = (deltas.materials || 0) + 1;
      state.flags.coatLootLine = 'The Mackinaw pockets one more thing. Wool has gravity.';
    }
  }
  if (state && (state.stats?.morale || 0) >= CONFIG.MORALE_RULES.highAt && Math.random() < CONFIG.MORALE_RULES.bonusLoot) {
    deltas.food = (deltas.food || 0) + 1;
    state.flags.moraleLootLine = "Morale is high. Nobody knows why. Don't ask.";
  }
  const haul = (deltas.food || 0) + (deltas.water || 0) + (deltas.materials || 0);
  if (state && haul >= 4) state.flags.bigHaul = true;
  return deltas;
}

export function grantWeapon(state, id) {
  const weapon = CONFIG.WEAPONS[id];
  if (!weapon || weapon.later) return null;
  if (!state.ownedWeapons.includes(id)) state.ownedWeapons.push(id);
  const current = CONFIG.WEAPONS[state.weapon] || CONFIG.WEAPONS.bare_hands;
  if ((weapon.fight || 0) >= (current.fight || 0)) {
    state.weapon = id;
    return `You equip the ${weapon.name}. ${weapon.blurb}`;
  }
  return `You stash the ${weapon.name}. ${current.name} stays in your hands.`;
}

export function applyDeltas(state, deltas) {
  if (!deltas) return '';
  const parts = [];
  STAT_KEYS.forEach((key) => {
    if (!deltas[key]) return;
    const got = changeStat(key, deltas[key]);
    if (!got) return;
    const shown = Math.abs(got - Math.round(got)) > 0.05 ? got.toFixed(1) : String(Math.round(got));
    parts.push(`${STAT_LABELS[key]} ${got > 0 ? '+' : ''}${shown}`);
  });
  if (deltas.weapon) {
    const note = grantWeapon(state, deltas.weapon);
    if (note) parts.push(note);
  }
  if (deltas.rumor) {
    const rumor = typeof deltas.rumor === 'string' ? rumorById(deltas.rumor) : deltas.rumor;
    if (rumor) {
      rememberRumor(state, rumor);
      parts.push('You write it in the notebook.');
    }
  }
  if (deltas.stash) parts.push(...applyStash(state, deltas.stash));
  touchState();
  return parts.join('  ');
}

export function oddsWord(chance) {
  if (chance < 0.22) return 'Bad idea';
  if (chance < 0.4) return 'Long shot';
  if (chance < 0.56) return 'Coin flip';
  if (chance < 0.72) return 'Decent';
  if (chance < 0.86) return 'Good odds';
  return 'Great odds';
}

export function actionChance(action, state) {
  const weapon = CONFIG.WEAPONS[state.weapon] || CONFIG.WEAPONS.bare_hands;
  if (state.mode === 'survival') {
    const tune = CONFIG.SURVIVAL;
    const day = Math.max(1, state.survivalDay || 1);
    const mods = apocMods(state);
    const threat = tune.zombieStart + (day - 1) * tune.zombiePerDay;
    const base = { fight: 0.82, hide: 0.84, bargain: 0.52, run: 0.96 }[action] ?? 0.5;
    let chance = base - threat + (weapon[action] || 0) + mods.threat + (mods[action] || 0);
    const boards = roomLevel(state, 'barricade');
    const brace = state.flags?.brace || 0;
    const hiding = state.flags?.biscuitHiding === `s${day}`;
    if (action === 'fight') chance += boards * tune.barricadeFight + brace * 0.04;
    if (action === 'hide') chance += boards * tune.barricadeHide + brace * 0.04 + (hiding ? 0 : tune.biscuitHide);
    if (action === 'run' && !hiding) chance += tune.biscuitRun;
    if (action === 'bargain') {
      const rich = state.stats.food >= 1 || state.stats.materials >= 1 || state.stats.medicine >= 1;
      chance += rich ? 0.2 : -0.16;
    }
    if (state.stats.health <= 3 && (action === 'fight' || action === 'run')) chance -= 0.08;
    const apoc = apocalypseOf(state);
    const manual = weapon.id === 'snow_shovel' || weapon.id === 'hockey_stick'
      || weapon.id === 'skillet' || weapon.id === 'studded_2x4';
    if (apoc === 'robots' && action === 'fight' && manual) chance += 0.08;
    if (apoc === 'bigmoon' && wearingCoat(state) && (action === 'hide' || action === 'run')) chance += 0.05;
    chance += dangerAdjust(state, action, 'survival');
    return Math.max(0.06, Math.min(0.93, chance));
  }
  const danger = phaseInfo(state.day).danger || 0;
  const base = { fight: 0.5, hide: 0.56, bargain: 0.42, run: 0.84 }[action] ?? 0.4;
  let chance = base - danger * 0.35 + (weapon[action] || 0);
  const boards = roomLevel(state, 'barricade');
  if (action === 'fight') chance += boards * 0.03;
  if (action === 'hide') chance += boards * 0.05;
  if (action === 'bargain') {
    const rich = state.stats.food >= 1 || state.stats.materials >= 1 || state.stats.medicine >= 1;
    chance += rich ? 0.16 : -0.12;
  }
  if (state.stats.health <= 3 && (action === 'fight' || action === 'run')) chance -= 0.08;
  const where = state.flags?.dangerWhere || 'trip';
  chance += dangerAdjust(state, action, where);
  return Math.max(0.08, Math.min(0.93, chance));
}

export function resolveDanger(action, state, bias) {
  const phase = phaseForDay(state.day);
  const chance = actionChance(action, state);
  const ok = Math.random() < chance;
  const deltas = {};
  let text = '';
  if (action === 'fight' && ok) {
    Object.assign(deltas, rollLoot(bias, phase));
    deltas.morale = (deltas.morale || 0) + 1;
    text = 'You bonk the problem out of frame. It stumbles off, offended, and keeps walking.';
  } else if (action === 'fight') {
    deltas.health = -2;
    deltas.morale = -1;
    text = 'You swing. The swing is mostly theory. You keep your teeth and lose a little pride.';
  } else if (action === 'hide' && ok) {
    deltas.materials = 1;
    text = 'You hold still. The moment gets bored and leaves.';
  } else if (action === 'hide') {
    deltas.health = -1;
    text = 'You are found immediately. It is embarrassing and slightly painful. Nothing dramatic.';
  } else if (action === 'bargain' && ok) {
    Object.assign(deltas, rollLoot(bias, phase));
    if (state.stats.food >= 1) deltas.food = (deltas.food || 0) - 1;
    else if (state.stats.materials >= 1) deltas.materials = (deltas.materials || 0) - 1;
    else if (state.stats.medicine >= 1) deltas.medicine = (deltas.medicine || 0) - 1;
    text = 'You make a deal. Nobody is proud. Everybody walks away.';
  } else if (action === 'bargain') {
    deltas.morale = -1;
    if (state.stats.food >= 1) deltas.food = -1;
    else if (state.stats.materials >= 1) deltas.materials = -1;
    text = 'The negotiation was a shrug. You leave poorer in groceries or in spirit.';
  } else if (action === 'run' && ok) {
    text = 'You leave. It is undignified and correct.';
  } else {
    deltas.health = -1;
    if (state.stats.food > 0) deltas.food = -1;
    else if (state.stats.materials > 0) deltas.materials = -1;
    text = 'You run. A can hops out of the bag and chooses a new life without you.';
  }
  return { ok, chance, text, deltas };
}

function riskFails(risk) {
  if (risk === 'Very risky') return Math.random() < 0.55;
  if (risk === 'Risky') return Math.random() < 0.35;
  return false;
}

export function resolveChoice(choice, event, state) {
  const phase = phaseForDay(state.day);
  const failed = riskFails(choice.risk);
  const pack = failed ? choice.fail : choice.success;
  if (!pack) return { text: 'Nothing happens. You respect it.', deltas: {} };
  const deltas = {};
  if (pack.loot) Object.assign(deltas, rollLoot(pack.bias || event.bias, phase, state));
  STAT_KEYS.forEach((key) => {
    if (pack[key]) deltas[key] = (deltas[key] || 0) + pack[key];
  });
  if (pack.weapon) deltas.weapon = pack.weapon;
  if (pack.rumor) deltas.rumor = pack.rumor;
  if (pack.flag) state.flags[pack.flag] = true;
  return { text: pack.text || 'You do the thing.', deltas };
}

export function pickEvent(state, locationId) {
  const phase = phaseForDay(state.day);
  let pool = EVENTS.filter((event) => event.location === locationId && phaseAllows(event, phase));
  pool = pool.filter((event) => event.kind !== 'recruit' || canOffer(state, event.neighbor));
  if (!pool.length) pool = EVENTS.filter((event) => event.location === locationId && event.kind !== 'recruit');
  const arc = phaseProfile(markerById(locationId), phase);
  if (arc?.crowd) {
    pool = pool.map((event) => (event.crowd ? { ...event, weight: (event.weightByPhase?.[phase] || event.weight || 1) * 3, weightByPhase: null } : event));
  }
  if (!pool.length) {
    return {
      id: `${locationId}-shelf`,
      location: locationId,
      kind: 'find',
      text: 'The place is quiet. You still check the usual shelf.',
      bias: ['materials', 'food'],
    };
  }
  const unseen = pool.filter((event) => !state.seenEvents.includes(event.id));
  const picked = weightedPick(unseen.length ? unseen : pool, phase);
  if (picked?.id && !state.seenEvents.includes(picked.id)) state.seenEvents.push(picked.id);
  return picked;
}

export function eventLookup(id) {
  return eventById(id);
}

export function maybeGaryVisit(state) {
  if (!state || state.garyVisited) return null;
  if (state.day < 8 || state.day > 14) return null;
  if (!state.flags.garyDay) {
    const sum = [...(state.name || 'N')].reduce((total, char) => total + char.charCodeAt(0), 0);
    const hashed = 8 + (sum % 7);
    state.flags.garyDay = state.day > hashed ? state.day : hashed;
    if (state.flags.garyDay > 14) state.flags.garyDay = state.day <= 14 ? state.day : 14;
  }
  if (state.day !== state.flags.garyDay) return null;
  state.garyVisited = true;
  changeStat('food', 2);
  changeStat('water', 2);
  touchState();
  return {
    who: 'Gary',
    portrait: 'portrait-gary',
    line: "Water first. Then food. Then everything else. You're doing it backwards.",
    bonus: 'He leaves two cans and two jugs on the step. He does not stay.',
  };
}

export function memorialCopy(state) {
  const entries = memorialEntries(state);
  if (!entries.length) return 'Nobody yet. Keep it that way.';
  return entries.map((entry) => `${entry.name} — Day ${entry.day} — ${entry.epitaph}`).join('\n\n');
}

function nightEligible(state, event, phase) {
  if (!event) return false;
  if (!phaseAllows(event, phase)) return false;
  if (event.fromDay && (state.day || 1) < event.fromDay) return false;
  if (event.apoc && event.apoc !== apocalypseOf(state)) return false;
  const needs = event.needs;
  if (!needs) return true;
  if (needs.minCrew && recruited(state).length < needs.minCrew) return false;
  if (needs.neighbor && !isActive(state, needs.neighbor)) return false;
  if (needs.room && roomLevel(state, needs.room) < 1) return false;
  if (needs.unrecruited && !['larry', 'kowalski', 'dale', 'tina', 'kevin'].some((id) => canOffer(state, id))) return false;
  return true;
}

function pickNight(state) {
  if (state.flags?.forceNight) {
    const named = NIGHT_EVENTS.find((event) => event.id === state.flags.forceNight);
    state.flags.forceNight = '';
    if (named) return named;
  }
  const forced = forcedNightId(state);
  if (forced) {
    const named = NIGHT_EVENTS.find((event) => event.id === forced);
    if (named && nightEligible(state, named, phaseForDay(state.day))) return named;
  }
  const phase = phaseForDay(state.day);
  let pool = NIGHT_EVENTS.filter((event) => nightEligible(state, event, phase));
  if (roomLevel(state, 'rec') >= 1) {
    pool = pool.map((event) => (event.id === 'argument' ? { ...event, weight: Math.max(1, (event.weight || 1) * CONFIG.MORALE_RULES.recArgumentMul) } : event));
  }
  if (pool.length) return weightedPick(pool, phase);
  const generic = NIGHT_EVENTS.filter((event) => !event.apoc && phaseAllows(event, phase));
  return weightedPick(generic.length ? generic : NIGHT_EVENTS.filter((event) => !event.apoc), phase);
}

function applyNightEvent(state, event, lines, earlyLine = '') {
  if (!event) return null;
  if (event.kind === 'choice') {
    return { prompt: { id: event.id, title: 'TONIGHT', text: event.text, options: event.options || [] } };
  }
  if (event.kind === 'danger' || event.kind === 'alarm') {
    lines.push(event.text);
    if (event.kind === 'alarm') {
      const roll = Math.random();
      if (roll < 0.34) {
        return { danger: { face: 'A raccoon at the alarm', text: 'The alarm was a raccoon. The raccoon is offended and still here.', bias: ['food'], id: 'larry-alarm', raccoon: true } };
      }
      if (roll < 0.67) {
        state.flags.hideBonus = true;
        return { danger: { face: 'A looter at the hatch', text: 'The alarm was a person. Hiding is the smart sentence. Larry already said it.', bias: ['materials'], id: 'looter', hideBonus: true } };
      }
      lines.push('The alarm was the wind, or a raccoon that already left. Larry writes it down anyway.');
      return {};
    }
    return {
      danger: {
        face: event.face,
        text: event.text,
        bias: event.bias || ['materials'],
        id: event.id,
        crowd: !!event.crowd,
        raccoon: !!event.raccoon,
        zombie: !!event.zombie,
      },
    };
  }
  lines.push(event.text);
  if (event.kind === 'cold' || event.cold) applyCold(state, lines);
  else if (event.id === 'surge') lines.push(resolveSurge(state));
  else if (event.id === 'sputter') lines.push(earlyLine || 'The generator takes the night under advisement.');
  else if (event.kind === 'food') {
    const got = changeStat('food', event.food || 2);
    if (got) lines.push(`Food +${got}.`);
  } else if (event.kind === 'morale') {
    const got = changeStat('morale', event.morale || 1);
    if (got) lines.push(`Morale +${got}.`);
  } else if (event.kind === 'hoa') {
    if (Math.random() < 0.5) {
      const got = changeStat('morale', 1);
      lines.push(got ? 'The meeting adjourns in favor of morale. +1.' : 'The meeting adjourns. The mood was already full.');
    } else {
      const filed = addNotice(state, 'optimism');
      lines.push(`Dale files one more notice on the way out of the meeting. ${filed?.rule || ''}`);
    }
  } else if (event.kind === 'heal') {
    const got = changeStat('health', 1);
    recruited(state).forEach((row) => {
      const body = state.crew[row.id];
      if (!body || body.laidUp > 0) return;
      body.health = Math.min(CONFIG.CREW.healthMax, (body.health || 0) + 1);
    });
    lines.push(got ? 'Tina patches you up. Health +1. She does not make a speech.' : 'Tina checks the room. Everybody who can be patched, is.');
  } else if (event.kind === 'pancake') {
    if ((state.stats.food || 0) > 10) {
      changeStat('morale', 1);
      lines.push('You have food enough to admit the pancakes smell good. Morale +1.');
    }
  } else if (event.kind === 'biscuit') {
    const keys = ['gas', 'snacks', 'battery', 'tinfoil', 'coffee', 'beer'];
    const key = keys[Math.floor(Math.random() * keys.length)];
    state.stash[key] = Math.min(99, (state.stash[key] || 0) + 1);
    const names = { gas: 'a gas can', snacks: 'a snack cake', battery: 'a battery', tinfoil: 'a roll of tinfoil', coffee: 'coffee', beer: 'a silver can' };
    lines.push(`Biscuit has acquired ${names[key]}. Biscuit will not explain.`);
  } else if (event.kind === 'recruit') {
    const pool = ['larry', 'kowalski', 'dale', 'tina', 'kevin'].filter((id) => canOffer(state, id));
    if (pool.length) return { recruit: pool[Math.floor(Math.random() * pool.length)] };
  } else if (event.kind === 'trade') {
    return { trade: true };
  } else if (event.deltas) {
    applyDeltas(state, event.deltas);
  }
  return {};
}

export function buildNightReport(state) {
  if (state.flags.upkeepDay === state.day && state.flags.nightReport) return state.flags.nightReport;
  const up = nightlyUpkeep(state);
  const foodBefore = state.stats.food;
  const waterBefore = state.stats.water;
  const biscuitCans = up.biscuitCans || 0;
  state.biscuitBank = up.biscuitBank;
  const foodDelta = changeStat('food', -up.food);
  const waterDelta = changeStat('water', -up.water);
  if (up.healthLoss) changeStat('health', -up.healthLoss);
  const lines = [countdownPhrase(state.day)];
  lines.push(foodBefore <= 0
    ? 'The pantry files a complaint. You eat a memory of beans.'
    : `You eat. Food ${foodDelta}.`);
  lines.push(waterBefore <= 0
    ? 'The jug is a souvenir. You drink a thought and call it hydration.'
    : `Water ${waterDelta}.`);
  lines.push(biscuitCans
    ? "Biscuit eats a whole can. Last night's half finally counted. He is fine."
    : 'Biscuit eats half a can. The rest stays on the books. He is fine.');
  if (up.healthLoss) {
    lines.push(foodBefore <= 0 && waterBefore <= 0
      ? 'Empty on both counts. Your health takes the hint.'
      : 'Running on empty has a fee. Health drops.');
  }
  if (up.mouths) lines.push(`${up.mouths} neighbor${up.mouths === 1 ? '' : 's'} ate. The shelf noticed.`);
  noteEmptyStores(state, foodBefore, waterBefore, lines);
  const event = pickNight(state);
  const earlyLine = event?.id === 'sputter' ? resolveSputter(state) : '';
  applyCrewNight(state, lines);
  const outcome = applyNightEvent(state, event, lines, earlyLine) || {};
  let extra = null;
  const phaseNow = phaseForDay(state.day);
  if (phaseNow === 'collapse') lines.push(readinessLine(state));
  if (phaseNow === 'collapse' && Math.random() < 0.4) {
    const second = NIGHT_EVENTS.filter((item) => item.id !== event?.id && !item.kind && nightEligible(state, item, phaseNow));
    extra = second.length ? weightedPick(second, phaseNow) : null;
    if (extra?.text) lines.push(extra.text);
  }
  const danger = outcome.danger || null;
  if (state.flags?.freshLoss) outcome.loss = state.flags.freshLoss;
  const report = {
    lines,
    signoff: pickSignoff(state),
    danger,
    dangerResolved: !danger,
    dangerResult: '',
    prompt: outcome.prompt || null,
    promptResolved: false,
    recruit: outcome.recruit || null,
    trade: !!outcome.trade,
    loss: outcome.loss || null,
    snow: state.flags?.snowNight === (state.mode === 'survival' ? `s${state.survivalDay || 1}` : state.day),
    down: state.stats.health <= 0,
  };
  state.flags.upkeepDay = state.day;
  state.flags.nightReport = report;
  touchState();
  return report;
}

export function survivalDown(state) {
  if (!state) return '';
  if (state.stats.food <= 0) return 'food';
  if (state.stats.water <= 0) return 'water';
  if (state.stats.health <= 0) return 'health';
  if (state.stats.morale <= 0) return 'morale';
  return '';
}

export function downLine(reason) {
  if (reason === 'food') return 'The shelf is a shelf. The food is a memory.';
  if (reason === 'water') return 'The jug is empty. So is the plan.';
  if (reason === 'health') return 'You are out of health. Biscuit is fine. He still has the bandana and the better plan.';
  if (reason === 'morale') return 'You sit down on purpose. The bunker will keep. You will not.';
  return 'That is the run.';
}

function markDown(state, sheet) {
  const reason = survivalDown(state);
  sheet.down = reason;
  const line = reason ? downLine(reason) : '';
  if (line && !sheet.lines.includes(line)) sheet.lines.push(line);
  state.flags.downReason = reason;
  return reason;
}

function pickZombie(state) {
  const deck = survivalDeck(apocalypseOf(state));
  const seen = state.flags.seenZombies || [];
  const fresh = deck.filter((item) => !seen.includes(item.id));
  const pool = fresh.length ? fresh : deck;
  const event = pool[Math.floor(Math.random() * pool.length)];
  state.flags.seenZombies = [...seen, event.id].slice(-12);
  return event;
}

/** One survival morning. Idempotent for the current bunker day, so a reload does not eat twice. */
export function beginSurvivalDay(state) {
  state.flags = state.flags || {};
  const day = state.survivalDay || 1;
  if (state.flags.survival?.day === day) return state.flags.survival;
  state.flags.biscuitHiding = '';
  const up = nightlyUpkeep(state);
  const foodBefore = state.stats.food;
  const waterBefore = state.stats.water;
  const biscuitCans = up.biscuitCans || 0;
  state.biscuitBank = up.biscuitBank;
  changeStat('food', -up.food);
  changeStat('water', -up.water);
  if (up.healthLoss) changeStat('health', -up.healthLoss);
  const kind = apocalypseOf(state);
  const lines = [survivalOpener(kind, day, CONFIG.SURVIVAL_DAYS)];
  lines.push(foodBefore <= 0 ? 'No food. You eat a memory of beans.' : 'You eat from the shelf.');
  lines.push(waterBefore <= 0 ? 'No water. You drink a thought and call it hydration.' : 'You drink. It tastes like a hose. Correct.');
  lines.push(biscuitCans
    ? 'Biscuit eats a whole can. Last half finally counted. He is fine.'
    : 'Biscuit eats half a can. He is fine.');
  if (up.healthLoss) lines.push('Empty stores charge your health. You remain in one piece.');
  if (up.mouths) lines.push(`${up.mouths} neighbor${up.mouths === 1 ? '' : 's'} ate. Biscuit still does not share.`);
  noteEmptyStores(state, foodBefore, waterBefore, lines);
  const coldOdds = SURVIVAL_COLD[kind] ?? 0.22;
  if (Math.random() < coldOdds) applyCold(state, lines);
  applyCrewNight(state, lines);
  settleCrew(state).forEach((line) => lines.push(line));
  const event = pickZombie(state);
  const sheet = {
    day,
    lines,
    zombieId: event.id,
    zombieDone: false,
    actionDone: false,
    down: '',
  };
  state.flags.survival = sheet;
  markDown(state, sheet);
  touchState();
  return sheet;
}

export function resolveZombie(action, state) {
  const sheet = state.flags?.survival;
  if (!sheet || sheet.zombieDone) return sheet;
  const event = hatchById(sheet.zombieId, apocalypseOf(state));
  const weapon = CONFIG.WEAPONS[state.weapon] || CONFIG.WEAPONS.bare_hands;
  const ok = Math.random() < actionChance(action, state);
  const deltas = {};
  let text = '';
  if (action === 'fight' && ok) {
    deltas.morale = 1;
    text = weapon.id === 'bare_hands'
      ? 'You bonk the problem with your actual hands. It stumbles off, offended, and keeps walking.'
      : `The ${weapon.name.toLowerCase()} makes the argument. It leaves, still walking, less convinced.`;
  } else if (action === 'fight') {
    deltas.health = -2;
    deltas.morale = -1;
    text = 'You swing. The swing is mostly theory. You stay in one unfashionable piece and lose a little pride.';
  } else if (action === 'hide' && ok) {
    text = 'You hold still. Biscuit holds still. The moment gets bored and leaves. He is fine.';
  } else if (action === 'hide') {
    deltas.health = -1;
    deltas.morale = -1;
    text = 'It bumps the hatch. You bump back with a shoulder. Biscuit stays behind you, unharmed, and judging.';
  } else if (action === 'bargain' && ok) {
    if (state.stats.food >= 1) deltas.food = -1;
    else if (state.stats.materials >= 1) deltas.materials = -1;
    deltas.morale = 1;
    text = event.bargain || 'You offer a casserole through the crack. It accepts the dish and goes looking for a fork.';
  } else if (action === 'bargain') {
    deltas.morale = -1;
    if (state.stats.food >= 1) deltas.food = -1;
    text = 'You describe a casserole in detail. It is not moved by fiction. You lose the afternoon, and maybe the dish.';
  } else if (action === 'run' && ok) {
    text = 'You and Biscuit take the side room. He is fine. You are less fine, but present.';
  } else {
    deltas.health = -1;
    if (state.stats.food > 0) deltas.food = -1;
    else if (state.stats.materials > 0) deltas.materials = -1;
    text = 'You run into your own shelf. A can chooses a new life on the floor. Biscuit watches. He is fine.';
  }
  const note = applyDeltas(state, deltas);
  if ((deltas.health || 0) < 0) {
    const lost = maybeBarricadeLoss(state);
    if (lost) text = `${text}\n\n${lost}`;
  }
  sheet.zombieDone = true;
  sheet.lines.push(text);
  if (note) sheet.lines.push(note);
  markDown(state, sheet);
  touchState();
  return sheet;
}

function finishAction(state, text) {
  const sheet = state.flags.survival;
  const note = text.note || '';
  sheet.actionDone = true;
  sheet.lines.push(text.line);
  if (note) sheet.lines.push(note);
  markDown(state, sheet);
  touchState();
  return sheet;
}

export function survivalRepair(state) {
  const sheet = state.flags?.survival;
  if (!sheet || sheet.actionDone) return sheet;
  const boards = roomLevel(state, 'barricade');
  const mats = state.stats.materials;
  let line = 'No planks left. You lean on the hatch and explain the situation. Biscuit supervises. He is fine.';
  if (mats >= 2) {
    changeStat('materials', -2);
    state.flags.brace = Math.min(4, (state.flags.brace || 0) + 1);
    line = boards
      ? 'You nail the loose board back onto the barricade. The hatch sounds more like a door.'
      : 'There is no barricade room. You nail a chair to the hatch anyway. It counts. Barely.';
  } else if (mats >= 1) {
    changeStat('materials', -1);
    state.flags.brace = Math.min(4, (state.flags.brace || 0) + 1);
    line = 'One plank. You use it like a personality. The hatch agrees to try.';
  }
  return finishAction(state, { line });
}

export function survivalRation(state) {
  const sheet = state.flags?.survival;
  if (!sheet || sheet.actionDone) return sheet;
  const got = changeStat('food', 1);
  if (state.stats.morale > 1) changeStat('morale', -1);
  const line = got
    ? 'You put a can back and eat a grudge. Biscuit already had his half. He is fine.'
    : 'The shelf refuses another can. You ration the idea. It is not filling. Biscuit is fine.';
  return finishAction(state, { line });
}

export function survivalGarage(state) {
  const sheet = state.flags?.survival;
  if (!sheet || sheet.actionDone) return sheet;
  const roll = Math.random();
  const deltas = {};
  let line = 'The garage offers a rake and a judgmental silence.';
  if (roll < 0.34) {
    deltas.food = 1;
    line = 'A can behind the paint. You take it. The paint stays. It has tenure.';
  } else if (roll < 0.62) {
    deltas.water = 1;
    line = 'A jug in the wheelbarrow. You do not ask the wheelbarrow any questions.';
  } else if (roll < 0.84) {
    deltas.materials = 1;
    line = 'One honest plank. You take it before it gets ideas.';
  } else if (roll < 0.95) {
    deltas.medicine = 1;
    line = 'A bandage tin. You pocket it and do not narrate why.';
  }
  const apoc = apocalypseOf(state);
  const garageRisk = 0.1 + (state.survivalDay || 1) * 0.025
    + (apoc === 'solarflare' && roomLevel(state, 'faraday') < 1 ? 0.16 : 0)
    + (apoc === 'meteor' ? 0.08 : 0);
  if (Math.random() < garageRisk) {
    deltas.health = (deltas.health || 0) - 1;
    if (apoc === 'solarflare') line += ' Daylight bites. You come back cooked on one side.';
    else if (apoc === 'meteor') line += ' Dust and a leftover boom. You leave with what you grabbed.';
    else if (apoc === 'robots') line += ' Something with a plug takes an interest in the rake. You leave anyway.';
    else if (apoc === 'bigmoon') line += ' The moon sits on the garage like a landlord. You take the can and the hint.';
    else line += ' Something shuffles past the door. You leave with what you grabbed and a new respect for rakes.';
  }
  if (isActive(state, 'kevin')) {
    deltas.materials = (deltas.materials || 0) + 1;
    line += ' Kevin went up to the garage and came back with one more thing. He filmed the rake.';
  }
  const july = maybeJulyBox(state);
  if (july) line += ` ${july}`;
  line += ' Biscuit stayed downstairs. He is fine.';
  const note = applyDeltas(state, deltas);
  return finishAction(state, { line, note });
}

export function buildScore(state) {
  if (state.flags?.scorecard) return state.flags.scorecard;
  state.flags = state.flags || {};
  const win = state.ending === 'win';
  let days;
  if (state.ending === 'early' || (state.mode !== 'survival' && !win)) {
    days = Math.max(1, state.day || 1);
  } else if (win) {
    days = CONFIG.PREP_DAYS + CONFIG.SURVIVAL_DAYS;
  } else {
    days = CONFIG.PREP_DAYS + Math.max(0, (state.survivalDay || 1) - 1);
  }
  const food = Math.max(0, Math.round(state.stats.food));
  const rooms = (state.slots || []).filter((slot) => slot.room && slot.level > 0).length;
  const weapon = CONFIG.WEAPONS[state.weapon] || CONFIG.WEAPONS.bare_hands;
  const guessed = typeof state.flags.barricadeReady === 'boolean'
    ? state.flags.barricadeReady
    : roomLevel(state, 'barricade') >= 1;
  const guess = typeof state.guess === 'string' ? state.guess : '';
  const guessRight = !!guess && guess === apocalypseOf(state);
  const guessBonus = guessRight ? (CONFIG.SCORE_GUESS_BONUS || 0) : 0;
  const neighbors = recruited(state).length;
  const trades = state.flags.trades || 0;
  const rockets = state.flags.rocketsFired || 0;
  const notices = state.flags.noticesEver || state.violations || 0;
  const memory = memorialEntries(state).map((entry) => entry.name);
  const points = Math.min(days, 40)
    + Math.min(food, 24)
    + rooms * 8
    + neighbors * 12
    + Math.min(trades, 12)
    + Math.min(rockets, 8)
    + Math.round((weapon.fight || 0) * 40)
    + (guessed ? 24 : 0)
    + guessBonus
    + (win ? 20 : 0);
  let rank = 'Raccoon Food';
  if (points >= 100) rank = 'Certified Prepper';
  else if (rockets >= 3) rank = 'Fireworks Enthusiast, Unlicensed';
  else if (trades >= 3) rank = 'Swap Meet Legend';
  else if (neighbors >= 3) rank = 'Block Captain';
  else if (points >= 70) rank = 'Basement Optimist';
  else if (points >= 40) rank = 'Canned Good Enthusiast';
  const card = {
    days,
    food,
    rooms,
    roomLabel: `${rooms} / 8`,
    neighbors,
    trades,
    rockets,
    notices,
    memory: memory.length ? memory.join(', ') : 'Nobody. Keep it that way.',
    weapon: weapon.name,
    guessed,
    guess,
    guessName: guess ? apocalypseName(guess) : '',
    guessRight,
    guessBonus,
    rank,
    points,
    win,
  };
  state.flags.scorecard = card;
  return card;
}

export function staticLevel(phase, state) {
  let level = 0.015;
  if (phase === 'panic') level = 0.05;
  else if (phase === 'collapse') level = 0.09;
  else if (phase === 'end') level = 0.14;
  const faraday = state ? roomLevel(state, 'faraday') : 0;
  if ((phase === 'collapse' || phase === 'end') && faraday >= 2) level *= faraday >= 3 ? 0.45 : 0.7;
  if (state?.flags?.staticBoost && faraday < 1) level += 0.04 * Math.min(3, state.flags.staticBoost);
  if (state?.flags?.radioClear) level = Math.min(level, 0.015);
  if (state?.flags?.radioFried) level = Math.min(0.2, level + 0.08);
  return level;
}

export { countdownPhrase, phaseForDay, phaseInfo, roomLevel };
