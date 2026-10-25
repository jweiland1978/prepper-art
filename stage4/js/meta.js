import { CONFIG } from './config.js?v=5';
import { UNLOCK_IDS, PERK_IDS, unlocksForFinished } from './data/unlocks.js?v=5';

/**
 * Stage 4 meta store (prepper_s4_meta). Survives DELETE SAVE and new runs.
 *   runCount       runs started (the next run is runCount + 1)
 *   finishedRuns   runs that reached an ending (win, loss or early)
 *   grantedRuns    run numbers whose ending was already counted (reload-safe)
 *   achs           { id: { run, day } } permanent achievement records
 *   seenApocs      Day 30 reveals seen across runs
 *   wonApocs       apocalypses beaten across runs
 *   achUnlocked    the achievements feature is unlocked (after 2 finished runs)
 *   achCardPending the UNLOCKED card still has to be shown (cleared on tap)
 *   unlocks        Part A track ids granted so far (data/unlocks.js), one step per finished run
 *   announced      unlock ids whose card was shown (unbuilt ids wait here until Part B/C)
 *   lastPerk       the perk picked last run (pre-highlighted in the picker)
 *   tower          Part B tower endings (their own tier, not achievements):
 *                  { break: n, voice: n, last: 'break'|'voice'|'', lastRun, voiceName, echo: 'break'|'voice'|'', echoRun }
 *                  echo is the next run's radio change; it is claimed by the next new run (echoRun).
 *   guide          Part C Field Guide pages opened outside seenApocs/wonApocs:
 *                  { nbrs: [neighbor ids recruited], rooms: [room ids built], clues: 0..3 heard, tower: bool }
 * Stage 3 meta (prepper_s3_meta) is read once on first load. It is never written or deleted.
 */

function warn(message) {
  console.warn(`[PREPPER] ${message}`);
}

const APOC_IDS = ['zombies', 'solarflare', 'robots', 'meteor', 'bigmoon'];

export function emptyMeta() {
  return {
    v: 4,
    runCount: 0,
    finishedRuns: 0,
    grantedRuns: [],
    achs: {},
    seenApocs: [],
    wonApocs: [],
    achUnlocked: false,
    achCardPending: false,
    unlocks: [],
    announced: [],
    lastPerk: '',
    migratedFrom: '',
    tower: emptyTower(),
    guide: emptyGuide(),
  };
}

export function emptyGuide() {
  return { nbrs: [], rooms: [], clues: 0, tower: false };
}

const GUIDE_NBRS = ['larry', 'kowalski', 'dale', 'tina', 'kevin', 'gary'];

function repairGuide(raw) {
  const guide = emptyGuide();
  if (!raw || typeof raw !== 'object') return guide;
  const ids = (list, ok) => (Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === 'string' && ok(id)))] : []);
  guide.nbrs = ids(raw.nbrs, (id) => GUIDE_NBRS.includes(id));
  guide.rooms = ids(raw.rooms, (id) => !!CONFIG.ROOMS?.[id]);
  guide.clues = int(raw.clues, 0, 0, 3);
  guide.tower = !!raw.tower;
  return guide;
}

export function emptyTower() {
  return { break: 0, voice: 0, last: '', lastRun: 0, voiceName: '', echo: '', echoRun: 0 };
}

const TOWER_CHOICES = ['break', 'voice'];

function repairTower(raw) {
  const tower = emptyTower();
  if (!raw || typeof raw !== 'object') return tower;
  tower.break = int(raw.break, 0, 0, 999);
  tower.voice = int(raw.voice, 0, 0, 999);
  tower.last = TOWER_CHOICES.includes(raw.last) ? raw.last : '';
  tower.lastRun = int(raw.lastRun, 0);
  tower.voiceName = typeof raw.voiceName === 'string' ? raw.voiceName.slice(0, 24) : '';
  tower.echo = TOWER_CHOICES.includes(raw.echo) ? raw.echo : '';
  tower.echoRun = int(raw.echoRun, 0);
  return tower;
}

function int(value, fallback, min = 0, max = 99999) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function apocList(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id) => APOC_IDS.includes(id)))];
}

export function repairMeta(raw) {
  const meta = emptyMeta();
  if (!raw || typeof raw !== 'object') return meta;
  meta.runCount = int(raw.runCount, 0);
  meta.finishedRuns = int(raw.finishedRuns, 0);
  meta.grantedRuns = Array.isArray(raw.grantedRuns)
    ? [...new Set(raw.grantedRuns.map((n) => int(n, 0)).filter((n) => n > 0))].slice(-60)
    : [];
  meta.achs = {};
  if (raw.achs && typeof raw.achs === 'object' && !Array.isArray(raw.achs)) {
    Object.entries(raw.achs).forEach(([id, rec]) => {
      if (typeof id !== 'string' || !id) return;
      meta.achs[id] = { run: int(rec?.run, 0), day: int(rec?.day, 0) };
    });
  }
  meta.seenApocs = apocList(raw.seenApocs);
  meta.wonApocs = apocList(raw.wonApocs);
  meta.achUnlocked = !!raw.achUnlocked;
  meta.achCardPending = !!raw.achCardPending && meta.achUnlocked;
  meta.migratedFrom = typeof raw.migratedFrom === 'string' ? raw.migratedFrom : '';
  const idList = (list) => [...new Set(list.filter((id) => UNLOCK_IDS.includes(id)))];
  if (Array.isArray(raw.unlocks)) {
    meta.unlocks = idList(raw.unlocks);
    meta.announced = Array.isArray(raw.announced) ? idList(raw.announced) : [];
  } else {
    // Metas written before Part A: grant what the finished runs already earned.
    // Their cards still show once (announced stays empty), except the achievements card
    // which keeps its own pending flag.
    meta.unlocks = unlocksForFinished(meta.finishedRuns);
    meta.announced = [];
  }
  // Every finished run's step is always owned, even if the list was hand-edited.
  unlocksForFinished(meta.finishedRuns).forEach((id) => {
    if (!meta.unlocks.includes(id)) meta.unlocks.push(id);
  });
  if (meta.achUnlocked && !meta.unlocks.includes('achievements')) meta.unlocks.push('achievements');
  if (meta.unlocks.includes('achievements')) meta.achUnlocked = true;
  meta.lastPerk = PERK_IDS.includes(raw.lastPerk) ? raw.lastPerk : '';
  meta.tower = repairTower(raw.tower);
  meta.guide = repairGuide(raw.guide);
  return meta;
}

/**
 * First load only: copy what Stage 3 knew. Stage 3 meta only had runCount, so the run
 * number carries on. If the last Stage 3 save got past the Day 30 reveal, that reveal
 * (and a win) seeds the "across your runs" progress. Finished-run count starts at 0
 * because Stage 3 never recorded it, so the unlock card is earned in Stage 4.
 */
function migrateFromStage3() {
  const meta = emptyMeta();
  meta.migratedFrom = 'none';
  try {
    const raw = localStorage.getItem(CONFIG.LEGACY_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      meta.runCount = int(parsed?.runCount, 0);
      meta.migratedFrom = 's3';
    }
    const saveRaw = localStorage.getItem(CONFIG.LEGACY_SAVE_KEY);
    if (saveRaw) {
      const save = JSON.parse(saveRaw);
      const kind = APOC_IDS.includes(save?.apocalypse) ? save.apocalypse : '';
      const revealed = !!(save?.flags?.apocalypseSeen || save?.mode === 'survival');
      if (kind && revealed && Number(save?.version) >= 3) {
        meta.seenApocs = [kind];
        if (save.ending === 'win') meta.wonApocs = [kind];
      }
      if (!meta.runCount && save && Number(save.runNumber) >= 1) meta.runCount = int(save.runNumber, 0);
    }
  } catch (error) {
    warn('Stage 3 progress could not be read. Starting fresh.');
  }
  return meta;
}

let cache = null;

export function readMeta() {
  if (cache) return cache;
  try {
    if (typeof localStorage === 'undefined') {
      cache = emptyMeta();
      return cache;
    }
    const raw = localStorage.getItem(CONFIG.META_KEY);
    if (!raw) {
      cache = migrateFromStage3();
      writeMeta(cache);
      return cache;
    }
    cache = repairMeta(JSON.parse(raw));
  } catch (error) {
    warn('Meta could not be read.');
    cache = emptyMeta();
  }
  return cache;
}

export function writeMeta(meta = cache) {
  if (!meta) return false;
  cache = meta;
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(CONFIG.META_KEY, JSON.stringify(meta));
    return true;
  } catch (error) {
    warn('Meta could not be written.');
    return false;
  }
}

/** Drop the in-memory copy (tests and RESET META). */
export function reloadMeta() {
  cache = null;
  return readMeta();
}

/** RESET PROGRESS (Settings) and dev RESET META: clears achievements, unlocks, perks, progress and run counts. Stage 3 keys untouched. */
export function resetMeta() {
  const meta = emptyMeta();
  meta.migratedFrom = 'reset';
  writeMeta(meta);
  return meta;
}

/** null means no runs started yet (the next one is run 1). */
export function readRunCount() {
  const n = readMeta().runCount;
  return n >= 1 ? n : null;
}

export function writeRunCount(count) {
  const meta = readMeta();
  meta.runCount = Math.max(1, Math.floor(Number(count) || 1));
  return writeMeta(meta);
}

/** Call when a new run starts. Run 1 is the first one, including a missing meta key. */
export function nextRunNumber() {
  const prev = readRunCount();
  const next = prev == null ? 1 : prev + 1;
  writeRunCount(next);
  return next;
}

/** An older save already in progress is a run. Does not bump a count that is already set. */
export function claimLegacyRun() {
  if (readRunCount() == null) writeRunCount(1);
}
