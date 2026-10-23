/** Balance, copy constants, and presentation tokens. All tuneable numbers live here. */
export const CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  HUD_H: 78,

  SAVE_KEY: 'prepper_save_v1',
  SETTINGS_KEY: 'prepper_settings_v1',
  SAVE_VERSION: 2,

  PREP_DAYS: 30,
  SURVIVAL_DAYS: 10,
  ACTIONS_PER_DAY: 3,
  NAME_MAX: 16,
  DEFAULT_NAME: 'Neighbor',

  STATION: '88.3 FM',
  SHOW: 'The Last Shift on 88.3',
  SHOW_BANNER: 'THE LAST SHIFT ON 88.3',
  TOWN: 'Lake Orwell',
  TAGLINE: 'The world ends in 30 days. Nobody knows how. Prep anyway.',
  AI_CREDIT: 'Made with AI: code and art by Grok, design and tuning by Jeff (BlueWater78).',
  RADIO_JINGLE_SPONSOR: "Big Lou's Lumber",

  START: {
    food: 6,
    water: 6,
    health: 10,
    morale: 7,
    materials: 4,
    medicine: 1,
    weapon: 'bare_hands',
  },
  HEALTH_MAX: 10,
  MORALE_MAX: 10,

  UPKEEP_FOOD: 1,
  UPKEEP_WATER: 1,
  // Half a can. It banks until it makes a whole can, so a night never rounds the half up.
  BISCUIT_FOOD: 0.5,

  FOOD_CAP_BASE: 10,
  FOOD_CAP: [25, 45, 70],
  WATER_CAP_BASE: 10,
  WATER_CAP: [25, 45, 70],

  DIG_COST: 3,
  BUILD_COSTS: [4, 6, 9],

  GENERATOR_MORALE: 1,
  COLLAPSE_UNPOWERED_MORALE: 1,

  HEALTH_LOSS_EMPTY: 2,
  HEALTH_LOSS_BOTH_EMPTY: 3,

  AUDIO_BPM: 70,

  PHASES: {
    calm: {
      id: 'calm', from: 1, to: 10, banner: 'CALM BEFORE', lootMin: 3, lootMax: 6, danger: 0.10,
      lootMul: 1, tradeMin: 1, tradeMax: 1, knock: 0, roadEvery: 0,
      open: ['party', 'hardware', 'super', 'pharmacy', 'tavern', 'home'],
    },
    panic: {
      id: 'panic', from: 11, to: 20, banner: 'PANIC BUYING', lootMin: 2, lootMax: 4, danger: 0.25,
      lootMul: 0.7, tradeMin: 1.5, tradeMax: 2.5, knock: 0, roadEvery: 0,
      open: ['party', 'hardware', 'super', 'pharmacy', 'tavern', 'home'],
    },
    collapse: {
      id: 'collapse', from: 21, to: 29, banner: 'COLLAPSE', lootMin: 1, lootMax: 3, danger: 0.40,
      lootMul: 0.45, tradeMin: 2, tradeMax: 4, knock: 0.6, roadEvery: 3,
      open: ['party', 'hardware', 'super', 'pharmacy', 'tavern', 'home'],
    },
    end: {
      id: 'end', from: 30, to: 30, banner: 'THE END', lootMin: 0, lootMax: 0, danger: 1,
      lootMul: 0, tradeMin: 2, tradeMax: 4, knock: 0, roadEvery: 0,
      open: ['home'],
    },
  },

  // Survival odds. actionChance applies these when mode is 'survival'.
  SURVIVAL: {
    zombieStart: 0.28,
    zombiePerDay: 0.045,
    barricadeFight: 0.10,
    barricadeHide: 0.07,
    biscuitHide: 0.08,
    biscuitRun: 0.08,
  },

  WEAPONS: {
    bare_hands: {
      id: 'bare_hands', name: 'Bare hands', short: 'Hands',
      blurb: 'Your hands. Firm handshake, at least.',
      fight: 0, hide: 0, run: 0, bargain: 0,
    },
    snow_shovel: {
      id: 'snow_shovel', name: 'Snow shovel', short: 'Shovel',
      blurb: 'Finally useful in October.',
      fight: 0.12, hide: 0, run: 0, bargain: 0,
    },
    hockey_stick: {
      id: 'hockey_stick', name: 'Hockey stick', short: 'Stick',
      blurb: 'Kevin wants it back.',
      fight: 0.14, hide: 0.04, run: 0.04, bargain: 0,
    },
    skillet: {
      id: 'skillet', name: 'Cast-iron skillet', short: 'Skillet',
      blurb: 'Also cooks. Best item in the game.',
      fight: 0.18, hide: 0, run: 0, bargain: 0.04,
    },
    studded_2x4: {
      id: 'studded_2x4', name: 'Nail-studded 2x4', short: '2x4',
      blurb: 'Dale says it violates HOA rules.',
      fight: 0.22, hide: 0, run: 0, bargain: 0,
    },
    flare_gun: {
      id: 'flare_gun', name: 'Flare gun', short: 'Flare',
      blurb: 'Also signals for help that never comes.',
      fight: 0.28, hide: 0.06, run: 0.08, bargain: 0,
    },
    hunting_rifle: {
      id: 'hunting_rifle', name: 'Hunting rifle', short: 'Rifle',
      blurb: 'Three bullets. Later.',
      fight: 0.4, hide: 0, run: 0, bargain: 0,
      later: true, ammo: 3,
    },
  },

  ROOMS: {
    pantry: {
      id: 'pantry', name: 'Pantry', blurb: 'Shelves of hope, mostly beans.',
      levels: ['Food cap 25.', 'Food cap 45.', 'Food cap 70.'],
    },
    water: {
      id: 'water', name: 'Water Tank', blurb: 'Tastes like a garden hose. Nostalgic.',
      levels: ['Water cap 25.', 'Water cap 45.', 'Water cap 70.'],
    },
    generator: {
      id: 'generator', name: 'Generator', blurb: 'Keeps the bulbs and the radio awake.',
      levels: ['Power, and +1 morale a night.', 'Same hum, less flicker.', 'The radio stays up late.'],
    },
    barricade: {
      id: 'barricade', name: 'Barricade', blurb: 'Planks, a hockey net, and a point of view.',
      levels: ['A little better at FIGHT and HIDE.', 'More boards.', 'The hatch sounds like a door.'],
    },
    grow: {
      id: 'grow', name: 'Grow Room', blurb: 'Mostly potatoes. Mostly.',
      levels: ['+1 food every 3 nights.', '+1 food every 2 nights.', '+1 food every night.'],
    },
    rec: {
      id: 'rec', name: 'Rec Room', blurb: 'One VHS tape. Everyone has opinions about it.',
      levels: ['+1 morale a night.', '+1 morale a night.', '+2 morale a night. Fewer arguments.'],
    },
    faraday: {
      id: 'faraday', name: 'Faraday Closet', blurb: "Larry's dream home. It's a closet.",
      levels: ['Batteries and the radio survive a surge.', 'Clearer radio in the collapse.', 'Clearer still.'],
      tag: 'Might matter more than you think.',
    },
    lead: {
      id: 'lead', name: 'Lead-Lined Room', blurb: 'Heavy. Like your thoughts.',
      levels: ['+10% HIDE at home. Medicine keeps.', '+15% HIDE at home.', '+20% HIDE at home.'],
      tag: 'Might matter more than you think.',
    },
  },

  // Stage 2 balance. Parts 2 and 3 read these numbers. Do not scatter copies.
  CREW: {
    upkeepFood: 1,
    upkeepWater: 1,
    foodDiscount: 0.8,
    foodMin: 1,
    maxNeighbors: 5,
    healthMax: 5,
    healthStart: 4,
    laidUpDays: 2,
    leaveChance: 0.15,
    leaveAfterNights: 2,
    leaveMorale: 2,
    rehireFood: 2,
    guardEach: 0.10,
    guardMax: 0.30,
    larryHide: 0.10,
    larryRight: 0.70,
    larryWorkRight: 0.85,
    larryBatteryEvery: 5,
    daleDiscount: 1,
    daleWorkExtra: 1,
    daleNoticeEvery: 4,
    daleFine: 3,
    violationMoraleAt: 5,
    kowalskiEvery: 4,
    kowalskiFood: 3,
    kowalskiPantryAt: 5,
    kowalskiWorkEvery: 2,
    tinaHeal: 1,
    tinaWorkHeal: 2,
    tinaCureEvery: 3,
    kevinLoot: 1,
    kevinRun: 0.14,
    kevinWorkMorale: 1,
    restHeal: 1,
    restMoralePer: 2,
    soloHaul: 0.60,
    soloKevinHaul: 1,
    soloLoss: { calm: 0, panic: 0.04, collapse: 0.10 },
    soloKevinMul: 0.5,
    soloLaidUpMul: 2,
    soloTinaLoss: 0,
    lossNeglected: 0.05,
    lossNeglectedNights: 3,
    lossGuardCollapse: 0.05,
    lossBarricadeSurvival: 0.08,
    lossFromDay: 11,
    hideByLead: [0.10, 0.15, 0.20],
    growEvery: [3, 2, 1],
  },

  MORALE_RULES: {
    generator: 1,
    rec: [1, 1, 2],
    dale: 1,
    beer: 1,
    bigHaul: 1,
    kevinViewer: 1,
    spectacular: 1,
    neighborLeaves: -1,
    neighborLost: -2,
    emptyStores: -2,
    failedDanger: -1,
    rocketBunker: -1,
    violations: -1,
    collapseDark: -1,
    highAt: 8,
    highOdds: 0.05,
    bonusLoot: 0.22,
    leaveAt: 2,
    stareAt: 1,
    argumentChance: 0.45,
    recArgumentMul: 0.5,
    words: [
      { at: 9, label: 'Weirdly upbeat' },
      { at: 7, label: 'Holding up' },
      { at: 4, label: 'Tense' },
      { at: 2, label: 'Cabin fever' },
      { at: 0, label: 'Staring at the wall' },
    ],
  },

  // Base value, then Calm / Panic / Collapse multipliers. Daily wobble is ±10%, seeded by day.
  TRADE: {
    wobble: 0.10,
    garyBuy: 0.8,
    garyBuyRespect: 0.9,
    garyRespectAt: 3,
    larryFoil: 3,
    larryBattery: 2,
    kevinSnacks: 2,
    stallMin: 0.9,
    stallMax: 1.1,
    goods: {
      food: { base: 2, mul: [1, 1.5, 2.5] },
      water: { base: 2, mul: [1, 1.5, 3] },
      materials: { base: 2, mul: [1, 1.25, 2] },
      medicine: { base: 4, mul: [1, 2, 3] },
      coffee: { base: 3, mul: [1, 2, 4] },
      battery: { base: 3, mul: [1, 2.5, 4] },
      tp: { base: 2, mul: [1, 3, 1.5] },
      gas: { base: 3, mul: [1, 2, 3.5] },
      cigarettes: { base: 2, mul: [1, 1.5, 2] },
      ammo: { base: 4, mul: [1, 2, 3] },
      tinfoil: { base: 1, mul: [1, 1, 1] },
      snacks: { base: 1, mul: [1, 1.5, 2] },
      beer: { base: 2, mul: [1, 1.25, 1.5] },
      rockets: { base: 1, mul: [1, 1, 2] },
      coat: { base: 30, mul: [1, 1.5, 2] },
    },
  },

  ITEMS: {
    tentRockets: [2, 5],
    tentDays: [1, 20],
    partyRockets: [0, 2],
    julyRockets: 6,
    coffeeAction: 1,
    snacksHealth: 1,
    gasNights: 3,
    beerMorale: 1,
    spoil: { calm: 0, panic: 0.05, collapse: 0.12, end: 0 },
    mackinawChance: 0.05,
    mackinawAfter: 6,
    mackinawLoot: 1 / 3,
    mackinawDanger: 0.05,
    // TODO Part 2: the Pine Lake Light heist. Do not build it in Part 1. Beer is a stash item until then.
  },

  ROCKETS: {
    works: 0.55,
    daleHedge: 0.15,
    biscuitHides: 0.15,
    intoBunker: 0.10,
    spectacular: 0.05,
    distressGary: 1,
    distressKevin: 0.30,
    distressTrader: 0.30,
    distressTrouble: 0.40,
  },

  CREDITS: [
    'PREPPER',
    'A game by Jeff (BlueWater78)',
    'Design and tuning: Jeff',
    'Code and art: made with AI (Grok Build and Grok Imagine)',
    'Radio voice of The Last Shift on 88.3: ???',
    'Biscuit: Himself',
    '"No neighbors were harmed in the making of this game. Several were inconvenienced."',
    'Pine Lake Light is not a real beer. Please don\'t look for it.',
    'No hedges were permanently harmed.',
  ],

  COLORS: {
    navy: 0x0f1420,
    navyDeep: 0x070b12,
    rust: 0x8a4b2a,
    orange: 0xff8c28,
    ink: 0x1a120c,
    paper: 0xe6d3ae,
    offWhite: 0xf4efe4,
    text: '#f4efe4',
    textMuted: '#c8bfb2',
    inkCss: '#1a120c',
    orangeCss: '#ff8c28',
    good: '#8fce6a',
    bad: '#e85d4c',
  },

  FONTS: {
    display: '"Bebas Neue", "Oswald", sans-serif',
    heading: '"Oswald", "Bebas Neue", sans-serif',
    radio: '"Special Elite", "Courier New", serif',
    body: '"Inter", "Segoe UI", sans-serif',
  },
};

export const HUD_SCENES = new Set([
  'Radio', 'Map', 'Scavenge', 'Bunker', 'NightSummary', 'Survival',
]);

export function phaseForDay(day) {
  if (day >= 30) return 'end';
  if (day >= 21) return 'collapse';
  if (day >= 11) return 'panic';
  return 'calm';
}

export function phaseInfo(dayOrId) {
  const id = typeof dayOrId === 'number' ? phaseForDay(dayOrId) : dayOrId;
  return CONFIG.PHASES[id] || CONFIG.PHASES.calm;
}

export function daysLeft(day) {
  return Math.max(0, CONFIG.PREP_DAYS - day);
}

export function countdownPhrase(day) {
  if (day >= CONFIG.PREP_DAYS) return 'Today. Probably.';
  const left = daysLeft(day);
  if (left === 1) return '1 day left. Probably.';
  return `${left} days left. Probably.`;
}
