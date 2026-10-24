import { CONFIG, phaseForDay } from './config.js?v=5';
import { NEIGHBORS } from './data/neighbors.js?v=5';
import { loseNeighbor } from './crew.js?v=5';
import { armHeist, forceHeistRun2, openHeist, presentLarryPanic } from './heist.js?v=5';
import { Game, changeStat, newRun, syncDerived, touchState } from './state.js?v=5';
import { Save } from './save.js?v=5';
import { addButton, addText } from './ui.js?v=5';

const MORALE_STEPS = [0, 1, 5, 8, 10];
const MAYHEM_IDS = ['works', 'hedge', 'biscuit', 'bunker', 'spectacular'];
const LOSS_IDS = ['larry', 'kowalski', 'dale', 'kevin'];

function stamp(state) {
  touchState();
  Save.write(state);
  return state;
}

/** Only the ?dev=1 buttons call these. Caps rise with the grant so the food actually stays. */
export function devSkip(state, day) {
  state.mode = 'prep';
  state.ending = null;
  state.day = day;
  state.survivalDay = 0;
  state.actionsLeft = CONFIG.ACTIONS_PER_DAY;
  state.phase = phaseForDay(day);
  state.flags = state.flags || {};
  delete state.flags.script;
  delete state.flags.scriptDay;
  delete state.flags.radioHeard;
  delete state.flags.bannerDay;
  delete state.flags.trip;
  delete state.flags.survival;
  delete state.flags.apocalypseSeen;
  delete state.flags.nightReport;
  delete state.flags.upkeepDay;
  delete state.flags.scorecard;
  delete state.flags.brace;
  delete state.flags.seenZombies;
  delete state.flags.barricadeReady;
  delete state.flags.downReason;
  syncDerived(state);
  touchState();
  Save.write(state);
  return state;
}

export function devGrant(state) {
  state.flags = state.flags || {};
  state.flags.devStock = (state.flags.devStock || 0) + 20;
  changeStat('food', 20);
  changeStat('water', 20);
  changeStat('materials', 20);
  changeStat('medicine', 20);
  changeStat('health', 20);
  changeStat('morale', 20);
  touchState();
  Save.write(state);
  return state;
}

export function devRockets(state) {
  if (!state) return state;
  state.stash = state.stash || {};
  state.stash.rockets = Math.min(99, (state.stash.rockets || 0) + 5);
  return stamp(state);
}

export function devCoat(state) {
  if (!state) return state;
  state.stash = state.stash || {};
  state.flags = state.flags || {};
  state.stash.coat = 1;
  state.flags.coatEver = true;
  state.flags.coatWorn = true;
  state.flags.coatRadio = true;
  state.flags.coatHow = state.flags.coatHow || 'dev';
  return stamp(state);
}

export function devGoods(state) {
  if (!state) return state;
  state.stash = state.stash || {};
  changeStat('food', 5);
  changeStat('water', 5);
  changeStat('materials', 5);
  changeStat('medicine', 5);
  Object.keys(CONFIG.TRADE.goods).forEach((key) => {
    if (key === 'food' || key === 'water' || key === 'materials' || key === 'medicine' || key === 'coat') return;
    state.stash[key] = Math.min(99, (state.stash[key] || 0) + 5);
  });
  return stamp(state);
}

export function devRecruit(state) {
  if (!state) return state;
  state.crew = state.crew || {};
  const buried = new Set((state.memorial || []).map((entry) => entry?.id || entry));
  NEIGHBORS.forEach((row) => {
    if (buried.has(row.id) || state.crew[row.id]) return;
    state.crew[row.id] = { health: CONFIG.CREW.healthMax, job: 'rest', laidUp: 0, zeroNights: 0 };
  });
  return stamp(state);
}

export function devMorale(state) {
  if (!state) return state;
  const index = MORALE_STEPS.indexOf(state.stats.morale);
  state.stats.morale = MORALE_STEPS[(index + 1) % MORALE_STEPS.length];
  return stamp(state);
}

export function devRespect(state) {
  if (!state) return state;
  state.flags = state.flags || {};
  const current = typeof state.flags.respectOverride === 'number' ? state.flags.respectOverride : -1;
  state.flags.respectOverride = (current + 1) % 6;
  return stamp(state);
}

export function devMayhem(state) {
  if (!state) return state;
  state.flags = state.flags || {};
  const index = MAYHEM_IDS.indexOf(state.flags.forceMayhem);
  state.flags.forceMayhem = MAYHEM_IDS[(index + 1) % MAYHEM_IDS.length];
  return stamp(state);
}

export function devCold(state) {
  if (!state) return state;
  state.flags = state.flags || {};
  state.flags.forceNight = 'cold-snap';
  return stamp(state);
}

/** Never Tina, never Biscuit. Bumps the day to 11 if the run is still early. */
export function devLoss(state) {
  if (!state) return '';
  state.crew = state.crew || {};
  const pool = LOSS_IDS.filter((id) => state.crew[id]);
  if (!pool.length) return '';
  if ((state.day || 1) < CONFIG.CREW.lossFromDay) {
    state.day = CONFIG.CREW.lossFromDay;
    state.phase = phaseForDay(state.day);
  }
  const id = pool[Math.floor(Math.random() * pool.length)];
  const line = loseNeighbor(state, id, { force: true });
  stamp(state);
  return line;
}

const DAYS = [10, 20, 29, 30];

const EXTRAS = [
  ['+5 ROCKETS', 'rockets'],
  ['MACKINAW', 'coat'],
  ['+5 GOODS', 'goods'],
  ['RECRUIT', 'recruit'],
  ['MORALE', 'morale'],
  ['RESPECT', 'respect'],
  ['DAY 21', 'day21'],
  ['MAYHEM', 'mayhem'],
  ['LOSS', 'loss'],
  ['COLD', 'cold'],
  ['HEIST', 'heist'],
  ['HEIST2', 'heist2'],
  ['TRAP', 'trap'],
  ['DOUGIE', 'dougie'],
  ['LARRY PANIC', 'larry'],
  ['SEARCH', 'search'],
];

function runExtra(kind, state, onSkip) {
  if (kind === 'day21') {
    onSkip?.(21);
    return;
  }
  if (!state) return;
  if (kind === 'rockets') devRockets(state);
  else if (kind === 'coat') devCoat(state);
  else if (kind === 'goods') devGoods(state);
  else if (kind === 'recruit') devRecruit(state);
  else if (kind === 'morale') devMorale(state);
  else if (kind === 'respect') devRespect(state);
  else if (kind === 'mayhem') devMayhem(state);
  else if (kind === 'loss') devLoss(state);
  else if (kind === 'cold') devCold(state);
}

function extraButtons(scene, y, onAct) {
  return EXTRAS.map((item, index) => addButton(
    scene,
    180 + (index % 5) * 150,
    y + Math.floor(index / 5) * 48,
    item[0],
    () => onAct(item[1]),
    { w: item[0].length > 10 ? 148 : 140, h: 40, fontSize: item[0].length > 10 ? '12px' : '14px', depth: 80 },
  ));
}

function devButtons(scene, y, x0, onSkip, onGrant) {
  const nodes = [];
  DAYS.forEach((day, index) => {
    nodes.push(addButton(scene, x0 + index * 132, y, `DAY ${day}`, () => onSkip(day), {
      w: 122, h: 40, fontSize: '16px', depth: 80,
    }));
  });
  nodes.push(addButton(scene, x0 + DAYS.length * 132, y, '+20 EACH', () => onGrant(), {
    w: 122, h: 40, fontSize: '16px', primary: true, depth: 80,
  }));
  return nodes;
}

/** Hidden unless the URL has ?dev=1. */
export function mountDevTools(scene, opts = {}) {
  if (!Game.dev) return null;
  const y = opts.y ?? 618;
  if (opts.mode === 'row') {
    const label = addText(scene, 150, y, 'DEV', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '16px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(80);
    const nodes = devButtons(scene, y, 250, opts.onSkip, opts.onGrant);
    return { label, nodes };
  }

  let panel = null;
  const close = () => {
    panel?.destroy();
    panel = null;
    Game.hudLock = false;
  };
  const open = () => {
    opts.onOpen?.();
    close();
    Game.hudLock = true;
    panel = scene.add.container(0, 0).setDepth(60);
    const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.28).setInteractive();
    blocker.on('pointerup', close);
    panel.add(blocker);
    panel.add(addText(scene, 150, y, 'DEV', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '16px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }));
    devButtons(scene, y, 250, (day) => {
      close();
      opts.onSkip?.(day);
    }, () => {
      close();
      opts.onGrant?.();
    }).forEach((node) => panel.add(node));
    extraButtons(scene, y - 216, (kind) => {
      if (kind === 'day21') {
        close();
        opts.onSkip?.(21);
        return;
      }
      if (kind === 'heist') {
        close();
        if (Game.state) openHeist(scene, { dev: true });
        return;
      }
      if (kind === 'heist2') {
        close();
        if (Game.state) {
          forceHeistRun2(Game.state);
          openHeist(scene, { dev: true });
        }
        return;
      }
      if (kind === 'larry') {
        close();
        if (Game.state) presentLarryPanic(scene, { force: true });
        return;
      }
      if (kind === 'trap' || kind === 'dougie' || kind === 'search') {
        if (Game.state) armHeist(kind);
        return;
      }
      runExtra(kind, Game.state);
    }).forEach((node) => panel.add(node));
  };
  addButton(scene, 78, 688, 'DEV', open, { w: 88, h: 36, fontSize: '16px', depth: 70 });
  return { open, close };
}

export function devBootRun(day) {
  const state = newRun('Neighbor');
  return devSkip(state, day);
}
