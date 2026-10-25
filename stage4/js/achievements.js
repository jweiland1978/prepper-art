/**
 * Stage 4 Part A: achievements.
 * Tracked quietly from run 1. Per-run counters live in the run save (state.ach);
 * permanent records live in the meta store (js/meta.js). Before the feature unlocks
 * (after CONFIG.ACH_UNLOCK_AFTER finished runs) an earn is recorded silently: no toast,
 * no ending line. The UNLOCKED card then shows what was already earned.
 */
import { CONFIG } from './config.js?v=1';
import { Game, bus } from './state.js?v=1';
import { readMeta, writeMeta } from './meta.js?v=1';

export const ACHIEVEMENTS = [
  { id: 'creamed-corn', name: 'Survived on creamed corn alone', desc: 'No garden. No hope. Just corn.' },
  { id: 'first-night', name: 'First Night, Last Night', desc: 'You made it to the end of the world. Briefly.' },
  { id: 'called-it', name: 'Called It', desc: 'The notebook knew. You knew. Nobody listened.' },
  { id: 'larry-right', name: 'Larry Was Right', desc: "Mark the date. It won't happen again." },
  { id: 'full-house', name: 'Full House', desc: 'Five cots, one bathroom, zero privacy.' },
  { id: 'excessive-hole', name: 'Excessive Hole', desc: 'The HOA has a folder with your name on it.' },
  { id: 'mackinaw', name: 'The Mackinaw', desc: 'Warm, wool, and the envy of Lake Orwell.' },
  { id: 'light-fingers', name: 'Pine Lake Light Fingers', desc: 'Twelve cans. Zero witnesses.' },
  { id: 'every-end', name: 'Every End of the World', desc: "Zombies, robots, rocks, flares and a very big moon. You've seen it all.", progress: 'seenApocs' },
  { id: 'five-ways', name: 'Made It Out, Five Ways', desc: 'The world keeps ending. You keep not.', progress: 'wonApocs' },
  { id: 'good-boy', name: 'Good Boy', desc: "Who's a good boy? The one in the bandana." },
  { id: 'gary-approves', name: 'Gary Approves', desc: "He nodded. That's basically a hug." },
];

/*
 * NOT achievements: the two Radio Tower endings are their own reward tier.
 * No toast, no wall entry, no ending-card line. They are revealed only through the
 * Radio Tower itself (the tower card and the ending choice), which arrives in Part B.
 * Placeholder ids for Part B: 'tower-broke-loop' (BREAK THE LOOP) and
 * 'tower-it-was-for-me' (BECOME THE VOICE). Keep them out of ACHIEVEMENTS.
 */
export const TOWER_REWARDS_PLACEHOLDER = Object.freeze(['tower-broke-loop', 'tower-it-was-for-me']);

export const APOC_COUNT = 5;
const FOOD_LIMIT = 5;

export function achById(id) {
  return ACHIEVEMENTS.find((row) => row.id === id) || null;
}

export function emptyRunAch() {
  return {
    earned: [],        // ids first earned during this run (for the ending line)
    growEver: false,   // a Grow Room existed at some point this run
    survChecks: 0,     // survival food checks made (each morning and night, Days 31-40)
    foodMax: 0,        // highest food seen at those checks
    granted: false,    // this run's ending was counted
    endResult: null,   // { wasUnlocked, unlockedNow, earned } from the run-end grant
  };
}

/** Save repair for state.ach (v3 saves have none). */
export function repairRunAch(raw, state) {
  const out = emptyRunAch();
  if (raw && typeof raw === 'object') {
    out.earned = Array.isArray(raw.earned) ? raw.earned.filter((id) => achById(id)) : [];
    out.growEver = !!raw.growEver;
    out.survChecks = Math.max(0, Math.floor(Number(raw.survChecks) || 0));
    out.foodMax = Math.max(0, Number(raw.foodMax) || 0);
    out.granted = !!raw.granted;
    out.endResult = raw.endResult && typeof raw.endResult === 'object' ? raw.endResult : null;
  }
  if ((state?.slots || []).some((slot) => slot.room === 'grow')) out.growEver = true;
  return out;
}

function runAch(state) {
  if (!state) return null;
  if (!state.ach || typeof state.ach !== 'object') state.ach = emptyRunAch();
  return state.ach;
}

export function achUnlocked() {
  return !!readMeta().achUnlocked;
}

export function hasAch(id) {
  return !!readMeta().achs[id];
}

export function earnedCount() {
  const meta = readMeta();
  return ACHIEVEMENTS.filter((row) => meta.achs[row.id]).length;
}

export function progressOf(row) {
  if (!row?.progress) return null;
  const list = readMeta()[row.progress] || [];
  return { have: Math.min(APOC_COUNT, list.length), of: APOC_COUNT };
}

/**
 * Award an achievement. Permanent and once only. Returns true on a first earn.
 * Silent until the feature is unlocked; afterwards it emits a toast.
 */
export function earn(id, state = Game.state) {
  const row = achById(id);
  if (!row) return false;
  const meta = readMeta();
  if (meta.achs[id]) return false;
  meta.achs[id] = { run: state?.runNumber || meta.runCount || 0, day: state?.day || 0 };
  writeMeta(meta);
  const ach = runAch(state);
  if (ach && !ach.earned.includes(id)) ach.earned.push(id);
  if (meta.achUnlocked) bus.emit('achievement', { id, name: row.name, desc: row.desc });
  return true;
}

function noteGrow(state) {
  const ach = runAch(state);
  if (ach && (state.slots || []).some((slot) => slot.room === 'grow')) ach.growEver = true;
}

/* ---------- hooks called from game code ---------- */

/** bunker build: any room. */
export function onRoomBuilt(state, roomId) {
  const ach = runAch(state);
  if (ach && roomId === 'grow') ach.growEver = true;
}

/** Survival food check. Call each survival morning (after eating) and each night. */
export function onSurvivalFoodCheck(state) {
  const ach = runAch(state);
  if (!ach || state.mode !== 'survival') return;
  noteGrow(state);
  ach.survChecks += 1;
  ach.foodMax = Math.max(ach.foodMax, Number(state.stats?.food) || 0);
}

/** Start of a night (prep night report, or a survival morning which follows the night). */
export function onNightStart(state, crewCount) {
  noteGrow(state);
  if (crewCount >= CONFIG.CREW.maxNeighbors) earn('full-house', state);
}

/** After a notice is filed. noticesEver counts every notice filed this run. */
export function onNoticeFiled(state) {
  if ((state?.flags?.noticesEver || 0) >= 5) earn('excessive-hole', state);
}

/** The Mackinaw was found while scavenging (St. Casimir's rummage). */
export function onMackinawFound(state, how) {
  if (how === 'rummage' || how === 'found') earn('mackinaw', state);
}

/** A Beer Heist ended. caught = the meter maxed out / the sheriff was called. A Dougie bribe is clean. */
export function onHeistEnd(state, caught) {
  if (!caught) earn('light-fingers', state);
}

/** Someone joined the crew. Gary is recruitable from Part B; the hook is live already. */
export function onRecruit(state, id) {
  if (id === 'gary') earn('gary-approves', state);
}

/** Survival HIDE/RUN: ok with Biscuit's bonus, would have failed without it. */
export function onHatchRoll(state, action, roll, chanceWith, chanceWithout) {
  if (state?.mode !== 'survival') return;
  if (action !== 'hide' && action !== 'run') return;
  if (chanceWith <= chanceWithout) return;
  if (roll < chanceWith && roll >= chanceWithout) earn('good-boy', state);
}

/**
 * Day 30 reveal. Records the reveal across runs, Called It, and Larry Was Right.
 * The guess is the notebook guess, which locks at Day 30 (setGuess refuses later).
 * Larry Was Right (notebook has no cross-out): a Larry FAKE stamp is in the notebook,
 * the player locked in a guess, and the guess did not follow any stamped rumor.
 * Stamps only ever sit on lies (reconcileStamps), so the reveal confirms it.
 */
export function onReveal(state, kind) {
  if (!state || !kind) return;
  const meta = readMeta();
  if (!meta.seenApocs.includes(kind)) {
    meta.seenApocs.push(kind);
    writeMeta(meta);
  }
  if (meta.seenApocs.length >= APOC_COUNT) earn('every-end', state);
  const guess = typeof state.guess === 'string' ? state.guess : '';
  if (guess && guess === kind) earn('called-it', state);
  const stamped = (state.rumors || []).filter((entry) => entry && entry.stamp && entry.kind && entry.kind !== kind);
  if (guess && stamped.length && !stamped.some((entry) => entry.kind === guess)) earn('larry-right', state);
}

/**
 * The run reached its ending. Idempotent per run number: a reload on the ending
 * returns the stored result and grants nothing twice.
 * Returns { wasUnlocked, unlockedNow, earned: [ids earned this run], all: [ids earned ever] }.
 */
export function onRunEnd(state, kind) {
  const ach = runAch(state);
  const meta = readMeta();
  const run = state?.runNumber || 0;
  if (ach?.granted || (run && meta.grantedRuns.includes(run))) {
    if (ach) ach.granted = true;
    return ach?.endResult || { wasUnlocked: meta.achUnlocked, unlockedNow: false, earned: ach?.earned || [], repeat: true };
  }
  const wasUnlocked = meta.achUnlocked;
  noteGrow(state);
  const revealed = !!(state.flags?.apocalypseSeen || state.mode === 'survival');
  if (revealed && kind && !meta.seenApocs.includes(kind)) {
    meta.seenApocs.push(kind);
    writeMeta(meta);
  }
  if (meta.seenApocs.length >= APOC_COUNT) earn('every-end', state);
  if (state.ending === 'win' && kind) {
    if (!meta.wonApocs.includes(kind)) {
      meta.wonApocs.push(kind);
      writeMeta(meta);
    }
    if (meta.wonApocs.length >= APOC_COUNT) earn('five-ways', state);
    const noGrow = !ach.growEver && !(state.slots || []).some((slot) => slot.room === 'grow');
    // A real win passes one morning check per survival day (plus nights), so a dev skip doesn't count.
    if (noGrow && ach.survChecks >= CONFIG.SURVIVAL_DAYS && ach.foodMax <= FOOD_LIMIT) earn('creamed-corn', state);
  }
  if (state.ending === 'loss' && state.mode === 'survival' && (state.survivalDay || 1) === 1) {
    earn('first-night', state);
  }
  meta.finishedRuns += 1;
  if (run) meta.grantedRuns = [...meta.grantedRuns, run].slice(-60);
  let unlockedNow = false;
  if (!meta.achUnlocked && meta.finishedRuns >= CONFIG.ACH_UNLOCK_AFTER) {
    meta.achUnlocked = true;
    meta.achCardPending = true;
    unlockedNow = true;
  }
  writeMeta(meta);
  const result = {
    wasUnlocked,
    unlockedNow,
    earned: [...(ach?.earned || [])],
    all: ACHIEVEMENTS.filter((row) => meta.achs[row.id]).map((row) => row.id),
  };
  if (ach) {
    ach.granted = true;
    ach.endResult = result;
  }
  return result;
}

export function clearCardPending() {
  const meta = readMeta();
  if (!meta.achCardPending) return;
  meta.achCardPending = false;
  writeMeta(meta);
}

/** Dev GRANT ACH: the next unearned one (or a named id). */
export function devGrantAch(id) {
  const meta = readMeta();
  const row = id ? achById(id) : ACHIEVEMENTS.find((item) => !meta.achs[item.id]);
  if (!row) return '';
  return earn(row.id, Game.state) ? row.name : '';
}

/** Dev SET RUN #: the next run will be number n, with n-1 runs already finished. */
export function devSetRun(n) {
  const meta = readMeta();
  const next = Math.max(1, Math.floor(Number(n) || 1));
  meta.runCount = next - 1;
  meta.finishedRuns = next - 1;
  meta.grantedRuns = meta.grantedRuns.filter((run) => run < next);
  if (meta.finishedRuns >= CONFIG.ACH_UNLOCK_AFTER) {
    meta.achUnlocked = true;
  } else {
    meta.achUnlocked = false;
    meta.achCardPending = false;
  }
  writeMeta(meta);
  return next;
}
