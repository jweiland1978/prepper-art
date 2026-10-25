/**
 * Stage 4 Part A: the unlock track (stage4-unlock-order.md, normal pace, Jeff approved).
 * Each finished run grants the next step, permanently. `built: false` items are recorded on
 * the track now but stay quiet (no card) until Part B/C flips them to true; then their card
 * shows once on the next ending or title screen.
 */

export const PERKS = [
  {
    id: 'cans',
    name: "Can Lady's Coupon",
    short: '+4 food on Day 1',
    note: "Can Lady's Coupon cashed in. Food plus four. She clipped it in 1994. She says it's still good. She checked.",
  },
  {
    id: 'hose',
    name: 'Garden Hose',
    short: '+4 water on Day 1',
    note: 'The Garden Hose came through. Water plus four. It is green, it is kinked, and it is yours.',
  },
  {
    id: 'loyalty',
    name: "Big Lou's Loyalty Card",
    short: 'Your first dig costs 1 less plank',
    note: "Big Lou's Loyalty Card is in your wallet. Your first dig costs one plank less. Nobody has seen Big Lou in years. The card still works.",
  },
  {
    id: 'nose',
    name: "Biscuit's Nose",
    short: "Biscuit's first warning comes a day early",
    note: "Biscuit is sniffing the hatch like he's reading the paper. His first warning will come a day early.",
  },
  {
    id: 'neighborly',
    name: 'Neighborly',
    short: 'A neighbor moves in on Day 3 (needs a free cot)',
    note: "Neighborly: word got around that you're nice. Somebody is coming by on Day 3 with a sleeping bag.",
  },
];

export const PERK_IDS = PERKS.map((row) => row.id);

export function perkById(id) {
  return PERKS.find((row) => row.id === id) || null;
}

/** Step N is granted when run N finishes. */
export const UNLOCK_TRACK = [
  ['perks', 'perk:cans'],
  ['achievements'],
  ['perk:hose', 'guide'],
  ['gary', 'clue:1'],
  ['hamshack', 'clue:2'],
  ['perk:loyalty', 'clue:3'],
  ['tower'],
  ['perk:nose'],
  ['perk:neighborly'],
];

export const UNLOCK_IDS = UNLOCK_TRACK.flat();

/**
 * card: false = never gets its own card (achievements has its own card; clues are hidden on purpose;
 * the first perk is covered by the STARTING PERKS card).
 */
export const UNLOCK_INFO = {
  perks: {
    built: true,
    card: true,
    title: 'STARTING PERKS',
    body: "Every run from now on starts with a pick.\n\nCan Lady's Coupon: +4 food on Day 1. She clipped it in 1994. It's still good. She checked.\n\nMore perks come as you finish runs. NO PERK is always on the list.",
  },
  'perk:cans': { built: true, card: false },
  achievements: { built: true, card: false },
  'perk:hose': {
    built: true,
    card: true,
    title: 'GARDEN HOSE',
    body: 'New starting perk.\n\nGarden Hose: +4 water on Day 1. It is green, it is kinked, and it is yours.',
  },
  guide: { built: false, card: true, title: 'FIELD GUIDE', body: 'The Field Guide is on the title screen now.' },
  gary: { built: true, card: true, title: 'GARY', body: "Gary has an opinion about your bunker. He will tell you in person.\n\nVisit Gary's Place. Build a Water Tank first. He checks." },
  'clue:1': { built: true, card: false },
  hamshack: { built: true, card: true, title: 'HAM SHACK', body: 'You can dig a Ham Shack in the bunker now.\n\nA bigger antenna. Better company. At level 3 it checks one rumor a day.' },
  'clue:2': { built: true, card: false },
  'perk:loyalty': {
    built: true,
    card: true,
    title: "BIG LOU'S LOYALTY CARD",
    body: "New starting perk.\n\nBig Lou's Loyalty Card: your first dig of the run costs 1 less plank. Nobody has seen Big Lou in years. Nine punches on the card. Nobody asks about the tenth.",
  },
  'clue:3': { built: true, card: false },
  // Part B: the tower card waits until the clue track is done (requires) and the tower is owned.
  tower: { built: true, card: true, requires: ['clue:3'], title: 'THE RADIO TOWER', body: 'Static. And something else.' },
  'perk:nose': {
    built: true,
    card: true,
    title: "BISCUIT'S NOSE",
    body: "New starting perk.\n\nBiscuit's Nose: Biscuit smells the first night danger a day before it gets here. You get a day to get ready, and his warning helps you HIDE or RUN that night. He always knew. Now he tells you.",
  },
  'perk:neighborly': {
    built: true,
    card: true,
    title: 'NEIGHBORLY',
    body: 'New starting perk.\n\nNeighborly: on Day 3 a neighbor shows up with a sleeping bag and moves in, if there is a free cot. Never Gary. Gary has his own place.',
  },
};

/** Ids granted after `finished` runs. */
export function unlocksForFinished(finished) {
  return UNLOCK_TRACK.slice(0, Math.max(0, finished)).flat();
}
