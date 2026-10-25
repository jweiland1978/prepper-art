import { CONFIG } from './config.js?v=4';
import { LARRY_STAMP } from './data/radio.js?v=4';
import { NEIGHBORS } from './data/neighbors.js?v=4';
import { apocalypseIds, apocalypseOf } from './rumors.js?v=4';
import { Game } from './state.js?v=4';
import { repairRunAch } from './achievements.js?v=4';
import { repairPerk } from './unlocks.js?v=4';

const DEFAULT_SETTINGS = {
  music: 0.7,
  sfx: 0.85,
  voiceBlips: true,
  reduceEffects: false,
  textSpeed: 1,
  debugCoords: false,
};

function warn(message, error) {
  console.warn(`[PREPPER] ${message}`, error || '');
}

export function loadSettings() {
  try {
    let raw = localStorage.getItem(CONFIG.SETTINGS_KEY);
    let legacy = false;
    if (!raw) {
      raw = localStorage.getItem(CONFIG.LEGACY_SETTINGS_KEY);
      legacy = !!raw;
    }
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    const unit = (v, d) => (Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : d);
    merged.music = unit(merged.music, DEFAULT_SETTINGS.music);
    merged.sfx = unit(merged.sfx, DEFAULT_SETTINGS.sfx);
    merged.textSpeed = Number.isFinite(Number(merged.textSpeed)) && Number(merged.textSpeed) > 0 ? Number(merged.textSpeed) : DEFAULT_SETTINGS.textSpeed;
    merged.voiceBlips = merged.voiceBlips !== false;
    merged.reduceEffects = !!merged.reduceEffects;
    merged.debugCoords = !!merged.debugCoords;
    if (legacy) writeSettings(merged);
    return merged;
  } catch (error) {
    warn('Settings could not be read.', error);
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings) {
  try {
    localStorage.setItem(CONFIG.SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    warn('Settings could not be written.', error);
    return false;
  }
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function num(value, fallback, min = -Infinity, max = Infinity) {
  if (!finiteNumber(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

const STASH_DEFAULT = {
  tinfoil: 0, battery: 0, coffee: 0, snacks: 0, rockets: 0,
  coat: 0, gas: 0, cigarettes: 0, ammo: 0, tp: 0, beer: 0,
};

function emptySlots() {
  const slots = [];
  let id = 0;
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      slots.push({ id: id++, row, col, dug: false, room: null, level: 0 });
    }
  }
  return slots;
}

function repairSlots(raw) {
  const fresh = emptySlots();
  if (!Array.isArray(raw)) return fresh;
  fresh.forEach((slot, index) => {
    const incoming = raw[index];
    if (!incoming || typeof incoming !== 'object') return;
    slot.dug = !!incoming.dug;
    const room = typeof incoming.room === 'string' ? incoming.room : null;
    slot.room = room && CONFIG.ROOMS[room] ? room : null;
    slot.level = slot.room ? num(incoming.level, 1, 1, 3) : 0;
    if (!slot.dug) {
      slot.room = null;
      slot.level = 0;
    }
  });
  return fresh;
}

function repairCrew(raw) {
  const crew = {};
  if (!raw || typeof raw !== 'object') return crew;
  NEIGHBORS.forEach((row) => {
    const incoming = raw[row.id];
    if (!incoming || typeof incoming !== 'object') return;
    const jobs = ['rest', 'guard', 'work', 'along'];
    crew[row.id] = {
      health: num(incoming.health, CONFIG.CREW.healthStart, 0, CONFIG.CREW.healthMax),
      job: jobs.includes(incoming.job) ? incoming.job : 'rest',
      laidUp: num(incoming.laidUp, 0, 0, 6),
      zeroNights: num(incoming.zeroNights, 0, 0, 30),
    };
  });
  return crew;
}

function repairRumors(raw, truth) {
  if (!Array.isArray(raw)) return [];
  const ids = new Set(apocalypseIds());
  const out = [];
  raw.forEach((entry) => {
    if (!entry || typeof entry !== 'object' || typeof entry.text !== 'string' || !entry.text.trim()) return;
    const kind = ids.has(entry.kind) ? entry.kind : '';
    const lie = !!kind && kind !== truth;
    out.push({
      id: typeof entry.id === 'string' && entry.id ? entry.id : 'note',
      day: num(entry.day, 1, 1, 40),
      text: entry.text.trim(),
      count: num(entry.count, 1, 1, 99),
      kind,
      lie,
      morning: !!entry.morning,
      stamp: entry.stamp && lie ? LARRY_STAMP : '',
      // Part B Ham Shack tag. CHECKED only ever sits on a true rumor.
      ham: entry.ham === 'checked' && !lie && kind ? 'checked' : (entry.ham === 'static' || entry.ham === 'checked' ? 'static' : ''),
    });
  });
  return out.slice(0, 80);
}

function repairPlan(raw, truth) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.days)) return null;
  if (raw.apocalypse !== truth || raw.days.length !== CONFIG.PREP_DAYS) return null;
  const ids = new Set(apocalypseIds());
  const days = [];
  for (let index = 0; index < raw.days.length; index += 1) {
    const row = raw.days[index];
    if (!row || typeof row !== 'object') return null;
    const kind = ids.has(row.kind) ? row.kind : truth;
    days.push({
      day: index + 1,
      kind,
      lie: kind !== truth,
      id: typeof row.id === 'string' ? row.id : '',
      locked: !!row.locked,
    });
  }
  return { apocalypse: truth, days };
}

function repairStash(raw) {
  const stash = { ...STASH_DEFAULT };
  if (!raw || typeof raw !== 'object') return stash;
  Object.keys(STASH_DEFAULT).forEach((key) => {
    const cap = key === 'coat' ? 1 : 99;
    stash[key] = num(raw[key], 0, 0, cap);
  });
  return stash;
}

const MEMORIAL_PEOPLE = {
  larry: { id: 'larry', name: 'Larry', epitaph: 'He was right about one thing. He never said which.' },
  kowalski: { id: 'kowalski', name: 'Mrs. Kowalski', epitaph: 'The casserole is still on the top shelf.' },
  'mrs. kowalski': { id: 'kowalski', name: 'Mrs. Kowalski', epitaph: 'The casserole is still on the top shelf.' },
  'mrs kowalski': { id: 'kowalski', name: 'Mrs. Kowalski', epitaph: 'The casserole is still on the top shelf.' },
  dale: { id: 'dale', name: 'Dale', epitaph: 'The last notice was addressed to everyone, with love.' },
  kevin: { id: 'kevin', name: 'Kevin', epitaph: 'The stream had more viewers than ever.' },
};

function memorialPerson(entry) {
  if (entry == null) return null;
  const raw = typeof entry === 'string' ? entry : (entry.id || entry.name || '');
  const key = String(raw).trim().toLowerCase();
  return MEMORIAL_PEOPLE[key] || null;
}

/** Stage 1 stored names as strings. Plaques are {id, name, day, epitaph}. Biscuit and Tina never stay. */
function repairMemorial(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  raw.forEach((entry) => {
    const known = memorialPerson(entry);
    if (!known || seen.has(known.id)) return;
    const day = typeof entry === 'object' ? num(entry.day, 11, 1, 40) : 11;
    const epitaph = typeof entry === 'object' && typeof entry.epitaph === 'string' && entry.epitaph.trim()
      ? entry.epitaph.trim()
      : known.epitaph;
    out.push({ id: known.id, name: known.name, day, epitaph });
    seen.add(known.id);
  });
  return out.slice(0, 4);
}

/**
 * Version 1 and 2 are Stage 1 and Stage 2. Stage 3 writes 3. Stage 4 writes 4.
 * An older in-progress save plays as zombies, run 1, with an empty rumor log.
 * A bad field falls back. The rest of the save stays.
 */
export function migrate(data) {
  if (!data || typeof data !== 'object') return null;
  const version = finiteNumber(data.version) ? data.version : 1;
  if (version > CONFIG.SAVE_VERSION) return null;
  const looks = data.stats || finiteNumber(data.day) || data.name || data.slots;
  if (!looks) return null;
  data.version = CONFIG.SAVE_VERSION;
  data.name = typeof data.name === 'string' && data.name.trim() ? data.name : CONFIG.DEFAULT_NAME;
  data.day = num(data.day, 1, 1, 40);
  data.stats = data.stats && typeof data.stats === 'object' ? data.stats : {};
  const start = CONFIG.START;
  data.stats.food = num(data.stats.food, start.food, 0, 999);
  data.stats.water = num(data.stats.water, start.water, 0, 999);
  data.stats.health = num(data.stats.health, start.health, 0, CONFIG.HEALTH_MAX);
  data.stats.morale = num(data.stats.morale, start.morale, 0, CONFIG.MORALE_MAX);
  data.stats.materials = num(data.stats.materials, start.materials, 0, 999);
  data.stats.medicine = num(data.stats.medicine, start.medicine, 0, 999);
  data.slots = repairSlots(data.slots);
  data.rumors = Array.isArray(data.rumors) ? data.rumors : [];
  data.seenEvents = Array.isArray(data.seenEvents) ? data.seenEvents.filter((id) => typeof id === 'string') : [];
  data.lastBroadcast = Array.isArray(data.lastBroadcast) ? data.lastBroadcast : [];
  data.memorial = repairMemorial(data.memorial);
  data.ownedWeapons = Array.isArray(data.ownedWeapons) ? data.ownedWeapons : [CONFIG.START.weapon];
  data.flags = data.flags && typeof data.flags === 'object' ? data.flags : {};
  data.weapon = typeof data.weapon === 'string' ? data.weapon : CONFIG.START.weapon;
  data.mode = data.mode === 'survival' ? 'survival' : 'prep';
  data.phase = typeof data.phase === 'string' ? data.phase : 'calm';
  data.actionsLeft = num(data.actionsLeft, CONFIG.ACTIONS_PER_DAY, 0, 6);
  data.survivalDay = num(data.survivalDay, 0, 0, CONFIG.SURVIVAL_DAYS);
  data.biscuitBank = num(data.biscuitBank, 0, 0, 2);
  data.lastScene = typeof data.lastScene === 'string' ? data.lastScene : 'Radio';
  data.introSeen = !!data.introSeen;
  data.garyVisited = !!data.garyVisited;
  data.entry = data.entry !== false;
  data.crew = repairCrew(data.crew);
  data.stash = repairStash(data.stash);
  if (!Array.isArray(data.notices)) {
    const count = num(data.violations, 0, 0, 99);
    data.notices = [];
    for (let i = 0; i < count; i += 1) {
      data.notices.push({ id: 'hole', rule: 'Section 4(b): Excessive Hole.', day: 1 });
    }
  } else {
    data.notices = data.notices
      .filter((notice) => notice && typeof notice.rule === 'string' && notice.rule.trim())
      .slice(0, 99)
      .map((notice) => ({
        id: typeof notice.id === 'string' ? notice.id : 'hole',
        rule: notice.rule.trim(),
        day: num(notice.day, 1, 1, 40),
      }));
  }
  data.violations = data.notices.length;
  if ((data.stash.coat || 0) > 0) {
    data.flags.coatEver = true;
    if (data.flags.coatWorn == null) data.flags.coatWorn = true;
  }
  const hasWater = data.slots.some((slot) => slot.room === 'water');
  if (hasWater && !finiteNumber(data.flags.waterDay) && data.day <= 10) data.flags.waterDay = data.day;
  const ended = data.lastScene === 'Ending' || ['win', 'loss', 'early', 'tower-break', 'tower-voice'].includes(data.ending);
  data.finished = !!(data.finished || ended);
  data.ending = data.finished ? (data.ending || 'loss') : (data.ending || null);
  data.flags.noticesEver = num(data.flags.noticesEver, data.notices.length, 0, 999);
  data.flags.trades = num(data.flags.trades, 0, 0, 999);
  data.flags.rocketsFired = num(data.flags.rocketsFired, 0, 0, 999);
  data.flags.garyFair = num(data.flags.garyFair, 0, 0, 99);
  data.flags.moraleHighNights = num(data.flags.moraleHighNights, 0, 0, 99);
  if (data.flags.respectOverride != null && data.flags.respectOverride !== '') {
    data.flags.respectOverride = num(data.flags.respectOverride, 0, 0, 5);
  }
  if (!data.flags.tips || typeof data.flags.tips !== 'object' || Array.isArray(data.flags.tips)) {
    data.flags.tips = {};
  }
  const lossIds = ['larry', 'kowalski', 'dale', 'kevin'];
  const mayhems = ['works', 'hedge', 'biscuit', 'bunker', 'spectacular'];
  if (data.flags.forceMayhem && !mayhems.includes(data.flags.forceMayhem)) data.flags.forceMayhem = '';
  if (typeof data.flags.forceNight !== 'string') data.flags.forceNight = '';
  if (data.flags.freshLoss && (!lossIds.includes(data.flags.freshLoss.id) || data.crew[data.flags.freshLoss.id])) {
    data.flags.freshLoss = null;
  }
  if (data.flags.solo) {
    const solo = data.flags.solo;
    const soloOk = solo && typeof solo.location === 'string' && solo.day === data.day
      && (lossIds.includes(solo.id) || solo.id === 'tina' || solo.id === 'gary');
    if (!soloOk) data.flags.solo = null;
  }
  data.flags.heistsDone = num(data.flags.heistsDone, 0, 0, 2);
  data.flags.lastHeistDay = num(data.flags.lastHeistDay, 0, 0, 40);
  data.flags.heistCaught = !!data.flags.heistCaught;
  data.flags.heistCaughtRun = num(data.flags.heistCaughtRun, 0, 0, 2);
  data.flags.heistSearched = num(data.flags.heistSearched, 0, 0, 4);
  data.flags.heistHeat = num(data.flags.heistHeat, 0, 0, 4);
  data.flags.heistBragsHeard = num(data.flags.heistBragsHeard, 0, 0, 8);
  data.flags.heistOffHeard = num(data.flags.heistOffHeard, 0, 0, 8);
  data.flags.heistTauntsHeard = num(data.flags.heistTauntsHeard, 0, 0, 8);
  data.flags.heistAsked = num(data.flags.heistAsked, 0, 0, 40);
  data.flags.heistLarrySeen = num(data.flags.heistLarrySeen, 0, 0, 2);
  data.flags.heistForceTrap = !!data.flags.heistForceTrap;
  data.flags.heistForceDougie = !!data.flags.heistForceDougie;
  data.flags.heistForceSearch = !!data.flags.heistForceSearch;
  if (typeof data.flags.heistSearchNote !== 'string') data.flags.heistSearchNote = '';
  if (!data.flags.offers || typeof data.flags.offers !== 'object') data.flags.offers = {};
  if (data.flags.road && (typeof data.flags.road.id !== 'string' || !finiteNumber(data.flags.road.untilDay))) {
    data.flags.road = null;
  }
  if (version < 3) {
    data.apocalypse = 'zombies';
    data.runNumber = 1;
    data.guess = '';
    data.rumors = [];
    data.rumorPlan = null;
    data.flags.fromStage2 = true;
  } else {
    data.apocalypse = apocalypseOf(data);
    data.runNumber = num(data.runNumber, 1, 1, 9999);
    data.guess = apocalypseIds().includes(data.guess) ? data.guess : '';
    data.rumors = repairRumors(data.rumors, apocalypseOf(data));
    data.rumorPlan = repairPlan(data.rumorPlan, apocalypseOf(data));
  }
  // Stage 4: per-run achievement counters. A Stage 3 save gets fresh ones.
  data.ach = repairRunAch(version < 4 ? null : data.ach, data);
  data.perk = repairPerk(data.perk);
  return data;
}

export function normalizeSave(data) {
  return migrate(data);
}

export function peekSave() {
  try {
    let raw = localStorage.getItem(CONFIG.SAVE_KEY);
    let legacy = false;
    if (!raw) {
      raw = localStorage.getItem(CONFIG.LEGACY_SAVE_KEY);
      legacy = !!raw;
    }
    if (!raw) return { empty: true };
    const parsed = JSON.parse(raw);
    const data = normalizeSave(parsed);
    if (!data) return { corrupt: true };
    // Copy a Stage 3 save into the stage 4 key once. The prepper_s3_* keys stay put.
    if (legacy) writeSave(data);
    return { ok: true, data };
  } catch (error) {
    warn('Save could not be read.', error);
    return { corrupt: true };
  }
}

export function writeSave(state) {
  if (!state) return false;
  try {
    const copy = JSON.parse(JSON.stringify(state));
    copy.version = CONFIG.SAVE_VERSION;
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(copy));
    Game.saveStatus = { ok: true, data: copy };
    return true;
  } catch (error) {
    warn('Could not write save.', error);
    return false;
  }
}

export function deleteSave() {
  try {
    localStorage.removeItem(CONFIG.SAVE_KEY);
  } catch (error) {
    warn('Could not delete save.', error);
  }
  Game.saveStatus = { empty: true };
}

export function bootSave() {
  Game.settings = loadSettings();
  Game.saveStatus = peekSave();
  return Game.settings;
}

export const Save = {
  boot: bootSave,
  loadSettings,
  writeSettings,
  peek: peekSave,
  write: writeSave,
  deleteSave,
};
