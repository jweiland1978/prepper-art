/**
 * Stage 4 Part C: the Field Guide. Pages are tracked from run 1 (quietly, like
 * achievements) and the guide itself opens once the unlock track reaches it (after run 3).
 *
 *   Apocalypse pages: SEEN half = meta.seenApocs (Day 30 reveal), SURVIVED half = meta.wonApocs.
 *   Neighbor pages: first recruit (Gary included). Biscuit is always home, so his page is open.
 *   Room pages: first build (the Ham Shack included).
 *   Radio page: fills in with each clue heard, and the tower once climbed.
 *
 * No spoilers: nothing here reads the current run's apocalypse. Locked pages are "???",
 * and room pages only name apocalypses already seen.
 */
import { CONFIG } from './config.js?v=5';
import { readMeta, writeMeta, emptyGuide } from './meta.js?v=5';
import { NEIGHBORS } from './data/neighbors.js?v=5';
import { CLUE_LINES } from './data/tower.js?v=5';
import {
  APOC_PAGES, BACK_PAGE, BISCUIT_PAGE, GUIDE_TABS, LOCKED_LINES, RADIO_PAGE, ROOM_HELP_WORDS,
} from './data/guide.js?v=5';

export const GUIDE_NBR_IDS = ['larry', 'kowalski', 'dale', 'tina', 'kevin', 'gary'];
export const GUIDE_ROOM_IDS = ['pantry', 'water', 'generator', 'barricade', 'grow', 'rec', 'faraday', 'lead', 'hamshack'];

export function guideUnlocked() {
  return readMeta().unlocks.includes('guide');
}

function guideOf(meta) {
  if (!meta.guide || typeof meta.guide !== 'object') meta.guide = emptyGuide();
  return meta.guide;
}

function addTo(list, id) {
  if (list.includes(id)) return false;
  list.push(id);
  return true;
}

export function markNeighbor(id) {
  if (!GUIDE_NBR_IDS.includes(id)) return;
  const meta = readMeta();
  if (addTo(guideOf(meta).nbrs, id)) writeMeta(meta);
}

export function markRoom(id) {
  if (!GUIDE_ROOM_IDS.includes(id)) return;
  const meta = readMeta();
  if (addTo(guideOf(meta).rooms, id)) writeMeta(meta);
}

export function markClue(n) {
  const stage = Math.max(0, Math.min(3, Math.floor(Number(n) || 0)));
  const meta = readMeta();
  const guide = guideOf(meta);
  if (stage > guide.clues) {
    guide.clues = stage;
    writeMeta(meta);
  }
}

export function markTower() {
  const meta = readMeta();
  const guide = guideOf(meta);
  if (!guide.tower) {
    guide.tower = true;
    writeMeta(meta);
  }
}

/** Backfill from the current run (crew here, rooms dug). Safe to call any time. */
export function syncGuideFromRun(state) {
  if (!state) return;
  const meta = readMeta();
  const guide = guideOf(meta);
  let changed = false;
  Object.keys(state.crew || {}).forEach((id) => {
    if (GUIDE_NBR_IDS.includes(id) && state.crew[id]) changed = addTo(guide.nbrs, id) || changed;
  });
  (state.slots || []).forEach((slot) => {
    if (slot?.room && GUIDE_ROOM_IDS.includes(slot.room)) changed = addTo(guide.rooms, slot.room) || changed;
  });
  if (changed) writeMeta(meta);
}

const apocName = (id) => CONFIG.APOCALYPSES.find((row) => row.id === id)?.name || id;

/** "Helps against" for a room, naming only apocalypses already seen. */
function roomHelp(id, seen) {
  const counters = CONFIG.APOC_COUNTERS?.[id] || {};
  const lines = [];
  let hidden = 0;
  Object.entries(counters).forEach(([kind, bonus]) => {
    const words = Object.keys(bonus).map((key) => ROOM_HELP_WORDS[key] || key).join(', ');
    if (kind === 'all') {
      lines.push(`Every ending: ${words}.`);
    } else if (seen.includes(kind)) {
      lines.push(`${apocName(kind)}: ${words}.`);
    } else {
      hidden += 1;
    }
  });
  if (hidden) lines.push(hidden === 1 ? 'Something you have not seen yet: ???' : `${hidden} things you have not seen yet: ???`);
  return lines.length ? `AFTER DAY 30\n${lines.join('\n')}` : '';
}

/**
 * Every page in order. Each: { id, tab, title, open, kicker, body }.
 * `name` fills {name} in clue lines (defaults to "you").
 */
export function guidePages(name) {
  const meta = readMeta();
  const guide = guideOf(meta);
  const who = (name || '').trim() || 'you';
  const pages = [];

  CONFIG.APOCALYPSES.forEach((row, index) => {
    const seen = meta.seenApocs.includes(row.id);
    const won = meta.wonApocs.includes(row.id);
    const copy = APOC_PAGES[row.id] || {};
    pages.push({
      id: `apoc:${row.id}`,
      tab: 'apoc',
      open: seen,
      title: seen ? row.name.toUpperCase() : '???',
      kicker: seen ? (won ? 'SEEN  ·  SURVIVED' : 'SEEN') : `ENDING ${index + 1} OF 5`,
      body: seen
        ? `${copy.seen}\n\nSURVIVED\n${won ? copy.survived : '??? (Make it all the way through this one to fill in the rest.)'}`
        : LOCKED_LINES.apoc,
      halves: { seen, survived: seen && won },
    });
  });

  pages.push({ id: 'nbr:biscuit', tab: 'nbr', open: true, title: BISCUIT_PAGE.title, kicker: 'ALWAYS HOME', body: BISCUIT_PAGE.body });
  GUIDE_NBR_IDS.forEach((id) => {
    const row = NEIGHBORS.find((item) => item.id === id);
    const open = guide.nbrs.includes(id);
    pages.push({
      id: `nbr:${id}`,
      tab: 'nbr',
      open,
      title: open ? row.name.toUpperCase() : '???',
      kicker: open ? 'NEIGHBOR' : 'NEIGHBOR',
      portrait: open ? row.portrait : '',
      body: open
        ? `SKILL: ${row.skill}\n\nQUIRK: ${row.quirk}\n\nWANTS: ${row.wants}\n\n"${row.pitch}"`
        : LOCKED_LINES.nbr,
    });
  });

  GUIDE_ROOM_IDS.forEach((id) => {
    const room = CONFIG.ROOMS[id];
    const open = guide.rooms.includes(id);
    const levels = (room.levels || []).map((line, i) => `L${i + 1}: ${line}`).join('\n');
    const help = roomHelp(id, meta.seenApocs);
    pages.push({
      id: `room:${id}`,
      tab: 'room',
      open,
      title: open ? room.name.toUpperCase() : '???',
      kicker: 'ROOM',
      body: open
        ? [room.blurb, levels, help, room.tag || ''].filter(Boolean).join('\n\n')
        : LOCKED_LINES.room,
    });
  });

  const clueLines = [1, 2, 3].map((n) => (guide.clues >= n
    ? `${n}. ${CLUE_LINES[n].replaceAll('{name}', who)}`
    : `${n}. ${RADIO_PAGE.clueLocked}`));
  const towerDone = guide.tower || (meta.tower?.break || 0) + (meta.tower?.voice || 0) > 0;
  let towerLine = RADIO_PAGE.towerLocked;
  if (towerDone) {
    const t = meta.tower || {};
    const counts = (t.break || t.voice) ? `\nBREAK THE LOOP: ${t.break || 0}   IT WAS FOR ME: ${t.voice || 0}` : '';
    towerLine = `${RADIO_PAGE.towerSeen}${counts}`;
  }
  pages.push({
    id: 'radio',
    tab: 'radio',
    open: true,
    title: RADIO_PAGE.title,
    kicker: `CLUES ${guide.clues} OF 3`,
    body: `${RADIO_PAGE.intro}\n\n${clueLines.join('\n\n')}\n\n${towerLine}`,
    clues: guide.clues,
    tower: towerDone,
  });

  pages.push({
    id: 'back',
    tab: 'back',
    open: true,
    title: BACK_PAGE.title,
    kicker: 'FIELD GUIDE',
    body: `${BACK_PAGE.note}\n\n${CONFIG.AI_CREDIT}`,
  });
  return pages;
}

export function guideTabs() {
  return GUIDE_TABS;
}

/** Test/debug summary (no current-run data in here). */
export function guideSummary() {
  const pages = guidePages();
  return pages.map((page) => ({ id: page.id, tab: page.tab, open: page.open, title: page.title, halves: page.halves || null }));
}
