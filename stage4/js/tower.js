/**
 * Stage 4 Part B: hidden clues, the Ham Shack's rumor check, Gary's nightly tip, and the
 * Radio Tower (pin, endings, and what the next run's radio does about them).
 * Tower endings are their own tier: they live in meta.tower, never in achievements.
 * No scene imports here. Logic, crew, map and the tower scene call in.
 */
import { CONFIG } from './config.js?v=4';
import { readMeta, writeMeta } from './meta.js?v=4';
import { hasUnlock } from './unlocks.js?v=4';
import { markClue } from './guide.js?v=4';
import {
  CLUE_DAYS, CLUE_LINES, GARY_TIPS, HAM_LINES, OWN_SIGNOFF, STRANGER_GREETINGS, STRANGER_SIGNOFF,
} from './data/tower.js?v=4';

export const TOWER_OPEN_DAY = 20;
export const PROTECTED_IDS = ['tina', 'biscuit', 'gary'];

function nameOf(state) {
  return (state?.name || CONFIG.DEFAULT_NAME || 'Neighbor').trim() || 'Neighbor';
}

/** 0..3: the highest clue the track has given out. */
export function clueStage() {
  if (hasUnlock('clue:3')) return 3;
  if (hasUnlock('clue:2')) return 2;
  if (hasUnlock('clue:1')) return 1;
  return 0;
}

/** The clue line for this morning, or ''. At most one per broadcast, only on clue days. */
export function clueForMorning(state) {
  if (!state || state.mode !== 'prep') return '';
  if (state.flags?.towerEcho === 'break') return ''; // the stranger has never heard of you
  const stage = clueStage();
  const forced = state.flags?.clueForceDay === state.day; // dev NEXT CLUE
  if (!stage || (!CLUE_DAYS.includes(state.day) && !forced)) return '';
  const line = CLUE_LINES[stage] || '';
  state.flags.clueHeard = Array.isArray(state.flags.clueHeard) ? state.flags.clueHeard : [];
  if (!state.flags.clueHeard.includes(state.day)) state.flags.clueHeard.push(state.day);
  state.flags.clueStage = stage;
  markClue(stage); // Part C: the Field Guide's Radio page fills in
  return line.replaceAll('{name}', nameOf(state));
}

/** Clue track done and the tower owned: the pin and its card are live. */
export function towerOwned() {
  return hasUnlock('tower') && hasUnlock('clue:3');
}

/** 'open' | 'closed' (owned, before Day 20) | 'locked' (not owned) | 'done' (climbed this run). */
export function towerPinState(state) {
  if (!towerOwned()) return 'locked';
  if (!state || state.mode !== 'prep') return 'closed';
  if (state.flags?.towerChoice) return 'done';
  if ((state.day || 1) < TOWER_OPEN_DAY || state.day >= CONFIG.PREP_DAYS) return 'closed';
  return 'open';
}

/** The climb spends the rest of the day's actions. Returns false when there are none. */
export function startClimb(state) {
  if (towerPinState(state) !== 'open' || (state.actionsLeft ?? 0) <= 0) return false;
  state.actionsLeft = 0;
  state.flags.towerStep = 'climb';
  state.flags.towerDay = state.day;
  return true;
}

/**
 * The player chose. The run ends here (Day 30 is replaced). Records the ending in meta
 * once per run (reload-safe). Not an achievement: no earn(), no toast, no wall row.
 */
export function chooseTowerEnding(state, choice) {
  if (!state || (choice !== 'break' && choice !== 'voice')) return null;
  state.flags.towerChoice = choice;
  state.flags.towerStep = 'ending';
  state.ending = choice === 'break' ? 'tower-break' : 'tower-voice';
  const meta = readMeta();
  const run = state.runNumber || 0;
  if (!state.flags.towerRecorded) {
    meta.tower[choice] = (meta.tower[choice] || 0) + 1;
    meta.tower.last = choice;
    meta.tower.lastRun = run;
    if (choice === 'voice') meta.tower.voiceName = nameOf(state).slice(0, 24);
    meta.tower.echo = choice;
    meta.tower.echoRun = 0;
    writeMeta(meta);
    state.flags.towerRecorded = true;
  }
  return state.ending;
}

export function isTowerEnding(state) {
  return state?.ending === 'tower-break' || state?.ending === 'tower-voice';
}

/** A brand-new run claims the last tower ending's echo (one run only). */
export function claimTowerEcho(state) {
  if (!state) return '';
  const meta = readMeta();
  const echo = meta.tower?.echo || '';
  if (!echo) return '';
  state.flags = state.flags || {};
  state.flags.towerEcho = echo;
  state.flags.towerVoiceName = meta.tower.voiceName || nameOf(state);
  meta.tower.echo = '';
  meta.tower.echoRun = state.runNumber || 0;
  writeMeta(meta);
  return echo;
}

/** Stranger greeting (run after BREAK THE LOOP), or ''. */
export function strangerGreeting(state) {
  if (state?.flags?.towerEcho !== 'break') return '';
  const day = Math.max(1, state.day || 1);
  return STRANGER_GREETINGS[(day - 1) % STRANGER_GREETINGS.length];
}

export function strangerSignoff(state) {
  return state?.flags?.towerEcho === 'break' ? STRANGER_SIGNOFF : '';
}

/** Day 1 of the run after IT WAS FOR ME opens with your own sign-off. */
export function ownSignoffLine(state) {
  if (state?.flags?.towerEcho !== 'voice' || (state.day || 1) !== 1) return '';
  return OWN_SIGNOFF.replaceAll('{voice}', state.flags.towerVoiceName || nameOf(state));
}

/**
 * Ham Shack level 3: tags today's morning rumor once. A lie is always STATIC.
 * A true rumor is CHECKED or STATIC (the band is not always clear), so CHECKED is never wrong.
 * Larry's FAKE stamp is separate and unchanged.
 */
export function hamTagMorning(state, entry, level, roll = Math.random()) {
  if (!state || !entry || level < 3) return '';
  if (state.flags.hamDay === state.day) return '';
  state.flags.hamDay = state.day;
  if (!entry.ham) entry.ham = (!entry.lie && entry.kind && roll < 0.5) ? 'checked' : 'static';
  return HAM_LINES[entry.ham] || '';
}

/** Gary's blunt tip for the night report, about every other night. */
export function garyTip(state, roll = Math.random()) {
  if (!state || roll >= 0.5) return '';
  const index = Math.floor(((state.day || 1) * 7 + (state.runNumber || 0)) % GARY_TIPS.length);
  return GARY_TIPS[index];
}
