/**
 * Stage 3 secret: which apocalypse this run is, and the rumor plan that hints at it.
 * Read state.apocalypse only through apocalypseOf(). Day 30, survival, and score should too.
 */
import { CONFIG, phaseForDay } from './config.js?v=3';
import { LARRY_STAMP, RUMORS, rumorById } from './data/radio.js?v=3';

const TRUTH_MARGIN = 3;

export function apocalypseIds() {
  return CONFIG.APOCALYPSES.map((row) => row.id);
}

export function apocalypseRow(id) {
  return CONFIG.APOCALYPSES.find((row) => row.id === id) || CONFIG.APOCALYPSES[0];
}

/** The only reader of state.apocalypse. */
export function apocalypseOf(state) {
  const id = state?.apocalypse;
  return apocalypseIds().includes(id) ? id : 'zombies';
}

export function apocalypseName(idOrState) {
  const id = typeof idOrState === 'string'
    ? (apocalypseIds().includes(idOrState) ? idOrState : 'zombies')
    : apocalypseOf(idOrState);
  return apocalypseRow(id).name;
}

/** Phaser texture key for the Day 30 / survival / ending painting. */
export function endArtKey(state) {
  return `bg-end-${apocalypseOf(state)}`;
}

export function rollForRun(runNumber, rng = Math.random) {
  const n = Number(runNumber);
  if (!Number.isFinite(n) || n <= 1) return 'zombies';
  const rows = CONFIG.APOCALYPSES;
  const total = rows.reduce((sum, row) => sum + (row.weight > 0 ? row.weight : 0), 0) || rows.length;
  let roll = rng() * total;
  for (const row of rows) {
    roll -= row.weight > 0 ? row.weight : 0;
    if (roll <= 0) return row.id;
  }
  return rows[rows.length - 1].id;
}

export function rumorIsLie(state, entry) {
  const kind = entry?.kind;
  if (!apocalypseIds().includes(kind)) return false;
  return kind !== apocalypseOf(state);
}

/** Drops a stamp that would land on a true clue, including after FORCE APOC. */
export function reconcileStamps(state) {
  (state?.rumors || []).forEach((entry) => {
    if (!entry) return;
    const lie = rumorIsLie(state, entry);
    entry.lie = lie;
    if (entry.stamp && !lie) entry.stamp = '';
    if (entry.stamp && lie && entry.stamp !== LARRY_STAMP) entry.stamp = LARRY_STAMP;
    // Part B: the Ham Shack never vouches for a lie, even after a dev re-roll.
    if (entry.ham === 'checked' && lie) entry.ham = 'static';
  });
}

/** The only writer of state.apocalypse, besides a brand-new run and migrate. */
export function assignApocalypse(state, id) {
  if (!state) return 'zombies';
  const next = apocalypseIds().includes(id) ? id : 'zombies';
  state.apocalypse = next;
  reconcileStamps(state);
  return next;
}

export function canGuess(state) {
  if (!state || state.mode === 'survival' || state.finished) return false;
  return (state.day || 1) < CONFIG.PREP_DAYS;
}

export function setGuess(state, id) {
  if (!canGuess(state)) return false;
  if (id && !apocalypseIds().includes(id)) return false;
  state.guess = id || '';
  return true;
}

/**
 * Larry is always right. roll is 0..1. A truth, a missing kind, or a high roll does nothing.
 */
export function maybeStampEntry(state, entry, roll = Math.random()) {
  if (!entry || entry.stamp) return false;
  if (!rumorIsLie(state, entry)) return false;
  const chance = Number(CONFIG.LARRY_STAMP_CHANCE);
  if (!(roll < (Number.isFinite(chance) ? chance : 0.5))) return false;
  entry.stamp = LARRY_STAMP;
  entry.lie = true;
  return true;
}

function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const swap = list[i];
    list[i] = list[j];
    list[j] = swap;
  }
  return list;
}

function countsOf(days) {
  const counts = Object.fromEntries(apocalypseIds().map((id) => [id, 0]));
  days.forEach((row) => {
    if (counts[row.kind] != null) counts[row.kind] += 1;
  });
  return counts;
}

function phaseRank(day) {
  if (day <= 10) return 0;
  if (day <= 20) return 1;
  if (day < CONFIG.PREP_DAYS) return 2;
  return 3;
}

function coverOthers(days, truth, others) {
  const mutable = (row) => !row.locked;
  others.forEach((need) => {
    if ((countsOf(days)[need] || 0) > 0) return;
    const counts = countsOf(days);
    const surplus = days.find((row) => mutable(row) && row.lie && (counts[row.kind] || 0) > 1);
    if (surplus) {
      surplus.kind = need;
      surplus.lie = true;
      surplus.id = '';
      return;
    }
    const donors = days.filter((row) => mutable(row) && !row.lie && row.day < CONFIG.PREP_DAYS);
    donors.sort((a, b) => phaseRank(a.day) - phaseRank(b.day) || a.day - b.day);
    if (!donors.length) return;
    donors[0].lie = true;
    donors[0].kind = need;
    donors[0].id = '';
  });
}

function leadWithTruth(days, truth, others) {
  const mutable = (row) => !row.locked;
  let guard = 0;
  while (guard < days.length + 8) {
    guard += 1;
    const counts = countsOf(days);
    let leader = others[0];
    others.forEach((id) => {
      if ((counts[id] || 0) > (counts[leader] || 0)) leader = id;
    });
    if ((counts[truth] || 0) >= (counts[leader] || 0) + TRUTH_MARGIN) return;
    let flips = days.filter((row) => mutable(row) && row.lie && row.kind === leader && (counts[leader] || 0) > 1);
    if (!flips.length) {
      const fat = others.find((id) => (counts[id] || 0) > 1);
      if (!fat) return;
      flips = days.filter((row) => mutable(row) && row.lie && row.kind === fat);
      if (!flips.length) return;
    }
    flips.sort((a, b) => b.day - a.day);
    flips[0].lie = false;
    flips[0].kind = truth;
    flips[0].id = '';
  }
}

function assignIds(days, rng) {
  const pools = {};
  const sigUsed = new Set();
  apocalypseIds().forEach((kind) => {
    const all = RUMORS.filter((rumor) => rumor.kind === kind);
    const sig = all.find((rumor) => rumor.signature) || null;
    const rest = all.filter((rumor) => rumor !== sig);
    shuffle(rest, rng);
    pools[kind] = { sig, rest, cursor: 0 };
  });
  days.forEach((row) => {
    if (!row.locked || !row.id) return;
    const sig = pools[row.kind]?.sig;
    if (sig && row.id === sig.id) sigUsed.add(row.kind);
  });
  days.forEach((row) => {
    if (row.locked && row.id) return;
    const bucket = pools[row.kind];
    if (!bucket) return;
    if (bucket.sig && !sigUsed.has(row.kind)) {
      sigUsed.add(row.kind);
      row.id = bucket.sig.id;
      return;
    }
    const rest = bucket.rest.length ? bucket.rest : (bucket.sig ? [bucket.sig] : []);
    if (!rest.length) return;
    row.id = rest[bucket.cursor % rest.length].id;
    bucket.cursor += 1;
  });
}

function rebalance(days, truth, rng) {
  const others = apocalypseIds().filter((id) => id !== truth);
  coverOthers(days, truth, others);
  leadWithTruth(days, truth, others);
  days.forEach((row) => {
    row.lie = row.kind !== truth;
  });
  assignIds(days, rng);
}

/** Full 30-day plan. The true apocalypse is strictly the most-hinted, and each other one appears. */
export function buildRumorPlan(truth, rng = Math.random) {
  const id = apocalypseIds().includes(truth) ? truth : 'zombies';
  const others = apocalypseIds().filter((item) => item !== id);
  const days = [];
  for (let day = 1; day <= CONFIG.PREP_DAYS; day += 1) {
    const phase = phaseForDay(day);
    const odds = Number(CONFIG.RUMOR_LIE_ODDS[phase] ?? 0);
    const lie = rng() < odds;
    const kind = lie ? others[Math.floor(rng() * others.length)] : id;
    days.push({ day, kind, lie, id: '', locked: false });
  }
  rebalance(days, id, rng);
  return { apocalypse: id, days };
}

export function planCounts(plan) {
  return countsOf(plan?.days || []);
}

export function ensureRumorPlan(state, rng = Math.random) {
  if (!state) return null;
  const truth = apocalypseOf(state);
  const plan = state.rumorPlan;
  if (plan && plan.apocalypse === truth && Array.isArray(plan.days) && plan.days.length === CONFIG.PREP_DAYS) {
    return plan;
  }
  const built = buildRumorPlan(truth, rng);
  const heard = new Map();
  (state.rumors || []).forEach((entry) => {
    if (entry?.morning && Number.isFinite(entry.day)) heard.set(entry.day, entry);
  });
  if (heard.size) {
    built.days.forEach((row) => {
      const past = heard.get(row.day);
      if (!past) return;
      const kind = apocalypseIds().includes(past.kind) ? past.kind : truth;
      row.kind = kind;
      row.lie = kind !== truth;
      row.id = typeof past.id === 'string' && past.id ? past.id : row.id;
      row.locked = true;
    });
    rebalance(built.days, truth, rng);
  }
  state.rumorPlan = built;
  return built;
}

export function recordMorningRumor(state) {
  if (!state) return null;
  const plan = ensureRumorPlan(state);
  const row = plan?.days?.find((day) => day.day === state.day) || plan?.days?.[0];
  const rumor = rumorById(row?.id)
    || RUMORS.find((item) => item.kind === row?.kind)
    || RUMORS.find((item) => item.kind === apocalypseOf(state))
    || RUMORS[0];
  if (!rumor) return null;
  state.rumors = Array.isArray(state.rumors) ? state.rumors : [];
  const existing = state.rumors.find((entry) => entry.morning && entry.day === state.day);
  if (existing) return existing;
  const entry = {
    id: rumor.id,
    day: state.day,
    text: rumor.text,
    count: 1,
    kind: rumor.kind,
    lie: rumor.kind !== apocalypseOf(state),
    morning: true,
    stamp: '',
  };
  state.rumors.push(entry);
  return entry;
}

export function rememberRumor(state, rumor) {
  if (!state || !rumor?.text) return null;
  const known = rumorById(rumor.id);
  const kind = apocalypseIds().includes(rumor.kind)
    ? rumor.kind
    : (apocalypseIds().includes(known?.kind) ? known.kind : '');
  state.rumors = Array.isArray(state.rumors) ? state.rumors : [];
  const found = state.rumors.find((entry) => entry.id === rumor.id && !entry.morning);
  if (found) {
    found.count = (found.count || 1) + 1;
    if (!found.kind && kind) found.kind = kind;
    found.lie = rumorIsLie(state, found);
    if (found.stamp && !found.lie) found.stamp = '';
    return found;
  }
  const entry = {
    id: rumor.id || known?.id || 'note',
    day: state.day,
    text: rumor.text,
    count: 1,
    kind,
    lie: !!kind && kind !== apocalypseOf(state),
    morning: false,
    stamp: '',
  };
  state.rumors.push(entry);
  return entry;
}

/** Swap-meet and tip rumors follow the same lie odds, so they don't bury the true apocalypse. */
export function pickSideRumor(state, rng = Math.random) {
  const truth = apocalypseOf(state);
  const phase = phaseForDay(state?.day || 1);
  const odds = Number(CONFIG.RUMOR_LIE_ODDS[phase] ?? 0);
  const lie = rng() < odds;
  const others = apocalypseIds().filter((id) => id !== truth);
  const kind = lie ? others[Math.floor(rng() * others.length)] : truth;
  const have = new Set((state?.rumors || []).map((entry) => entry.id));
  let pool = RUMORS.filter((rumor) => rumor.kind === kind && !have.has(rumor.id));
  if (!pool.length) pool = RUMORS.filter((rumor) => rumor.kind === kind);
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

export function notebookEntries(state) {
  return (state?.rumors || [])
    .filter((entry) => entry?.text)
    .slice()
    .sort((a, b) => (a.day || 0) - (b.day || 0) || (a.morning === b.morning ? 0 : a.morning ? -1 : 1));
}

export function cycleApocalypse(state) {
  if (!state) return 'zombies';
  const ids = apocalypseIds();
  const next = ids[(ids.indexOf(apocalypseOf(state)) + 1) % ids.length];
  assignApocalypse(state, next);
  state.rumorPlan = null;
  ensureRumorPlan(state);
  return next;
}

export function rumorPlanText(state) {
  if (!state) return 'No run.';
  const plan = ensureRumorPlan(state);
  const counts = planCounts(plan);
  const lines = (plan?.days || []).map((row) => {
    const rumor = rumorById(row.id);
    const phase = phaseForDay(row.day);
    const mark = row.lie ? 'LIE ' : 'TRUE';
    return `Day ${String(row.day).padStart(2, '0')} ${phase.padEnd(8, ' ')} ${mark} ${row.kind}: ${rumor?.text || row.id}`;
  });
  const tally = apocalypseIds().map((id) => `${id} ${counts[id] || 0}`).join(', ');
  const rates = ['calm', 'panic', 'collapse', 'end'].map((phase) => {
    const slice = (plan?.days || []).filter((row) => phaseForDay(row.day) === phase);
    const lies = slice.filter((row) => row.lie).length;
    const rate = slice.length ? (lies / slice.length).toFixed(2) : '0.00';
    return `${phase} ${rate}`;
  }).join(', ');
  return [
    `Run ${state.runNumber || '?'} — ${apocalypseName(state)} (${apocalypseOf(state)})`,
    ...lines,
    `counts: ${tally}`,
    `lie rates: ${rates}`,
  ].join('\n');
}
