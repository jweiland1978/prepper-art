import { CONFIG, countdownPhrase, daysLeft, phaseForDay, phaseInfo } from './config.js?v=4';
import { EVENTS, eventById } from './data/events.js?v=4';
import { NIGHT_EVENTS } from './data/night.js?v=4';
import { GREETINGS, JOKES, RUMORS, SIGNOFFS, rumorById } from './data/radio.js?v=4';
import { zombieById, ZOMBIES } from './data/survival.js?v=4';
import {
  changeStat,
  nightlyUpkeep,
  roomLevel,
  syncDerived,
  touchState,
} from './state.js?v=4';

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

export function fillLine(text, state) {
  const left = daysLeft(state.day);
  const daysPhrase = left <= 0 ? 'Today' : left === 1 ? 'One day' : `${left} days`;
  return String(text)
    .replaceAll('{daysPhrase}', daysPhrase)
    .replaceAll('{days}', String(left))
    .replaceAll('{day}', String(state.day))
    .replaceAll('{name}', state.name || CONFIG.DEFAULT_NAME);
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

export function rememberRumor(state, rumor) {
  if (!state || !rumor?.text) return null;
  const found = state.rumors.find((entry) => entry.id === rumor.id);
  if (found) {
    found.count = (found.count || 1) + 1;
    return found;
  }
  const entry = { id: rumor.id, day: state.day, text: rumor.text, count: 1 };
  state.rumors.push(entry);
  return entry;
}

function rumorPool(phase) {
  const pool = RUMORS.filter((rumor) => phaseAllows(rumor, phase));
  return pool.length ? pool : RUMORS;
}

export function ensureMorning(state) {
  syncDerived(state);
  if (state.flags.scriptDay === state.day && state.flags.script) return state.flags.script;
  const phase = phaseForDay(state.day);
  const greetings = GREETINGS[phase] || GREETINGS.collapse;
  const greeting = fillLine(pickOne(greetings), state);
  const pool = rumorPool(phase);
  const unseen = pool.filter((rumor) => !state.rumors.some((entry) => entry.id === rumor.id));
  const rumor = pickOne(unseen.length ? unseen : pool);
  rememberRumor(state, rumor);
  const jokes = JOKES.filter((joke) => phaseAllows(joke, phase));
  const joke = (pickOne(jokes.length ? jokes : JOKES)).text;
  const heard = [greeting, rumor.text, joke].map((line) => degradeLine(line, phase));
  const script = { phase, lines: heard };
  state.flags.scriptDay = state.day;
  state.flags.script = script;
  state.lastBroadcast = heard.slice();
  return script;
}

export function pickSignoff(state) {
  const phase = phaseForDay(state.day);
  if (phase === 'calm' || phase === 'panic') return SIGNOFFS[0];
  const pool = SIGNOFFS.filter((_, index) => index !== 0);
  return degradeLine(fillLine(pickOne(pool) || SIGNOFFS[0], state), phase);
}

export function rollLoot(bias, phase) {
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
    const threat = tune.zombieStart + (day - 1) * tune.zombiePerDay;
    const base = { fight: 0.82, hide: 0.84, bargain: 0.52, run: 0.96 }[action] ?? 0.5;
    let chance = base - threat + (weapon[action] || 0);
    const boards = roomLevel(state, 'barricade');
    const brace = state.flags?.brace || 0;
    if (action === 'fight') chance += boards * tune.barricadeFight + brace * 0.04;
    if (action === 'hide') chance += boards * tune.barricadeHide + brace * 0.04 + tune.biscuitHide;
    if (action === 'run') chance += tune.biscuitRun;
    if (action === 'bargain') {
      const rich = state.stats.food >= 1 || state.stats.materials >= 1 || state.stats.medicine >= 1;
      chance += rich ? 0.2 : -0.16;
    }
    if (state.stats.health <= 3 && (action === 'fight' || action === 'run')) chance -= 0.08;
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
  if (pack.loot) Object.assign(deltas, rollLoot(pack.bias || event.bias, phase));
  STAT_KEYS.forEach((key) => {
    if (pack[key]) deltas[key] = (deltas[key] || 0) + pack[key];
  });
  if (pack.weapon) deltas.weapon = pack.weapon;
  if (pack.rumor) deltas.rumor = pack.rumor;
  return { text: pack.text || 'You do the thing.', deltas };
}

export function pickEvent(state, locationId) {
  const phase = phaseForDay(state.day);
  let pool = EVENTS.filter((event) => event.location === locationId && phaseAllows(event, phase));
  if (!pool.length) pool = EVENTS.filter((event) => event.location === locationId);
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
  const names = (state?.memorial || [])
    .map((name) => String(name))
    .filter((name) => name && name.toLowerCase() !== 'biscuit');
  if (!names.length) return 'Nobody yet. Keep it that way.';
  return names.join('\n');
}

function pickNight(state) {
  const phase = phaseForDay(state.day);
  const pool = NIGHT_EVENTS.filter((event) => phaseAllows(event, phase));
  return weightedPick(pool.length ? pool : NIGHT_EVENTS, phase);
}

export function buildNightReport(state) {
  if (state.flags.upkeepDay === state.day && state.flags.nightReport) return state.flags.nightReport;
  const phase = phaseForDay(state.day);
  const up = nightlyUpkeep(state);
  const foodBefore = state.stats.food;
  const waterBefore = state.stats.water;
  const biscuitCans = Math.max(0, up.food - CONFIG.UPKEEP_FOOD);
  state.biscuitBank = up.biscuitBank;
  const foodDelta = changeStat('food', -up.food);
  const waterDelta = changeStat('water', -up.water);
  if (up.healthLoss) changeStat('health', -up.healthLoss);
  const powered = roomLevel(state, 'generator') >= 1;
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
  if (powered) {
    changeStat('morale', CONFIG.GENERATOR_MORALE);
    lines.push('The generator keeps a bulb awake. It counts as comfort.');
  } else if (phase === 'collapse') {
    changeStat('morale', -CONFIG.COLLAPSE_UNPOWERED_MORALE);
    lines.push('No power in the collapse. The dark sits down next to you.');
  }
  const event = pickNight(state);
  let danger = null;
  if (event?.kind === 'danger') {
    danger = { face: event.face, text: event.text, bias: event.bias || ['materials'] };
    lines.push(event.text);
  } else if (event) {
    lines.push(event.text);
    if (event.deltas) applyDeltas(state, event.deltas);
  }
  const report = {
    lines,
    signoff: pickSignoff(state),
    danger,
    dangerResolved: !danger,
    dangerResult: '',
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
  const seen = state.flags.seenZombies || [];
  const fresh = ZOMBIES.filter((item) => !seen.includes(item.id));
  const pool = fresh.length ? fresh : ZOMBIES;
  const event = pool[Math.floor(Math.random() * pool.length)];
  state.flags.seenZombies = [...seen, event.id].slice(-12);
  return event;
}

/** One survival morning. Idempotent for the current bunker day, so a reload does not eat twice. */
export function beginSurvivalDay(state) {
  state.flags = state.flags || {};
  const day = state.survivalDay || 1;
  if (state.flags.survival?.day === day) return state.flags.survival;
  const up = nightlyUpkeep(state);
  const foodBefore = state.stats.food;
  const waterBefore = state.stats.water;
  const biscuitCans = Math.max(0, up.food - CONFIG.UPKEEP_FOOD);
  state.biscuitBank = up.biscuitBank;
  changeStat('food', -up.food);
  changeStat('water', -up.water);
  if (up.healthLoss) changeStat('health', -up.healthLoss);
  const lines = [`Bunker day ${day} of ${CONFIG.SURVIVAL_DAYS}. The surface is ash and opinions.`];
  lines.push(foodBefore <= 0 ? 'No food. You eat a memory of beans.' : 'You eat from the shelf.');
  lines.push(waterBefore <= 0 ? 'No water. You drink a thought and call it hydration.' : 'You drink. It tastes like a hose. Correct.');
  lines.push(biscuitCans
    ? 'Biscuit eats a whole can. Last half finally counted. He is fine.'
    : 'Biscuit eats half a can. He is fine.');
  if (up.healthLoss) lines.push('Empty stores charge your health. You remain in one piece.');
  if (roomLevel(state, 'generator') >= 1) {
    changeStat('morale', CONFIG.GENERATOR_MORALE);
    lines.push('The generator keeps one bulb awake. It counts as company.');
  }
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
  const event = zombieById(sheet.zombieId);
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
  if (Math.random() < 0.1 + (state.survivalDay || 1) * 0.025) {
    deltas.health = (deltas.health || 0) - 1;
    line += ' Something shuffles past the door. You leave with what you grabbed and a new respect for rakes.';
  }
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
  const points = Math.min(days, 40)
    + Math.min(food, 24)
    + rooms * 8
    + Math.round((weapon.fight || 0) * 40)
    + (guessed ? 24 : 0)
    + (win ? 20 : 0);
  let rank = 'Raccoon Food';
  if (points >= 100) rank = 'Certified Prepper';
  else if (points >= 70) rank = 'Basement Optimist';
  else if (points >= 40) rank = 'Canned Good Enthusiast';
  const card = {
    days,
    food,
    rooms,
    weapon: weapon.name,
    guessed,
    rank,
    points,
    win,
  };
  state.flags.scorecard = card;
  return card;
}

export function staticLevel(phase) {
  if (phase === 'panic') return 0.05;
  if (phase === 'collapse') return 0.09;
  if (phase === 'end') return 0.14;
  return 0.015;
}

export { countdownPhrase, phaseForDay, phaseInfo, roomLevel };
