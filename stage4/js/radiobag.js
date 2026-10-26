/**
 * Radio no-repeat "shuffle bags" (Oct 25 radio pacing fix).
 * Each pool remembers which lines the player has heard, across runs, in localStorage
 * (CONFIG.RADIO_KEY). A line comes back only after the whole pool has played, and never
 * twice in the same run while the pool still has a line unheard this run.
 * Old saves need nothing: a missing or broken key is an empty bag.
 */
import { CONFIG } from './config.js?v=6';

let cache = null;

function hashKey(text) {
  const s = String(text || '');
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function empty() {
  return { v: 1, run: 0, pools: {}, runSeen: {} };
}

function storage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch (error) {
    return null;
  }
}

function load() {
  if (cache) return cache;
  cache = empty();
  const ls = storage();
  if (!ls || !CONFIG.RADIO_KEY) return cache;
  try {
    const raw = ls.getItem(CONFIG.RADIO_KEY);
    if (!raw) return cache;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      cache.run = Number.isFinite(parsed.run) ? parsed.run : 0;
      const clean = (obj) => {
        const out = {};
        if (!obj || typeof obj !== 'object') return out;
        Object.entries(obj).forEach(([key, list]) => {
          if (Array.isArray(list)) out[key] = list.filter((x) => typeof x === 'string').slice(0, 400);
        });
        return out;
      };
      cache.pools = clean(parsed.pools);
      cache.runSeen = clean(parsed.runSeen);
    }
  } catch (error) {
    cache = empty();
  }
  return cache;
}

function save() {
  const ls = storage();
  if (!ls || !CONFIG.RADIO_KEY || !cache) return;
  try {
    ls.setItem(CONFIG.RADIO_KEY, JSON.stringify(cache));
  } catch (error) {
    // Storage full or blocked: the bag still works for this session.
  }
}

function runOf(state) {
  const n = Number(state?.runNumber);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** A new run number clears the per-run memory (not the across-runs bag). */
function syncRun(bag, state) {
  if (!state) return;
  const run = runOf(state);
  if (run && bag.run !== run) {
    bag.run = run;
    bag.runSeen = {};
  }
}

function keyFor(item, keyOf) {
  if (keyOf) return hashKey(keyOf(item));
  if (item && typeof item === 'object') return hashKey(item.id || item.text);
  return hashKey(item);
}

function note(bag, pool, key) {
  const heard = bag.pools[pool] || (bag.pools[pool] = []);
  if (!heard.includes(key)) heard.push(key);
  const seen = bag.runSeen[pool] || (bag.runSeen[pool] = []);
  if (!seen.includes(key)) seen.push(key);
}

/**
 * Pick one line from `list` for `pool`. Unheard (ever) first, then lines not yet heard this run,
 * then anything but the last line played. rng is 0..1.
 */
export function drawLine(pool, list, state, opts = {}) {
  if (!Array.isArray(list) || !list.length) return null;
  const rng = opts.rng || Math.random;
  const bag = load();
  syncRun(bag, state);
  const keys = list.map((item) => keyFor(item, opts.keyOf));
  const heard = new Set(bag.pools[pool] || []);
  const seen = new Set(bag.runSeen[pool] || []);
  let idx = keys.map((_, i) => i).filter((i) => !heard.has(keys[i]) && !seen.has(keys[i]));
  if (!idx.length) {
    // Whole pool heard: start the bag over, keeping this run's lines out.
    bag.pools[pool] = (bag.pools[pool] || []).filter((k) => seen.has(k) || !keys.includes(k));
    idx = keys.map((_, i) => i).filter((i) => !seen.has(keys[i]));
  }
  if (!idx.length) {
    const last = (bag.runSeen[pool] || []).slice(-1)[0];
    idx = keys.map((_, i) => i).filter((i) => keys[i] !== last);
    bag.runSeen[pool] = [];
  }
  if (!idx.length) idx = [0];
  const pick = idx[Math.floor(rng() * idx.length)];
  note(bag, pool, keys[pick]);
  save();
  return list[pick];
}

/** Mark a line as heard (fixed story lines that share a pool with the random ones). */
export function markHeard(pool, item, state, keyOf) {
  if (item == null) return;
  const bag = load();
  syncRun(bag, state);
  note(bag, pool, keyFor(item, keyOf));
  save();
}

/** True when the line has been heard in the across-runs bag. */
export function wasHeard(pool, item, keyOf) {
  const bag = load();
  return (bag.pools[pool] || []).includes(keyFor(item, keyOf));
}

/** Stable reorder: lines never heard first (rumor plan). Does not change the bag. */
export function unheardFirst(pool, list, keyOf) {
  if (!Array.isArray(list)) return list;
  const heard = new Set(load().pools[pool] || []);
  const fresh = list.filter((item) => !heard.has(keyFor(item, keyOf)));
  if (!fresh.length || fresh.length === list.length) return list;
  const old = list.filter((item) => heard.has(keyFor(item, keyOf)));
  // If every line in a pool was heard, start that pool over.
  return fresh.concat(old);
}

/** RESET PROGRESS and ?reset=1: forget every bag. */
export function clearRadioBag() {
  cache = empty();
  const ls = storage();
  if (!ls || !CONFIG.RADIO_KEY) return;
  try {
    ls.removeItem(CONFIG.RADIO_KEY);
  } catch (error) {
    // ignore
  }
}

/** Tests and dev: drop the in-memory copy and read storage again. */
export function reloadRadioBag() {
  cache = null;
  return load();
}

export function radioBagSnapshot() {
  return JSON.parse(JSON.stringify(load()));
}
