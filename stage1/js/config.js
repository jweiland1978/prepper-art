/** Balance, copy constants, and presentation tokens. All tuneable numbers live here. */
export const CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  HUD_H: 78,

  SAVE_KEY: 'prepper_save_v1',
  SETTINGS_KEY: 'prepper_settings_v1',
  SAVE_VERSION: 1,

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
    calm: { id: 'calm', from: 1, to: 10, banner: 'CALM BEFORE', lootMin: 3, lootMax: 6, danger: 0.10 },
    panic: { id: 'panic', from: 11, to: 20, banner: 'PANIC BUYING', lootMin: 2, lootMax: 4, danger: 0.25 },
    collapse: { id: 'collapse', from: 21, to: 29, banner: 'COLLAPSE', lootMin: 1, lootMax: 3, danger: 0.40 },
    end: { id: 'end', from: 30, to: 30, banner: 'THE END', lootMin: 0, lootMax: 0, danger: 1 },
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
    pantry: { id: 'pantry', name: 'Pantry', blurb: 'Shelves of hope, mostly beans.' },
    water: { id: 'water', name: 'Water Tank', blurb: 'Tastes like a garden hose. Nostalgic.' },
    generator: { id: 'generator', name: 'Generator', blurb: 'Keeps the bulbs and the radio awake.' },
    barricade: { id: 'barricade', name: 'Barricade', blurb: 'Planks, a hockey net, and a point of view.' },
  },

  CREDITS: [
    'PREPPER',
    'A game by Jeff (BlueWater78)',
    'Design and tuning: Jeff',
    'Code and art: made with AI (Grok Build and Grok Imagine)',
    'Radio voice of The Last Shift on 88.3: ???',
    'Biscuit: Himself',
    '"No neighbors were harmed in the making of this game. Several were inconvenienced."',
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
