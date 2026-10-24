/**
 * Neighbors, morale wording, cots, phase spots, and the hooks Parts 2 and 3 call.
 * Does not import scenes or logic. Logic may import this.
 */
import { CONFIG, phaseForDay, phaseInfo } from './config.js?v=6';
import { MARKERS, markerById, phaseProfile } from './data/map.js?v=6';
import { neighborById, NEIGHBORS } from './data/neighbors.js?v=6';
import { LARRY_STAMP_LINES } from './data/radio.js?v=6';
import { apocalypseOf, maybeStampEntry } from './rumors.js?v=6';
import { NOTICE_FORMS } from './data/traders.js?v=6';
import { changeStat, roomLevel, touchState } from './state.js?v=6';

export const STASH_KEYS = ['tinfoil', 'battery', 'coffee', 'snacks', 'rockets', 'coat', 'gas', 'cigarettes', 'ammo', 'tp', 'beer'];

const STASH_LABELS = {
  tinfoil: 'Tinfoil',
  battery: 'Battery',
  coffee: 'Coffee',
  snacks: 'Snacks',
  rockets: 'Rockets',
  coat: 'The Mackinaw',
  gas: 'Gas',
  cigarettes: 'Cigarettes',
  ammo: 'Ammo',
  tp: 'Toilet paper',
  beer: 'Pine Lake Light',
};

export function stashLabel(key) {
  return STASH_LABELS[key] || key;
}

export function emptyCrew() {
  return {};
}

export function moraleWord(value) {
  const n = Math.max(0, Math.min(10, Math.round(value || 0)));
  const row = CONFIG.MORALE_RULES.words.find((item) => n >= item.at);
  return row?.label || 'Staring at the wall';
}

export function recruited(state) {
  if (!state?.crew) return [];
  return NEIGHBORS.filter((row) => state.crew[row.id]);
}

export function person(state, id) {
  return state?.crew?.[id] || null;
}

export function isHere(state, id) {
  return !!person(state, id);
}

export function isActive(state, id) {
  const row = person(state, id);
  return !!(row && !(row.laidUp > 0));
}

export function cotCount(state) {
  return (state?.slots || []).filter((slot) => slot.room && slot.level > 0).length;
}

export function materialCost(state, base) {
  let cost = base;
  if (isActive(state, 'dale')) {
    cost -= CONFIG.CREW.daleDiscount;
    if (person(state, 'dale')?.job === 'work') cost -= CONFIG.CREW.daleWorkExtra;
  }
  return Math.max(1, cost);
}

export function jobOf(state, id) {
  const row = person(state, id);
  if (!row || row.laidUp > 0) return 'rest';
  return row.job || 'rest';
}

export function setJob(state, id, job) {
  const row = person(state, id);
  if (!row || row.laidUp > 0) return false;
  const allowed = ['rest', 'guard', 'work', 'along'];
  if (!allowed.includes(job)) return false;
  if (job === 'along') {
    recruited(state).forEach((other) => {
      if (other.id !== id && state.crew[other.id]?.job === 'along') state.crew[other.id].job = 'rest';
    });
  }
  row.job = job;
  return true;
}

export function alongNeighbor(state) {
  return recruited(state).find((row) => jobOf(state, row.id) === 'along') || null;
}

function phaseKey(state) {
  const phase = phaseForDay(state?.day || 1);
  return phase === 'end' ? 'collapse' : phase;
}

export function offeredThisPhase(state, id) {
  return state?.flags?.offers?.[id] === phaseKey(state);
}

export function markOffered(state, id) {
  state.flags = state.flags || {};
  state.flags.offers = state.flags.offers || {};
  state.flags.offers[id] = phaseKey(state);
}

function stashCount(state, key) {
  return state?.stash?.[key] || 0;
}

function spendStash(state, key, count) {
  if (!state.stash) return 0;
  const have = state.stash[key] || 0;
  const used = Math.min(have, count);
  state.stash[key] = have - used;
  return used;
}

export function recruitBlock(state, id) {
  const row = neighborById(id);
  if (!row) return 'They changed their mind on the walk over.';
  if (isHere(state, id)) return `${row.name} already has a cot.`;
  if (recruited(state).length >= CONFIG.CREW.maxNeighbors) return 'The bunker is a full house. Biscuit does not count. He was first.';
  if (cotCount(state) <= recruited(state).length) {
    return `There's nowhere to put ${row.name}. You've considered several places.`;
  }
  if (state.flags?.left?.[id] && (state.stats?.food || 0) < CONFIG.CREW.rehireFood) {
    return `${row.name} will come back. It costs ${CONFIG.CREW.rehireFood} food this time. The shelf disagrees.`;
  }
  if (id === 'larry') {
    if (stashCount(state, 'battery') < 1 && stashCount(state, 'tinfoil') < 2) {
      return 'Larry wants 2 tinfoil or 1 battery. You have a look, and no Faraday anything.';
    }
  } else if (id === 'kowalski') {
    if (roomLevel(state, 'pantry') < 1) return 'She wants a pantry that is a room. A pile is not a room.';
  } else if (id === 'dale') {
    if ((state.stats?.materials || 0) < CONFIG.CREW.daleFine) return 'The unpermitted-hole fine is 3 planks. Dale brought a receipt and no flexibility.';
  } else if (id === 'tina') {
    if ((state.stats?.medicine || 0) < 1 && stashCount(state, 'coffee') < 1) {
      return 'Tina wants medicine or a coffee. You have neither, and she has already worked a double.';
    }
  } else if (id === 'kevin') {
    if (roomLevel(state, 'generator') < 1) return 'Kevin wants a generator. The phone is a brick with feelings until then.';
  }
  return '';
}

function payToJoin(state, id) {
  if (state.flags?.left?.[id]) changeStat('food', -CONFIG.CREW.rehireFood);
  if (id === 'larry') {
    if (stashCount(state, 'battery') >= 1) spendStash(state, 'battery', 1);
    else spendStash(state, 'tinfoil', 2);
  } else if (id === 'dale') {
    changeStat('materials', -CONFIG.CREW.daleFine);
  } else if (id === 'tina') {
    if (stashCount(state, 'coffee') >= 1) spendStash(state, 'coffee', 1);
    else changeStat('medicine', -1);
  }
}

export function recruit(state, id) {
  const reason = recruitBlock(state, id);
  if (reason) return { ok: false, reason };
  const row = neighborById(id);
  payToJoin(state, id);
  state.crew = state.crew || {};
  state.crew[id] = {
    health: CONFIG.CREW.healthStart,
    job: 'rest',
    laidUp: 0,
    zeroNights: 0,
  };
  if (state.flags?.left) delete state.flags.left[id];
  return { ok: true, line: row.joined };
}

export function refuse(state, id, source) {
  const row = neighborById(id);
  const line = row?.refusals?.[Math.floor(Math.random() * (row.refusals?.length || 1))] || 'Not today. They nod like they expected it.';
  let morale = 0;
  if (source === 'knock' && Math.random() < 0.4) {
    morale = CONFIG.MORALE_RULES.neighborLeaves ? -1 : -1;
    changeStat('morale', -1);
  }
  return { line, morale };
}

export function recruitView(state, id) {
  const row = neighborById(id);
  if (!row) return { name: 'Neighbor', portrait: '', body: 'They left before the card.', block: 'Gone.' };
  const block = recruitBlock(state, id);
  const have = [
    `Tinfoil ${stashCount(state, 'tinfoil')}`,
    `Battery ${stashCount(state, 'battery')}`,
    `Coffee ${stashCount(state, 'coffee')}`,
    `Medicine ${state.stats?.medicine || 0}`,
    `Planks ${state.stats?.materials || 0}`,
    `Cots free ${Math.max(0, cotCount(state) - recruited(state).length)}`,
  ].join('   ');
  const body = [
    row.pitch,
    '',
    `SKILL  ${row.skill}`,
    `QUIRK  ${row.quirk}`,
    row.upkeep,
    `Wants first: ${row.wants}`,
    have,
    block ? `\n${block}` : '',
    state.flags?.left?.[id] ? `Coming back costs ${CONFIG.CREW.rehireFood} food on top of that.` : '',
  ].filter(Boolean).join('\n');
  return { name: row.name, portrait: row.portrait, body, block };
}

export function canOffer(state, id) {
  if (!neighborById(id)) return false;
  if (isHere(state, id)) return false;
  if (offeredThisPhase(state, id)) return false;
  return true;
}

export function hashDay(day, salt) {
  const x = Math.sin((day + 1) * 12.9898 + salt) * 43758.5453;
  return x - Math.floor(x);
}

export function addNotice(state, kind) {
  if (!state) return NOTICE_FORMS[0];
  state.notices = Array.isArray(state.notices) ? state.notices : [];
  const pool = kind === 'hedge'
    ? NOTICE_FORMS.filter((item) => item.id === 'hedge')
    : NOTICE_FORMS.filter((item) => item.id !== 'hedge');
  const form = pool[state.notices.length % pool.length] || NOTICE_FORMS[0];
  state.notices.push({ id: form.id, rule: form.rule, day: state.day || 1 });
  state.violations = state.notices.length;
  state.flags = state.flags || {};
  state.flags.noticesEver = (state.flags.noticesEver || 0) + 1;
  return form;
}

export function resolveNotice(state, pay) {
  if (!state?.notices?.length) return { ok: false, line: 'The board is clear. Dale will invent something.' };
  if (pay === 'materials') {
    if ((state.stats?.materials || 0) < 1) return { ok: false, line: 'No plank. Dale does not take IOUs.' };
    changeStat('materials', -1);
  } else if (pay === 'snacks') {
    if ((state.stash?.snacks || 0) < 1) return { ok: false, line: 'No snack cakes. Dale is human, but not that human.' };
    state.stash.snacks -= 1;
  } else {
    return { ok: false, line: 'Dale wants a plank or a snack cake.' };
  }
  const gone = state.notices.shift();
  state.violations = state.notices.length;
  const extra = pay === 'snacks' ? ' Dale accepts snack cakes. Dale is human after all.' : '';
  touchState();
  return { ok: true, line: `${gone.rule} Taken down.${extra}` };
}

export function wearingCoat(state) {
  return (state?.stash?.coat || 0) > 0 && state?.flags?.coatWorn !== false;
}

export function coatBlocksCold(state) {
  return wearingCoat(state);
}

/** Built generator, unless tonight's sputter had no gas. */
export function generatorOn(state) {
  if (roomLevel(state, 'generator') < 1) return false;
  if (state?.flags?.sputterNight && state.flags.sputterNight === state.day) return false;
  return true;
}

export function isBoarded(state, marker) {
  if (!marker || marker.kind === 'home') return false;
  const arc = phaseProfile(marker, phaseForDay(state.day));
  return !!(arc?.boardedFrom && state.day >= arc.boardedFrom);
}

export function tickRoads(state) {
  if (!state) return;
  state.flags = state.flags || {};
  const info = phaseInfo(state.day);
  if (state.day < 21 || !info.roadEvery) {
    state.flags.road = null;
    return;
  }
  const road = state.flags.road;
  if (road?.id && state.day < road.untilDay) return;
  const openFar = MARKERS.filter((marker) => marker.far && marker.kind === 'open' && !isBoarded(state, marker));
  const pool = openFar.filter((marker) => marker.id !== road?.id);
  const list = pool.length ? pool : openFar;
  if (!list.length) {
    state.flags.road = null;
    return;
  }
  const index = Math.floor(hashDay(state.day, 3) * list.length);
  state.flags.road = { id: list[index].id, untilDay: state.day + info.roadEvery };
}

export function garyRespect(state) {
  if (!state) return 0;
  if (typeof state.flags?.respectOverride === 'number') {
    return Math.max(0, Math.min(5, state.flags.respectOverride));
  }
  let score = 0;
  if ((state.flags?.waterDay || 99) <= 10) score += 1;
  if (roomLevel(state, 'barricade') >= 1) score += 1;
  if ((state.flags?.garyFair || 0) >= 3) score += 1;
  if ((state.flags?.moraleHighNights || 0) >= 5) score += 1;
  if (state.flags?.garyScorched) score -= 1;
  if (state.flags?.heistCaught) {
    const run = state.flags.heistCaughtRun || 1;
    const pen = run >= 2 ? (CONFIG.HEIST?.respectPenaltyRun2 || 3) : (CONFIG.HEIST?.respectPenalty || 2);
    score -= pen;
  }
  if (state.flags?.heistSearched) {
    score -= (CONFIG.HEIST?.searchRespect || 4) * state.flags.heistSearched;
  }
  if (state.flags?.heistHeat) {
    score -= (CONFIG.HEIST?.larryRideRespect || 1) * state.flags.heistHeat;
  }
  return Math.max(0, Math.min(5, score));
}

export function spotStatus(state, marker) {
  if (!marker) return { code: 'locked', line: 'Gone.', grey: true };
  if (marker.kind === 'home') return { code: 'home', line: marker.quip || '', grey: false };
  if (marker.kind === 'landmark') return { code: 'landmark', line: marker.reason || marker.quip || '', grey: false };
  if (marker.id === 'gary') {
    if (!state?.garyVisited) return { code: 'locked', line: marker.reason || marker.quip || '', grey: true };
    const phase = phaseForDay(state.day);
    if ((phase === 'collapse' || phase === 'end') && garyRespect(state) < 2) {
      return { code: 'locked', line: "The gate is shut. Gary's respect is a kind of key.", grey: true };
    }
    return { code: 'open', line: 'The gate is unlatched. He is still not cheerful.', grey: false };
  }
  if (marker.opensOn && (state?.day || 1) < marker.opensOn) {
    return { code: 'locked', line: marker.reason || marker.quip || '', grey: true };
  }
  if (marker.closesOn && (state?.day || 1) >= marker.closesOn) {
    return { code: 'boarded', line: marker.closedLine || 'Gone.', grey: true };
  }
  if (marker.kind === 'locked') return { code: 'locked', line: marker.reason || marker.quip || '', grey: true };
  if (isBoarded(state, marker)) {
    const arc = phaseProfile(marker, phaseForDay(state.day));
    return {
      code: 'boarded',
      line: arc?.boardedLine || "Boarded up. Somebody wrote 'NO' on it. Just 'NO.'",
      grey: true,
    };
  }
  const road = state.flags?.road;
  if (road?.id === marker.id && state.day < road.untilDay) {
    return { code: 'road', line: "Road's out. Pothole finally won.", grey: true };
  }
  if (marker.id === 'bait' && state?.flags?.heistCaught) {
    return { code: 'open', line: 'The sheriff patrols the dock. He has a flashlight and a count.', grey: false };
  }
  return { code: 'open', line: '', grey: false };
}

export function guardBonus(state, where) {
  if (where !== 'night' && where !== 'survival') return 0;
  const guards = recruited(state).filter((row) => jobOf(state, row.id) === 'guard').length;
  return Math.min(CONFIG.CREW.guardMax, guards * CONFIG.CREW.guardEach);
}

export function dangerAdjust(state, action, where) {
  let extra = 0;
  const home = where === 'night' || where === 'survival';
  if (home && (action === 'fight' || action === 'hide')) extra += guardBonus(state, where);
  if (home && action === 'hide' && isActive(state, 'larry')) extra += CONFIG.CREW.larryHide;
  if (home && action === 'hide') {
    const lead = roomLevel(state, 'lead');
    if (lead > 0) extra += CONFIG.CREW.hideByLead[lead - 1] || 0;
  }
  if (where === 'trip' && action === 'run') {
    const kevin = alongNeighbor(state);
    if (kevin?.id === 'kevin' && isActive(state, 'kevin') && generatorOn(state)) {
      extra += CONFIG.CREW.kevinRun;
    }
  }
  if ((state.stats?.morale || 0) >= CONFIG.MORALE_RULES.highAt) extra += CONFIG.MORALE_RULES.highOdds;
  if (where === 'trip' && wearingCoat(state)) extra += CONFIG.ITEMS.mackinawDanger || 0;
  if (action === 'hide' && state.flags?.hideBonus) extra += 0.12;
  if (where === 'trip' && state.flags?.dockReady && state.flags?.trip?.location === 'super') extra += 0.12;
  if (where === 'trip' && state.flags?.heistCaught && state.flags?.trip?.location === 'bait') extra -= 0.12;
  return extra;
}

export function tripExtras(state) {
  const who = alongNeighbor(state);
  if (!who || !isActive(state, who.id)) return { loot: 0, line: '' };
  if (who.id === 'kevin') {
    if (!generatorOn(state)) {
      return { loot: 0, line: "Kevin's phone is dark. He films the dark. The dark does not help." };
    }
    return { loot: CONFIG.CREW.kevinLoot, line: 'Kevin finds one more thing and does not make a speech about it.' };
  }
  return { loot: 0, line: `${who.name} comes along. The errand has a witness.` };
}

function weightPick(weights) {
  const entries = Object.entries(weights || {}).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  if (!total) return null;
  let roll = Math.random() * total;
  for (const [key, value] of entries) {
    roll -= value;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function locationGoods(state, marker) {
  const deltas = {};
  if (!marker) return deltas;
  const phase = phaseForDay(state.day);
  const info = phaseInfo(phase === 'end' ? 'collapse' : phase);
  const arc = phaseProfile(marker, phase);
  if (!arc || isBoarded(state, marker)) return deltas;
  const expected = (arc.rolls ?? 1) * (info.lootMul ?? 1) * (arc.lootMul ?? 1);
  let rolls = Math.floor(expected);
  if (Math.random() < (expected - rolls)) rolls += 1;
  for (let i = 0; i < rolls; i += 1) {
    const key = weightPick(arc.weights);
    if (!key) break;
    if (STASH_KEYS.includes(key)) {
      deltas.stash = deltas.stash || {};
      deltas.stash[key] = (deltas.stash[key] || 0) + 1;
    } else {
      deltas[key] = (deltas[key] || 0) + 1;
    }
  }
  if (arc.jackpot && Math.random() < arc.jackpot) {
    const key = arc.jackpotItem || 'medicine';
    const count = arc.jackpotCount || 3;
    if (STASH_KEYS.includes(key)) {
      deltas.stash = deltas.stash || {};
      deltas.stash[key] = (deltas.stash[key] || 0) + count;
    } else {
      deltas[key] = (deltas[key] || 0) + count;
    }
  }
  return deltas;
}

export function applyStash(state, stash) {
  if (!stash) return [];
  state.stash = state.stash || {};
  const parts = [];
  STASH_KEYS.forEach((key) => {
    if (!stash[key]) return;
    const next = Math.max(0, (state.stash[key] || 0) + stash[key]);
    const got = next - (state.stash[key] || 0);
    state.stash[key] = next;
    if (got) parts.push(`${stashLabel(key)} ${got > 0 ? '+' : ''}${got}`);
  });
  if ((state.stash.coat || 0) > 1) state.stash.coat = 1;
  if ((state.stash.rockets || 0) < 0) state.stash.rockets = 0;
  return parts;
}

function pushMorale(bag, delta, text) {
  if (!delta) return;
  bag.delta += delta;
  const sign = delta > 0 ? `+${delta}` : `${delta}`;
  bag.lines.push(`${sign} ${text}`);
}

function layUp(row) {
  row.health = 0;
  row.laidUp = CONFIG.CREW.laidUpDays;
  row.job = 'rest';
}

export function nickCrew(state, amount = 1) {
  const pool = recruited(state).filter((row) => isActive(state, row.id));
  if (!pool.length || !amount) return '';
  const row = pool[Math.floor(Math.random() * pool.length)];
  const body = state.crew[row.id];
  body.health = Math.max(0, (body.health || 0) - amount);
  if (body.health <= 0) {
    layUp(body);
    return `${row.name} is laid up. Two quiet days. Then they are back to a 1.`;
  }
  return `${row.name} takes a knock. Health ${body.health}.`;
}

export function stampMorning(state) {
  if (!isHere(state, 'larry')) return '';
  const entry = (state.rumors || []).find((row) => row?.morning && row.day === state.day);
  if (!maybeStampEntry(state, entry)) return '';
  const line = LARRY_STAMP_LINES[Math.floor(Math.random() * LARRY_STAMP_LINES.length)];
  return line || 'Larry stamps the page. LARRY SAYS: FAKE.';
}

function healPerson(body, amount) {
  if (!body || body.laidUp > 0) return;
  body.health = Math.max(0, Math.min(CONFIG.CREW.healthMax, (body.health || 0) + amount));
}

export function nightKey(state) {
  if (state?.mode === 'survival') return `s${state.survivalDay || 1}`;
  return state?.day || 1;
}

export function memorialEntries(state) {
  return (state?.memorial || []).filter((entry) => {
    const id = typeof entry === 'string' ? entry.toLowerCase() : entry?.id;
    return id && lossCandidates().includes(id);
  }).map((entry) => (typeof entry === 'string'
    ? { id: entry.toLowerCase(), name: entry, day: 11, epitaph: 'They were here.' }
    : entry));
}

export function loseNeighbor(state, id, opts = {}) {
  if (!state || id === 'tina' || id === 'biscuit' || !lossCandidates().includes(id)) return '';
  if (!person(state, id)) return '';
  const key = nightKey(state);
  if (!opts.force && (state.day || 1) < CONFIG.CREW.lossFromDay) return '';
  if (!opts.force && state.flags?.lostNight === key) return '';
  const row = neighborById(id);
  delete state.crew[id];
  state.memorial = Array.isArray(state.memorial) ? state.memorial : [];
  if (!state.memorial.some((entry) => (entry?.id || entry) === id)) {
    state.memorial.push({
      id,
      name: row?.name || id,
      day: state.day || 11,
      epitaph: row?.epitaph || 'They were here.',
    });
  }
  state.flags = state.flags || {};
  state.flags.lostNight = key;
  state.flags.freshLoss = {
    id,
    name: row?.name || id,
    portrait: row?.portrait || '',
    line: row?.loss || `${row?.name || 'They'} did not come back.`,
  };
  changeStat('morale', CONFIG.MORALE_RULES.neighborLost);
  return state.flags.freshLoss.line;
}

export function sendSolo(state, id, locationId) {
  if (!state || state.mode === 'survival') return { ok: false, line: 'Not from here.' };
  if (!isActive(state, id)) return { ok: false, line: 'They are not up for a walk.' };
  if (state.flags?.soloDay === state.day) return { ok: false, line: 'Somebody already went out today.' };
  const marker = markerById(locationId);
  if (!marker || spotStatus(state, marker).code !== 'open') return { ok: false, line: 'That door is not a door today.' };
  state.flags.solo = { id, location: locationId, day: state.day };
  state.flags.soloDay = state.day;
  const odds = soloOdds(state, id);
  return { ok: true, line: `${neighborById(id)?.name || 'They'} head out. You stay. Home odds: ${oddsWordSafe(odds.loss)}.` };
}

export function oddsWordSafe(loss) {
  const home = 1 - (loss || 0);
  if (home >= 0.86) return 'Great odds';
  if (home >= 0.72) return 'Good odds';
  if (home >= 0.56) return 'Decent';
  if (home >= 0.4) return 'Coin flip';
  if (home >= 0.22) return 'Long shot';
  return 'Bad idea';
}

function scaleBag(deltas, rate) {
  const out = {};
  Object.entries(deltas || {}).forEach(([key, value]) => {
    if (key === 'stash' && value && typeof value === 'object') {
      out.stash = {};
      Object.entries(value).forEach(([stashKey, count]) => {
        const next = Math.round(count * rate);
        if (next > 0) out.stash[stashKey] = next;
      });
      return;
    }
    if (typeof value === 'number') {
      const next = Math.round(value * rate);
      if (next) out[key] = next;
    }
  });
  return out;
}

function applyBag(state, deltas) {
  const parts = [];
  Object.entries(deltas || {}).forEach(([key, value]) => {
    if (key === 'stash') {
      parts.push(...applyStash(state, value));
      return;
    }
    if (typeof value === 'number' && value) {
      changeStat(key, value);
      parts.push(`${key} +${value}`);
    }
  });
  return parts;
}

export function resolveSolo(state, lines) {
  const solo = state?.flags?.solo;
  if (!solo || solo.day !== state.day) return '';
  state.flags.solo = null;
  const row = neighborById(solo.id);
  const body = person(state, solo.id);
  if (!row || !body) return '';
  const marker = markerById(solo.location);
  const haul = solo.id === 'kevin' ? CONFIG.CREW.soloKevinHaul : CONFIG.CREW.soloHaul;
  let risk = CONFIG.CREW.soloLoss[phaseKey(state)] ?? 0;
  if (solo.id === 'kevin') risk *= CONFIG.CREW.soloKevinMul;
  if (body.laidUp > 0) risk *= CONFIG.CREW.soloLaidUpMul;
  const failed = Math.random() < risk;
  if (failed && solo.id !== 'tina') {
    const line = loseNeighbor(state, solo.id);
    if (line && lines) lines.push(line);
    return line;
  }
  const bag = scaleBag(locationGoods(state, marker), failed ? haul * 0.5 : haul);
  const got = applyBag(state, bag);
  let line = '';
  if (failed && solo.id === 'tina') {
    body.health = 1;
    body.laidUp = CONFIG.CREW.laidUpDays;
    body.job = 'rest';
    const late = row.late?.[Math.floor(Math.random() * (row.late?.length || 1))] || "I've seen worse at 3 AM.";
    line = `${row.name} comes back late, laid up. "${late}"`;
  } else {
    line = got.length
      ? `${row.name} comes back with ${got.join(', ')}.`
      : `${row.name} comes back with a story and empty hands.`;
  }
  if (lines) lines.push(line);
  return line;
}

export function maybeGuardLoss(state) {
  if (!state || phaseKey(state) !== 'collapse') return '';
  if ((state.day || 1) < CONFIG.CREW.lossFromDay) return '';
  const guards = recruited(state).filter((row) => lossCandidates().includes(row.id) && jobOf(state, row.id) === 'guard');
  if (!guards.length || Math.random() >= CONFIG.CREW.lossGuardCollapse) return '';
  const row = guards[Math.floor(Math.random() * guards.length)];
  return loseNeighbor(state, row.id);
}

export function maybeBarricadeLoss(state) {
  if (!state || state.mode !== 'survival') return '';
  if ((state.day || 1) < CONFIG.CREW.lossFromDay) return '';
  if (roomLevel(state, 'barricade') < 1) return '';
  if (Math.random() >= CONFIG.CREW.lossBarricadeSurvival) return '';
  const pool = recruited(state).filter((row) => lossCandidates().includes(row.id));
  if (!pool.length) return '';
  const row = pool[Math.floor(Math.random() * pool.length)];
  return loseNeighbor(state, row.id);
}

export function applyCold(state, lines) {
  if (!state) return;
  state.flags = state.flags || {};
  state.flags.snowNight = nightKey(state);
  lines?.push('Lake-effect snow off Pine Lake. The surface goes quiet and white.');
  if (generatorOn(state)) {
    lines?.push('The generator keeps the bunker a bunker. The snow stays outside.');
    return;
  }
  if (coatBlocksCold(state)) lines?.push("You slept in the Mackinaw. You'd do it anyway.");
  else {
    const lost = changeStat('health', -1);
    if (lost) lines?.push('No power. The cold takes a point of health.');
  }
  recruited(state).forEach((row) => {
    if (!isActive(state, row.id)) return;
    const body = state.crew[row.id];
    body.health = Math.max(0, (body.health || 0) - 1);
    if (body.health <= 0) layUp(body);
  });
  lines?.push('Everyone else feels it. Biscuit is under the cot, in the bandana, fine.');
}

/** Nightly neighbor and room effects, except the food bill (that lives in nightlyUpkeep). */
export function applyCrewNight(state, lines) {
  const bag = { delta: 0, lines };
  resolveSolo(state, lines);
  if ((state.day || 1) >= CONFIG.CREW.lossFromDay && state.flags?.lostNight !== nightKey(state)) {
    const stuck = lossCandidates().filter((id) => {
      const body = person(state, id);
      return body && (body.health || 0) <= 0 && (body.zeroNights || 0) >= CONFIG.CREW.lossNeglectedNights;
    });
    if (stuck.length && !isActive(state, 'tina') && (state.stats?.medicine || 0) <= 0 && Math.random() < CONFIG.CREW.lossNeglected) {
      const line = loseNeighbor(state, stuck[Math.floor(Math.random() * stuck.length)]);
      if (line) lines.push(line);
    }
  }
  const phase = phaseForDay(state.day);
  const powered = generatorOn(state);
  const genHelps = !(state.mode === 'survival' && apocalypseOf(state) === 'robots');
  if (powered && genHelps) pushMorale(bag, CONFIG.MORALE_RULES.generator, 'Generator hummed all night');
  else if (powered && !genHelps) {
    lines.push('The generator hums. The appliances hum back. No extra warmth in it.');
  } else if (phase === 'collapse') pushMorale(bag, -CONFIG.MORALE_RULES.collapseDark, 'No power in the collapse');

  const rec = roomLevel(state, 'rec');
  if (rec > 0) pushMorale(bag, CONFIG.MORALE_RULES.rec[rec - 1] || 1, 'The rec room earned its keep');

  const others = recruited(state).filter((row) => row.id !== 'dale').length;
  if (isActive(state, 'dale') && others >= 2) pushMorale(bag, CONFIG.MORALE_RULES.dale, "Dale organized somebody else's mess");

  if (state.flags?.beerTonight) {
    pushMorale(bag, CONFIG.MORALE_RULES.beer, 'Somebody cracked a Pine Lake Light');
    state.flags.beerTonight = false;
  }
  if (state.flags?.bigHaul) {
    pushMorale(bag, CONFIG.MORALE_RULES.bigHaul, 'A big haul, or a trade that felt like one');
    state.flags.bigHaul = false;
  }
  if (state.flags?.rocketWrong) {
    pushMorale(bag, CONFIG.MORALE_RULES.rocketBunker, 'A bottle rocket came inside to think');
    state.flags.rocketWrong = false;
  }
  if (state.flags?.freshLoss && !state.flags.lossTold) {
    lines.push(`${CONFIG.MORALE_RULES.neighborLost} ${state.flags.freshLoss.name} did not come back`);
    state.flags.lossTold = true;
  }
  if (state.flags?.boardGame && roomLevel(state, 'rec') >= 1) {
    pushMorale(bag, 1, 'Somebody played the rummage board game');
    state.flags.boardGame = false;
  }
  if (state.flags?.kevinViewer) {
    pushMorale(bag, CONFIG.MORALE_RULES.kevinViewer, 'Kevin had a real viewer');
    state.flags.kevinViewer = false;
  }
  if (state.flags?.spectacular) {
    pushMorale(bag, CONFIG.MORALE_RULES.spectacular, 'The rocket was, unfortunately, beautiful');
    state.flags.spectacular = false;
  }

  if ((state.violations || 0) >= CONFIG.CREW.violationMoraleAt) {
    pushMorale(bag, CONFIG.MORALE_RULES.violations, 'Five notices on the board, and none of them resolved');
  }

  if (state.flags?.faradayCheerPending) {
    pushMorale(bag, 1, 'Larry is delighted. It is a closet');
    state.flags.faradayCheerPending = false;
    state.flags.faradayCheered = true;
  }

  if (isActive(state, 'larry')) {
    state.flags.larryDays = (state.flags.larryDays || 0) + 1;
    if (state.flags.larryDays >= CONFIG.CREW.larryBatteryEvery) {
      state.flags.larryDays = 0;
      if (stashCount(state, 'battery') > 0) {
        spendStash(state, 'battery', 1);
        lines.push('Larry spends a battery on frequencies. He does not share what they said.');
      } else {
        pushMorale(bag, -1, 'Larry had no battery and said so, at length');
      }
    }
  }

  if (isActive(state, 'kowalski') && (state.stats.food || 0) < CONFIG.CREW.kowalskiPantryAt) {
    pushMorale(bag, -1, 'Mrs. Kowalski saw the pantry');
  }

  if (isActive(state, 'dale')) {
    state.flags.daleDays = (state.flags.daleDays || 0) + 1;
    if (state.flags.daleDays >= CONFIG.CREW.daleNoticeEvery) {
      state.flags.daleDays = 0;
      const filed = addNotice(state, 'dale');
      lines.push(`Dale files a notice. ${filed.rule} The board has ${state.violations}.`);
    }
  }

  if (isActive(state, 'tina')) {
    if (stashCount(state, 'coffee') > 0) {
      spendStash(state, 'coffee', 1);
      pushMorale(bag, 1, 'Tina drank a coffee and did not sigh');
    } else {
      lines.push('Tina says "Fine." You feel the quotation marks.');
    }
    const amount = jobOf(state, 'tina') === 'work' ? CONFIG.CREW.tinaWorkHeal : CONFIG.CREW.tinaHeal;
    const healed = changeStat('health', amount);
    if (healed) lines.push(`Tina checks on you. Health +${healed}.`);
    recruited(state).forEach((row) => healPerson(state.crew[row.id], amount));
    state.flags.tinaNights = (state.flags.tinaNights || 0) + 1;
    if (state.flags.sick && state.flags.tinaNights >= CONFIG.CREW.tinaCureEvery) {
      state.flags.sick = false;
      state.flags.tinaNights = 0;
      lines.push('Tina clears the sickness. She does not charge for it.');
    }
  }

  if (isHere(state, 'kevin') && !powered) {
    lines.push('Kevin watches a dark phone. He does not complain. The phone does.');
  }
  if (isActive(state, 'kevin') && jobOf(state, 'kevin') === 'work' && powered) {
    pushMorale(bag, CONFIG.CREW.kevinWorkMorale, 'Kevin streamed the bleak lighting and someone stayed');
  }

  const resting = recruited(state).filter((row) => jobOf(state, row.id) === 'rest' && isActive(state, row.id));
  resting.forEach((row) => healPerson(state.crew[row.id], CONFIG.CREW.restHeal));
  const restMorale = Math.floor(resting.length / CONFIG.CREW.restMoralePer);
  if (restMorale) pushMorale(bag, restMorale, 'People actually rested');

  if (isActive(state, 'kowalski')) {
    state.flags.casseroleNights = (state.flags.casseroleNights || 0) + 1;
    if (state.flags.casseroleNights >= CONFIG.CREW.kowalskiEvery) {
      state.flags.casseroleNights = 0;
      const got = changeStat('food', CONFIG.CREW.kowalskiFood);
      if (got) lines.push(`Mrs. Kowalski makes a casserole. Food +${got}.`);
    }
    if (jobOf(state, 'kowalski') === 'work') {
      state.flags.kowalskiWork = (state.flags.kowalskiWork || 0) + 1;
      if (state.flags.kowalskiWork >= CONFIG.CREW.kowalskiWorkEvery) {
        state.flags.kowalskiWork = 0;
        const got = changeStat('food', 1);
        if (got) lines.push('The work shift finds one more can. Food +1.');
      }
    }
  }

  const grow = roomLevel(state, 'grow');
  if (grow > 0) {
    const every = CONFIG.CREW.growEvery[grow - 1] || 3;
    const pace = powered ? every : every * 2;
    state.flags.growNights = (state.flags.growNights || 0) + 1;
    if (state.flags.growNights >= pace) {
      state.flags.growNights = 0;
      const got = changeStat('food', 1);
      if (got) lines.push(powered ? 'The grow room offers a potato. Food +1.' : 'The grow room works at half speed. Food +1, eventually.');
    }
    if (state.mode === 'survival' && apocalypseOf(state) === 'bigmoon') {
      const extra = changeStat('food', 1);
      if (extra) lines.push('The grow room likes the long night. Food +1.');
    }
  }

  if (!powered && phase === 'collapse' && recruited(state).length && Math.random() < 0.25) {
    if (coatBlocksCold(state)) lines.push('The Mackinaw takes the cold. You stay a person.');
    const note = nickCrew(state, 1);
    if (note) lines.push(`Cold snap. ${note}`);
  }

  const spoilChance = CONFIG.ITEMS.spoil[phase] || 0;
  if (spoilChance && roomLevel(state, 'lead') < 1 && (state.stats.medicine || 0) > 0 && Math.random() < spoilChance) {
    changeStat('medicine', -1);
    lines.push('A bottle of medicine gives up. A lead-lined room would have argued.');
  }

  if (bag.delta) changeStat('morale', bag.delta);
  return bag.delta;
}

export function noteEmptyStores(state, foodBefore, waterBefore, lines) {
  const bag = { delta: 0, lines };
  if (foodBefore <= 0 && waterBefore <= 0) pushMorale(bag, CONFIG.MORALE_RULES.emptyStores, 'No food or water that night');
  else if (foodBefore <= 0) pushMorale(bag, CONFIG.MORALE_RULES.emptyStores, 'No food that night');
  else if (waterBefore <= 0) pushMorale(bag, CONFIG.MORALE_RULES.emptyStores, 'No water that night');
  if (bag.delta) changeStat('morale', bag.delta);
}

export function resolveSurge(state) {
  if (roomLevel(state, 'faraday') >= 1) {
    return 'The lights jump. The Faraday closet shrugs. The batteries stay batteries.';
  }
  state.flags.staticBoost = (state.flags.staticBoost || 0) + 1;
  const have = stashCount(state, 'battery');
  const lose = Math.min(2, have);
  if (lose > 0) {
    spendStash(state, 'battery', lose);
    state.flags.radioFried = true;
    return `A surge eats ${lose} ${lose === 1 ? 'battery' : 'batteries'}. Tomorrow's broadcast will be mostly static.`;
  }
  return 'A surge runs through the radio. There was no battery to lose. The hiss stays.';
}

export function forcedNightId(state) {
  const morale = state.stats?.morale ?? 7;
  if (morale < 2 || morale > 3) return null;
  if (recruited(state).length < 2) return null;
  let chance = CONFIG.MORALE_RULES.argumentChance;
  if (roomLevel(state, 'rec') >= 1) chance *= CONFIG.MORALE_RULES.recArgumentMul;
  if (Math.random() < chance) return 'argument';
  return null;
}

export function failedDangerMorale(state, lines) {
  changeStat('morale', CONFIG.MORALE_RULES.failedDanger);
  if (lines) lines.push(`${CONFIG.MORALE_RULES.failedDanger} A danger card went badly`);
  return nickCrew(state, 1);
}

export function settleCrew(state) {
  if (!state) return [];
  const key = state.mode === 'survival' ? `s${state.survivalDay || 1}` : state.day;
  if (state.flags.crewSettled === key) return [];
  state.flags.crewSettled = key;
  const lines = [];
  recruited(state).forEach((row) => {
    const body = state.crew[row.id];
    if (body.laidUp > 0) {
      const stuck = (state.day || 1) >= CONFIG.CREW.lossFromDay
        && lossCandidates().includes(row.id)
        && !isActive(state, 'tina')
        && (state.stats?.medicine || 0) <= 0;
      if (stuck) {
        body.zeroNights = (body.zeroNights || 0) + 1;
        lines.push(`${row.name} is still down. No Tina, no medicine. The cot stays a cot.`);
        return;
      }
      body.zeroNights = 0;
      body.laidUp -= 1;
      if (body.laidUp <= 0) {
        body.laidUp = 0;
        body.health = 1;
        lines.push(`${row.name} is back on their feet. Health 1. The cot is free to be a cot.`);
      }
      return;
    }
    if ((body.health || 0) <= 0) layUp(body);
  });
  const morale = state.stats?.morale ?? 0;
  if (morale >= 6) state.flags.moraleHighNights = Math.min(5, (state.flags.moraleHighNights || 0) + 1);
  else state.flags.moraleHighNights = 0;
  if (morale <= CONFIG.MORALE_RULES.leaveAt) state.flags.moraleLowNights = (state.flags.moraleLowNights || 0) + 1;
  else state.flags.moraleLowNights = 0;
  if ((state.flags.moraleLowNights || 0) >= CONFIG.CREW.leaveAfterNights) {
    recruited(state).forEach((row) => {
      if (Math.random() >= CONFIG.CREW.leaveChance) return;
      delete state.crew[row.id];
      state.flags.left = state.flags.left || {};
      state.flags.left[row.id] = true;
      changeStat('morale', CONFIG.MORALE_RULES.neighborLeaves);
      lines.push(`${CONFIG.MORALE_RULES.neighborLeaves} ${row.name} goes home. Off-screen. The cot is just a cot again.`);
    });
  }
  if (state.mode !== 'survival' && (state.stats?.morale || 0) <= CONFIG.MORALE_RULES.stareAt) {
    state.flags.wallWon = true;
    state.flags.wallNote = 'You spent the morning staring at the wall. The wall won.';
  }
  return lines;
}

export function rollKnock(state) {
  if (!state || state.mode !== 'prep' || state.day < 21) return null;
  if (state.flags.knockDay === state.day) return state.flags.knockPending || null;
  state.flags.knockDay = state.day;
  const info = phaseInfo(state.day);
  if (Math.random() > (info.knock || 0)) {
    state.flags.knockPending = null;
    return null;
  }
  const pool = NEIGHBORS.filter((row) => canOffer(state, row.id));
  if (!pool.length) {
    state.flags.knockPending = null;
    return null;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  state.flags.knockPending = pick.id;
  return pick.id;
}

export function clearKnock(state) {
  if (state?.flags) state.flags.knockPending = null;
}

export function idleLine(id) {
  const row = neighborById(id);
  if (!row?.idle?.length) return '';
  return row.idle[Math.floor(Math.random() * row.idle.length)];
}

export function workRoom(id) {
  return neighborById(id)?.workRoom || null;
}

/**
 * Part 2 calls this. Seeded ±10% wobble, then the phase multiplier on scarce goods.
 * Gary, Larry, and the swap-meet stalls are modifiers, not a shop yet.
 */
export function tradeUnit(good, day, who, extra = {}) {
  const row = CONFIG.TRADE.goods[good];
  if (!row) return 0;
  const phase = phaseForDay(day || 1);
  const index = phase === 'panic' ? 1 : (phase === 'collapse' || phase === 'end') ? 2 : 0;
  const wobble = 1 + (hashDay(day || 1, good.length) * 2 - 1) * CONFIG.TRADE.wobble;
  let price = row.base * (row.mul[index] || 1) * wobble;
  const side = extra.side || 'give';
  if (who === 'gary' && side === 'give') {
    const respect = extra.respect || 0;
    const rate = respect >= CONFIG.TRADE.garyRespectAt ? CONFIG.TRADE.garyBuyRespect : CONFIG.TRADE.garyBuy;
    price *= rate;
  }
  if (who === 'larry' && side === 'give' && good === 'tinfoil') price *= CONFIG.TRADE.larryFoil;
  if (who === 'larry' && side === 'give' && good === 'battery') price *= CONFIG.TRADE.larryBattery;
  if (who === 'stall') {
    const mod = typeof extra.mod === 'number'
      ? extra.mod
      : CONFIG.TRADE.stallMin + hashDay(day || 1, 9) * (CONFIG.TRADE.stallMax - CONFIG.TRADE.stallMin);
    price *= mod;
  }
  if (good === 'coat') price = Math.max(row.base, price);
  return Math.max(1, Math.round(price));
}

/**
 * Part 2 item button. +1 action, once per phase. Returns a dry line or ''.
 */
export function drinkCoffee(state) {
  const phase = phaseKey(state);
  if (state.flags?.coffeePhase === phase) return 'The coffee already did its job this phase.';
  if (stashCount(state, 'coffee') < 1) return 'No coffee. Tina would say "Fine."';
  spendStash(state, 'coffee', 1);
  state.flags.coffeePhase = phase;
  state.actionsLeft = (state.actionsLeft || 0) + CONFIG.ITEMS.coffeeAction;
  return 'You can see sounds now. Productive.';
}

/** Part 3 reads the rates. This does not roll a death. Tina and Biscuit are not in the list. */
export function lossCandidates() {
  return ['larry', 'kowalski', 'dale', 'kevin'];
}

export function soloOdds(state, id) {
  const phase = phaseKey(state);
  let loss = CONFIG.CREW.soloLoss[phase] ?? 0;
  if (id === 'kevin') loss *= CONFIG.CREW.soloKevinMul;
  if (id === 'tina') loss = CONFIG.CREW.soloTinaLoss;
  if (person(state, id)?.laidUp > 0) loss *= CONFIG.CREW.soloLaidUpMul;
  const haul = id === 'kevin' ? CONFIG.CREW.soloKevinHaul : CONFIG.CREW.soloHaul;
  return { haul, loss };
}
