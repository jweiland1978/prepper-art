import { CONFIG } from './config.js?v=3';
import { readMeta, writeMeta } from './meta.js?v=3';
import { PERKS, PERK_IDS, UNLOCK_TRACK, UNLOCK_INFO, UNLOCK_IDS, perkById } from './data/unlocks.js?v=3';

/** Stage 4 Part A: unlocks between runs and the five starting perks. */

export function hasUnlock(id) {
  return readMeta().unlocks.includes(id);
}

/** Perks the player owns, in track order. */
export function ownedPerks() {
  const meta = readMeta();
  return PERKS.filter((row) => meta.unlocks.includes(`perk:${row.id}`));
}

/** Called from onRunEnd after finishedRuns went up. Returns the ids granted now. */
export function grantStepFor(meta, finished) {
  const step = UNLOCK_TRACK[finished - 1] || [];
  const fresh = step.filter((id) => !meta.unlocks.includes(id));
  meta.unlocks.push(...fresh);
  return fresh;
}

/** Cards still to show: built, has a card, not announced. STARTING PERKS covers the coupon. */
export function pendingCards() {
  const meta = readMeta();
  return meta.unlocks
    .filter((id) => {
      const info = UNLOCK_INFO[id];
      if (info?.requires?.some((need) => !meta.unlocks.includes(need))) return false;
      return info?.built && info.card && !meta.announced.includes(id);
    })
    .map((id) => ({ id, ...UNLOCK_INFO[id] }));
}

export function markAnnounced(id) {
  const meta = readMeta();
  if (meta.announced.includes(id)) return;
  meta.announced.push(id);
  writeMeta(meta);
}

/** The new-run picker writes this. Unknown or unowned ids become "no perk". */
export function applyStartPerk(state, perkId, changeStat) {
  const owned = ownedPerks().map((row) => row.id);
  const id = owned.includes(perkId) ? perkId : '';
  state.perk = id;
  state.flags = state.flags || {};
  const meta = readMeta();
  meta.lastPerk = id;
  writeMeta(meta);
  if (!id) return '';
  if (id === 'cans') changeStat('food', CONFIG.PERKS.cansFood);
  if (id === 'hose') changeStat('water', CONFIG.PERKS.hoseWater);
  state.flags.perkNote = perkById(id)?.note || '';
  return id;
}

/** Big Lou's Loyalty Card: the first dig of the run is 1 plank cheaper. */
export function loyaltyDiscount(state) {
  return state?.perk === 'loyalty' && !state.flags?.loyaltyUsed ? CONFIG.PERKS.loyaltyDiscount : 0;
}

export function noteDig(state) {
  if (state?.perk === 'loyalty' && !state.flags.loyaltyUsed) state.flags.loyaltyUsed = true;
}

export function repairPerk(raw) {
  return PERK_IDS.includes(raw) ? raw : '';
}

/** Dev UNLOCK ALL: everything on the track, cards treated as already seen. */
export function devUnlockAll() {
  const meta = readMeta();
  meta.unlocks = [...UNLOCK_IDS];
  meta.announced = [...UNLOCK_IDS];
  meta.achUnlocked = true;
  meta.achCardPending = false;
  meta.finishedRuns = Math.max(meta.finishedRuns, UNLOCK_TRACK.length);
  meta.runCount = Math.max(meta.runCount, meta.finishedRuns);
  writeMeta(meta);
  return meta.unlocks.length;
}
