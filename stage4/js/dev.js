import { CONFIG, phaseForDay } from './config.js?v=4';
import { NEIGHBORS } from './data/neighbors.js?v=4';
import { cotCount, loseNeighbor, recruited } from './crew.js?v=4';
import { armHeist, forceHeistRun2, openHeist, presentLarryPanic } from './heist.js?v=4';
import { beginSurvivalDay, buildScore } from './logic.js?v=4';
import { apocalypseName, apocalypseOf, cycleApocalypse, rumorPlanText } from './rumors.js?v=4';
import { Game, changeStat, newRun, syncDerived, touchState } from './state.js?v=4';
import { Save } from './save.js?v=4';
import { Audio } from './audio.js?v=4';
import { addButton, addText } from './ui.js?v=4';
import { PERK_IDS, perkById } from './data/unlocks.js?v=4';
import { hasUnlock } from './unlocks.js?v=4';
import { readMeta, writeMeta } from './meta.js?v=4';
import { chooseTowerEnding, TOWER_OPEN_DAY } from './tower.js?v=4';

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
  if (!state) return 'No run.';
  state.crew = state.crew || {};
  const buried = new Set((state.memorial || []).map((entry) => entry?.id || entry));
  const here = recruited(state).length;
  const free = Math.max(0, Math.min(CONFIG.CREW.maxNeighbors - here, cotCount(state) - here));
  // Gary only joins at his gate, and only once the track unlocks him.
  const waiting = NEIGHBORS.filter((row) => !buried.has(row.id) && !state.crew[row.id]
    && (!row.pinOnly || hasUnlock('gary')));
  if (!waiting.length) return 'Nobody left to recruit.';
  if (free <= 0) {
    if (here >= CONFIG.CREW.maxNeighbors) return 'The bunker is a full house.';
    return 'No free cots.';
  }
  const take = waiting.slice(0, free);
  take.forEach((row) => {
    state.crew[row.id] = { health: CONFIG.CREW.healthMax, job: 'rest', laidUp: 0, zeroNights: 0 };
  });
  stamp(state);
  const names = take.map((row) => row.name).join(', ');
  const left = Math.max(0, cotCount(state) - recruited(state).length);
  return `Recruited ${names}. Cots free ${left}.`;
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
  ['FORCE APOC', 'apoc'],
  ['SHOW APOC', 'show-apoc'],
  ['RUMOR DUMP', 'dump'],
  ['JUMP TO DAY 30', 'jump30'],
  ['SURVIVAL DAY +1', 'surv+'],
  ['WIN NOW', 'win'],
  ['LOSE NOW', 'lose'],
  ['PERK', 'perk'],
  // Part B
  ['NEXT CLUE', 'clue'],
  ['OPEN TOWER', 'tower'],
  ['TOWER: BREAK', 'tower-break'],
  ['TOWER: VOICE', 'tower-voice'],
];

const GAMEPLAY = ['Radio', 'Map', 'Scavenge', 'Bunker', 'NightSummary', 'Survival', 'Apocalypse', 'Tower', 'Ending'];

function devGrantUnlocks(ids) {
  const meta = readMeta();
  ids.forEach((id) => {
    if (!meta.unlocks.includes(id)) meta.unlocks.push(id);
    // Dev grants count as seen, so no card pops mid-test (the tower card is tested on its own).
    if (!meta.announced.includes(id)) meta.announced.push(id);
  });
  writeMeta(meta);
}

/** Dev NEXT CLUE: grants the next clue and makes today's broadcast play it. Returns a note. */
export function devNextClue(state) {
  const next = ['clue:1', 'clue:2', 'clue:3'].find((id) => !hasUnlock(id));
  if (next) devGrantUnlocks([next]);
  if (!state) return next ? `Granted ${next}.` : 'All three clues are already in.';
  state.flags = state.flags || {};
  state.flags.clueForceDay = state.day;
  delete state.flags.script;
  delete state.flags.scriptDay;
  delete state.flags.radioHeard;
  stamp(state);
  return next ? `Granted ${next}. Today's broadcast has it.` : 'All three clues are in. Today replays the last one.';
}

/** Dev OPEN TOWER: the clue track and the tower, and today is at least Day 20 with actions left. */
export function devOpenTower(state) {
  devGrantUnlocks(['clue:1', 'clue:2', 'clue:3', 'tower']);
  if (!state) return 'Tower owned. Start a run.';
  if (state.mode !== 'prep' || (state.day || 1) < TOWER_OPEN_DAY || state.day >= CONFIG.PREP_DAYS) {
    devSkip(state, TOWER_OPEN_DAY);
  }
  state.actionsLeft = Math.max(1, state.actionsLeft || 0);
  delete state.flags.towerStep;
  delete state.flags.towerChoice;
  delete state.flags.towerRecorded;
  stamp(state);
  return 'Tower open. It is on the map.';
}

/** Dev TOWER ENDING: straight to the chosen tower ending (recorded in meta like the real one). */
export function devTowerEnding(state, choice) {
  devGrantUnlocks(['clue:1', 'clue:2', 'clue:3', 'tower']);
  if (!state) return null;
  state.mode = 'prep';
  state.finished = false;
  state.flags = state.flags || {};
  delete state.flags.scorecard;
  delete state.flags.towerRecorded;
  chooseTowerEnding(state, choice);
  buildScore(state);
  return stamp(state);
}

function stopLoops() {
  Audio.stopSirens();
  Audio.stopRain();
  Audio.stopSnow();
  Audio.stopStatic();
  Audio.stopJingle();
  Audio.stopSponsor();
  Audio.stopJukebox();
  Audio.stopMurmur();
  Audio.stopGenerator();
}

function jumpGameplay(hud, key) {
  stopLoops();
  const active = GAMEPLAY.find((name) => hud.scene.isActive(name));
  if (active) hud.scene.get(active).scene.start(key);
}

export function devJumpDay30(state) {
  if (!state) return state;
  devSkip(state, CONFIG.PREP_DAYS);
  state.flags.apocalypseSeen = false;
  return state;
}

export function devSurvivalDay(state) {
  if (!state) return state;
  state.flags = state.flags || {};
  if (state.mode !== 'survival') {
    state.mode = 'survival';
    state.day = CONFIG.PREP_DAYS;
    state.phase = 'end';
    state.ending = null;
    state.finished = false;
    state.survivalDay = 1;
    state.actionsLeft = 0;
    state.flags.apocalypseSeen = true;
    delete state.flags.script;
    delete state.flags.scriptDay;
    delete state.flags.radioHeard;
    delete state.flags.survival;
    delete state.flags.scorecard;
    beginSurvivalDay(state);
    return stamp(state);
  }
  if ((state.survivalDay || 1) >= CONFIG.SURVIVAL_DAYS) return state;
  state.survivalDay += 1;
  delete state.flags.survival;
  beginSurvivalDay(state);
  return stamp(state);
}

export function devWinNow(state) {
  if (!state) return state;
  state.mode = 'survival';
  state.day = CONFIG.PREP_DAYS;
  state.survivalDay = CONFIG.SURVIVAL_DAYS;
  state.ending = 'win';
  state.finished = false;
  state.flags = state.flags || {};
  state.flags.apocalypseSeen = true;
  delete state.flags.scorecard;
  buildScore(state);
  return stamp(state);
}

export function devLoseNow(state) {
  if (!state) return state;
  state.mode = 'survival';
  state.day = CONFIG.PREP_DAYS;
  state.survivalDay = Math.max(1, state.survivalDay || 1);
  state.ending = 'loss';
  state.finished = false;
  state.flags = state.flags || {};
  state.flags.apocalypseSeen = true;
  state.flags.downReason = state.flags.downReason || 'health';
  delete state.flags.scorecard;
  buildScore(state);
  return stamp(state);
}

function flash(scene, message) {
  console.log(`[PREPPER] ${message}`);
  if (!scene?.add) return;
  const text = addText(scene, 640, 120, message, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '20px',
    color: CONFIG.COLORS.orangeCss,
    originX: 0.5,
    originY: 0.5,
    align: 'center',
    wordWrap: { width: 980 },
  }).setDepth(120);
  scene.tweens?.add({
    targets: text,
    alpha: 0,
    delay: 2200,
    duration: 500,
    onComplete: () => text.destroy(),
  });
}

function runExtra(kind, state, onSkip) {
  if (kind === 'day21') {
    onSkip?.(21);
    return;
  }
  if (!state) return 'No run yet.';
  if (kind === 'rockets') devRockets(state);
  else if (kind === 'coat') devCoat(state);
  else if (kind === 'goods') devGoods(state);
  else if (kind === 'recruit') return devRecruit(state);
  else if (kind === 'morale') devMorale(state);
  else if (kind === 'respect') devRespect(state);
  else if (kind === 'mayhem') devMayhem(state);
  else if (kind === 'loss') return devLoss(state) || 'Nobody to lose.';
  else if (kind === 'cold') devCold(state);
  else if (kind === 'perk') return devCyclePerk(state);
  return '';
}

const EXTRA_COLS = 6;
const EXTRA_ROW = 46;

function extraButtons(scene, y, onAct) {
  return EXTRAS.map((item, index) => {
    const long = item[0].length > 12;
    const mid = item[0].length > 9;
    return addButton(
      scene,
      155 + (index % EXTRA_COLS) * 174,
      y + Math.floor(index / EXTRA_COLS) * EXTRA_ROW,
      item[0],
      () => onAct(item[1]),
      { w: long ? 168 : mid ? 162 : 140, h: 40, fontSize: long ? '11px' : mid ? '13px' : '14px', depth: 80 },
    );
  });
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
    extraButtons(scene, y - Math.ceil(EXTRAS.length / EXTRA_COLS) * EXTRA_ROW - 16, (kind) => {
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
        if (!Game.state) {
          flash(scene, 'No run yet.');
          return;
        }
        armHeist(kind);
        flash(scene, kind === 'trap' ? 'Trap armed.' : kind === 'dougie' ? 'Dougie armed.' : 'Search armed.');
        return;
      }
      if (kind === 'apoc' || kind === 'show-apoc' || kind === 'dump') {
        const state = Game.state;
        if (!state) {
          flash(scene, 'No run yet.');
          return;
        }
        if (kind === 'apoc') {
          const id = cycleApocalypse(state);
          stamp(state);
          flash(scene, `Forced: ${apocalypseName(id)}. Unheard mornings retuned.`);
          return;
        }
        if (kind === 'show-apoc') {
          flash(scene, `Apocalypse: ${apocalypseName(state)} (${apocalypseOf(state)}), run ${state.runNumber || '?'}.`);
          return;
        }
        console.log(`[PREPPER] Rumor plan\n${rumorPlanText(state)}`);
        flash(scene, 'Rumor plan printed to the console.');
        return;
      }
      if (kind === 'clue' || kind === 'tower' || kind === 'tower-break' || kind === 'tower-voice') {
        const state = Game.state;
        if (!state) {
          flash(scene, 'No run yet.');
          return;
        }
        close();
        if (kind === 'clue') {
          flash(scene, devNextClue(state));
          jumpGameplay(scene, 'Radio');
          return;
        }
        if (kind === 'tower') {
          flash(scene, devOpenTower(state));
          jumpGameplay(scene, 'Map');
          return;
        }
        devTowerEnding(state, kind === 'tower-break' ? 'break' : 'voice');
        jumpGameplay(scene, 'Ending');
        return;
      }
      if (kind === 'jump30' || kind === 'surv+' || kind === 'win' || kind === 'lose') {
        const state = Game.state;
        if (!state) {
          flash(scene, 'No run yet.');
          return;
        }
        if (kind === 'surv+' && state.mode === 'survival' && (state.survivalDay || 1) >= CONFIG.SURVIVAL_DAYS) {
          flash(scene, "That's ten.");
          return;
        }
        close();
        if (kind === 'jump30') {
          devJumpDay30(state);
          jumpGameplay(scene, 'Apocalypse');
          return;
        }
        if (kind === 'surv+') {
          devSurvivalDay(state);
          jumpGameplay(scene, 'Survival');
          return;
        }
        if (kind === 'win') devWinNow(state);
        else devLoseNow(state);
        jumpGameplay(scene, 'Ending');
        return;
      }
      const note = runExtra(kind, Game.state);
      if (typeof note === 'string' && note) flash(scene, note);
    }).forEach((node) => panel.add(node));
  };
  addButton(scene, 78, 688, 'DEV', open, { w: 88, h: 36, fontSize: '16px', depth: 70 });
  return { open, close };
}

export function devBootRun(day) {
  const state = newRun('Neighbor');
  return devSkip(state, day);
}

/** Dev PERK: cycles this run's perk (no perk -> each perk), resetting its one-shot flags. No stat change. */
export function devCyclePerk(state) {
  const order = ['', ...PERK_IDS];
  const next = order[(order.indexOf(state.perk || '') + 1) % order.length];
  state.perk = next;
  state.flags = state.flags || {};
  ['loyaltyUsed', 'noseWarned', 'noseDay', 'noseNext', 'neighborlyDone', 'neighborlyDay', 'neighborlyWaitSaid'].forEach((key) => {
    delete state.flags[key];
  });
  touchState();
  Save.write(state);
  return `Perk: ${perkById(next)?.name || 'none'}`;
}
