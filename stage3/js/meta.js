import { CONFIG } from './config.js?v=5';

function warn(message) {
  console.warn(`[PREPPER] ${message}`);
}

/** null means missing or broken, which counts as "no runs started yet" (the next one is run 1). */
export function readRunCount() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CONFIG.META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const n = parsed && typeof parsed === 'object' ? Number(parsed.runCount) : NaN;
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.floor(n);
  } catch (error) {
    warn('Run count could not be read.');
    return null;
  }
}

export function writeRunCount(count) {
  try {
    if (typeof localStorage === 'undefined') return false;
    const n = Math.max(1, Math.floor(Number(count) || 1));
    localStorage.setItem(CONFIG.META_KEY, JSON.stringify({ runCount: n }));
    return true;
  } catch (error) {
    warn('Run count could not be written.');
    return false;
  }
}

/** Call when a new run starts. Run 1 is the first one, including a missing meta key. */
export function nextRunNumber() {
  const prev = readRunCount();
  const next = prev == null ? 1 : prev + 1;
  writeRunCount(next);
  return next;
}

/**
 * A Stage 2 save already in progress is run 1.
 * Does not bump a count that stage 3 already wrote.
 */
export function claimLegacyRun() {
  if (readRunCount() == null) writeRunCount(1);
}
