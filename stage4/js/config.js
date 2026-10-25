/** Balance, copy constants, and presentation tokens. All tuneable numbers live here. */
export const CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  HUD_H: 78,

  SAVE_KEY: 'prepper_s4_save',
  SETTINGS_KEY: 'prepper_s4_settings',
  META_KEY: 'prepper_s4_meta',
  // Stage 3 keys are read once when the stage 4 key is missing. Never written. Never deleted.
  LEGACY_SAVE_KEY: 'prepper_s3_save',
  LEGACY_SETTINGS_KEY: 'prepper_s3_settings',
  LEGACY_META_KEY: 'prepper_s3_meta',
  SAVE_VERSION: 4,
  STAGE_LABEL: 'STAGE 4 PREVIEW',
  // Achievements unlock after this many finished runs (win or loss). Tracked silently before.
  ACH_UNLOCK_AFTER: 2,
  // How long an achievement toast stays up (tap it to dismiss sooner).
  ACH_TOAST_MS: 9000,
  // Stage 4 Part A starting perks (plan section 10 item 8).
  PERKS: { cansFood: 4, hoseWater: 4, loyaltyDiscount: 1, neighborlyDay: 3 },

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
  AI_CREDIT: 'Made with AI: Grok Build / Grok Imagine. Design and tuning by Jeff (BlueWater78).',
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

  // Secret until Day 30. The only reader is apocalypseOf() in js/rumors.js.
  APOCALYPSES: [
    { id: 'zombies', name: 'Zombies', weight: 1 },
    { id: 'solarflare', name: 'Solar Flare', weight: 1 },
    { id: 'robots', name: 'Robots', weight: 1 },
    { id: 'meteor', name: 'Meteor', weight: 1 },
    { id: 'bigmoon', name: 'Big Moon', weight: 1 },
  ],

  // Chance the morning rumor points at a different apocalypse.
  // Day 30 stays a true clue. The show gets more honest as the month runs out.
  RUMOR_LIE_ODDS: {
    calm: 0.25,
    panic: 0.15,
    collapse: 0.05,
    end: 0,
  },

  // Larry only rolls this on a real lie. A true clue is never stamped.
  LARRY_STAMP_CHANCE: 0.5,

  // Notebook guess, added in buildScore. The ending card can show it after Day 30.
  SCORE_GUESS_BONUS: 24,

  // Survival room counters. Values are per room level (depth is per lower-row room).
  // Armory in the doc is the Barricade. Generator lists no robots row: no bonus, no penalty.
  APOC_COUNTERS: {
    pantry: {
      all: { threat: 0.02 },
    },
    water: {
      meteor: { threat: 0.03, hide: 0.03 },
    },
    lead: {
      solarflare: { threat: 0.03, hide: 0.04 },
      meteor: { threat: 0.03, hide: 0.04 },
    },
    barricade: {
      zombies: { fight: 0.04, hide: 0.03 },
    },
    faraday: {
      solarflare: { threat: 0.04, hide: 0.03, run: 0.03 },
      robots: { threat: 0.04, fight: 0.03, hide: 0.03 },
    },
    grow: {
      bigmoon: { threat: 0.03, bargain: 0.04 },
    },
    rec: {
      all: { ready: 1 },
    },
    // Part B: better warning on the band, a little less danger at home.
    hamshack: {
      all: { threat: 0.02 },
    },
    generator: {
      zombies: { threat: 0.03 },
      solarflare: { threat: 0.03 },
      meteor: { threat: 0.03 },
      bigmoon: { threat: 0.03 },
    },
    depth: {
      meteor: { threat: 0.02, hide: 0.02 },
    },
  },

  // Survival odds. actionChance applies these when mode is 'survival'.
  SURVIVAL: {
    zombieStart: 0.28,
    zombiePerDay: 0.03, // Oct 25 balance: was 0.045
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
    // Stage 4 Part B. Only on the build menu once the unlock track reaches it (unlock 'hamshack').
    hamshack: {
      id: 'hamshack', name: 'Ham Shack', blurb: 'A bigger antenna. Better company. Worse posture.',
      levels: ['+1 morale every 3 nights.', '+1 morale every 2 nights.', 'Checks one rumor a day: CHECKED or STATIC.'],
      tag: 'Larry is jealous. He will help anyway.',
      unlock: 'hamshack',
    },
  },

  // Part B Ham Shack numbers. Level 3 tags the morning rumor; a lie is always STATIC.
  HAM_SHACK: {
    moraleEvery: [3, 2, 2],
    tagLevel: 3,
  },

  // Stage 2 balance. Parts 2 and 3 read these numbers. Do not scatter copies.
  CREW: {
    upkeepFood: 1,
    upkeepWater: 1,
    foodDiscount: 0.8,
    foodMin: 1,
    maxNeighbors: 6, // Part B: room for Gary. Full House still needs fullHouseAt.
    fullHouseAt: 5,
    garyWater: 1,
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

  // Oct 25 balance pass (Jeff approved). Trip/night danger odds; survival keeps its own block above.
  COMBAT: {
    base: { fight: 0.58, hide: 0.56, bargain: 0.42, run: 0.84 }, // fight was 0.50
    dangerMul: 0.35,
    min: 0.08,
    max: 0.93,
    streakAfter: 3, // fight losses in a row before the bonus kicks in
    streakBonus: 0.10, // +10% on FIGHT until the next fight win
  },
  WATER: {
    tankNight: 1, // a built Water Tank (level 1+) adds this much water every night
  },
  ITEMS: {
    tentRockets: [2, 5],
    tentDays: [1, 20],
    partyRockets: [0, 2],
    julyRockets: 6,
    coffeeAction: 1,
    snacksHealth: 1,
    medicineHealth: 3, // you: +3 health per bottle (Tina doubles it)
    medicineCrew: 2, // a neighbor: +2 health per bottle (Tina doubles it)
    gasNights: 3,
    beerMorale: 1,
    spoil: { calm: 0, panic: 0.05, collapse: 0.12, end: 0 },
    mackinawChance: 0.05,
    mackinawAfter: 6,
    mackinawLoot: 1 / 3,
    mackinawDanger: 0.05,
  },

  // The Bait & Brew job. Beer stays a minor stash item until the first heist.
  // Every heist number lives here so a pass can be tuned without hunting.
  HEIST: {
    fromDay: 3,
    max: 2,
    cooldown: 5,
    // Run 1 pays 6. Run 2 pays double.
    haul: [6, 12],
    // Run 2: the meter starts half full. FAST is the wrong step and catches.
    alertStart: 50,
    alertMul: 1,
    run2CatchFast: true,
    careful: [3, 9],
    fast: [18, 28],
    creaky: 10,
    skip: 0.45,
    caughtMorale: -1,
    caughtMoraleRun2: -2,
    respectPenalty: 2,
    respectPenaltyRun2: 3,
    priceBump: 1,
    larryBeer: 4,
    // Caught on run 2. Beer percent is inclusive; the take uses Math.ceil.
    searchChance: 0.88,
    searchBeerPct: [50, 70],
    searchLootChance: 0.5,
    searchLootMax: 1,
    // Bigger than the run-2 caught hit, stacked on top of it.
    searchMorale: -3,
    searchRespect: 4,
    // Run 2 back door. trapFill 100 fills the meter and catches.
    trapChance: 0.5,
    trapFill: 100,
    // Dougie from the boat launch. Bribe: 1 can, no noise, always works.
    dougieChance: 0.4,
    dougieFreezeRisk: 0.55,
    dougieFreezeNoise: 18,
    dougieWaitRisk: 0.35,
    dougieWaitNoise: 12,
    bribeCost: 1,
    bribeWorks: true,
    bribeNoise: 0,
    // Larry at Rusty's after a heist. Calm prefers a can, then another good.
    larryCalmBeer: 1,
    larryRideMorale: -1,
    larryRideRespect: 1,
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
