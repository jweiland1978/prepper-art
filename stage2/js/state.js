import { CONFIG, phaseForDay } from './config.js?v=4';
import { NEIGHBORS } from './data/neighbors.js?v=4';

export class Emitter {
  constructor() {
    this.map = new Map();
  }

  on(event, fn) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this.map.get(event)?.delete(fn);
  }

  emit(event, payload) {
    const set = this.map.get(event);
    if (!set) return;
    [...set].forEach((fn) => fn(payload));
  }
}

export const bus = new Emitter();

function makeSlots() {
  const slots = [];
  let id = 0;
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      slots.push({ id: id++, row, col, dug: false, room: null, level: 0 });
    }
  }
  return slots;
}

export function emptyStash() {
  return {
    tinfoil: 0, battery: 0, coffee: 0, snacks: 0, rockets: 0,
    coat: 0, gas: 0, cigarettes: 0, ammo: 0, tp: 0, beer: 0,
  };
}

export function cleanName(raw) {
  const cleaned = String(raw || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, CONFIG.NAME_MAX);
  return cleaned || CONFIG.DEFAULT_NAME;
}

export function createState(name) {
  const start = CONFIG.START;
  return {
    version: CONFIG.SAVE_VERSION,
    name: cleanName(name),
    finished: false,
    day: 1,
    phase: 'calm',
    mode: 'prep',
    survivalDay: 0,
    actionsLeft: CONFIG.ACTIONS_PER_DAY,
    introSeen: false,
    stats: {
      food: start.food,
      water: start.water,
      health: start.health,
      morale: start.morale,
      materials: start.materials,
      medicine: start.medicine,
    },
    weapon: start.weapon,
    ownedWeapons: [start.weapon],
    // Stage 2: neighbors who die are remembered here. Biscuit is never added.
    memorial: [],
    crew: {},
    stash: emptyStash(),
    violations: 0,
    slots: makeSlots(),
    entry: true,
    biscuitBank: 0,
    rumors: [],
    seenEvents: [],
    lastBroadcast: [],
    garyVisited: false,
    flags: {},
    ending: null,
    lastScene: 'Radio',
  };
}

export const Game = {
  state: null,
  settings: null,
  saveStatus: { empty: true },
  hudLock: false,
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function roomLevel(state, roomId) {
  if (!state) return 0;
  let best = 0;
  for (const slot of state.slots) {
    if (slot.room === roomId && slot.level > best) best = slot.level;
  }
  return best;
}

function stockBonus(state) {
  const extra = state?.flags?.devStock;
  return typeof extra === 'number' && extra > 0 ? extra : 0;
}

export function foodCap(state) {
  const level = roomLevel(state, 'pantry');
  const base = !level ? CONFIG.FOOD_CAP_BASE : CONFIG.FOOD_CAP[level - 1];
  return base + stockBonus(state);
}

export function waterCap(state) {
  const level = roomLevel(state, 'water');
  const base = !level ? CONFIG.WATER_CAP_BASE : CONFIG.WATER_CAP[level - 1];
  return base + stockBonus(state);
}

export function formatStat(key, value) {
  if (key === 'food' && Math.abs(value - Math.round(value)) > 0.05) return value.toFixed(1);
  return String(Math.round(value));
}

function neighborMouths(state) {
  return NEIGHBORS.filter((row) => state?.crew?.[row.id]).length;
}

function kowalskiCooking(state) {
  const row = state?.crew?.kowalski;
  return !!(row && !(row.laidUp > 0));
}

/** Whole cans eaten tonight, after Biscuit's half-can banks up. Neighbors eat too. Does not mutate. */
export function nightlyUpkeep(state) {
  const bank = (state.biscuitBank || 0) + CONFIG.BISCUIT_FOOD;
  const biscuitCans = Math.floor(bank);
  const mouths = neighborMouths(state);
  let food = CONFIG.UPKEEP_FOOD + mouths * CONFIG.CREW.upkeepFood + biscuitCans;
  if (kowalskiCooking(state) && food > 0) {
    food = Math.max(CONFIG.CREW.foodMin, Math.floor(food * CONFIG.CREW.foodDiscount));
  }
  const foodEmpty = state.stats.food <= 0;
  const waterEmpty = state.stats.water <= 0;
  let healthLoss = 0;
  if (foodEmpty && waterEmpty) healthLoss = CONFIG.HEALTH_LOSS_BOTH_EMPTY;
  else if (foodEmpty || waterEmpty) healthLoss = CONFIG.HEALTH_LOSS_EMPTY;
  return {
    food,
    water: CONFIG.UPKEEP_WATER + mouths * CONFIG.CREW.upkeepWater,
    biscuitBank: bank - biscuitCans,
    biscuitCans,
    mouths,
    healthLoss,
  };
}

export function changeStat(key, delta) {
  const state = Game.state;
  if (!state || typeof state.stats[key] !== 'number') return 0;
  const from = state.stats[key];
  let to = from + delta;
  if (key === 'food') to = clamp(to, 0, foodCap(state));
  else if (key === 'water') to = clamp(to, 0, waterCap(state));
  else if (key === 'health') to = clamp(to, 0, CONFIG.HEALTH_MAX);
  else if (key === 'morale') to = clamp(to, 0, CONFIG.MORALE_MAX);
  else to = Math.max(0, to);
  state.stats[key] = to;
  const applied = to - from;
  if (applied !== 0) bus.emit('stat', { key, from, to, delta: applied });
  return applied;
}

export function syncDerived(state) {
  state.phase = state.mode === 'prep' ? phaseForDay(state.day) : state.phase;
  state.stats.food = clamp(state.stats.food, 0, foodCap(state));
  state.stats.water = clamp(state.stats.water, 0, waterCap(state));
  state.stats.health = clamp(state.stats.health, 0, CONFIG.HEALTH_MAX);
  state.stats.morale = clamp(state.stats.morale, 0, CONFIG.MORALE_MAX);
  return state;
}

export function newRun(name) {
  Game.state = createState(name);
  bus.emit('state', Game.state);
  return Game.state;
}

export function replaceState(state) {
  Game.state = syncDerived(state);
  bus.emit('state', Game.state);
  return Game.state;
}

export function touchState() {
  if (Game.state) bus.emit('state', Game.state);
}
