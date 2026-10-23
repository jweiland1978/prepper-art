/** Trader copy, stall tables, mayhem lines, notice forms. Prices stay in CONFIG.TRADE. */

export const GARY_LINES = [
  'Water first. Then we talk. Then we talk less.',
  'The gate is open. My patience is not a crop.',
  'Bring something useful. Opinions are not useful.',
  'I price things the way weather prices a roof.',
  'You can look. Looking is free. Leaving with it is not.',
  'Fair is when I do not sigh. I am close.',
];

export const GARY_FENCE = [
  'You traded a can of coffee for a can of beans. You know that\'s a bad deal. I know that\'s a bad deal.',
  'The fence is still a fence. Try to keep fireworks on your side of it.',
  'I saw the lights. I did not come over. That was a choice.',
  'Beans are beans. Stop negotiating with beans.',
  'If the tank is full, say so. If it is not, do not wave.',
];

export const GARY_SHORT = 'Gary is not running a charity. Gary is barely running a farm.';
export const GARY_FOIL = 'No.';
export const GARY_BEER = "Not while I'm working.";
export const GARY_COAT = "It was my dad's. I have three.";

export const LARRY_LINES = [
  'The foil is the point. The rest is packaging.',
  'I will pay in snacks and structural materials. The government will not.',
  'That map is of the sewers. The sewers are a loading dock. Details.',
  'Batteries are how the truth stays charged.',
  'I am not haggling. I am correcting the market.',
  'Hold the foil up to the light. You will not see what I see. That is fine.',
];

export const KEVIN_LINES = [
  'Two snack cakes. One tip. I do not take cards.',
  'The aisle is the joke. I am just holding the phone.',
  'I know a shelf. I know a bad corner. Pick a currency. Snacks.',
  'This is a side hustle. The main hustle is staying indoors.',
  'Bro. Can I film it?',
  'I will not explain the tip twice. The snack cakes already did.',
];

export const KEVIN_FILM = [
  "Do it again, I wasn't recording.",
  "That's going to get, like, eleven views.",
  'The framing was brave. The rocket was also brave.',
];

export const COAT_LINES = {
  larry: "That's not a coat, that's a statement.",
  kowalski: "My Stanley had one. Don't spill on it.",
  dale: "Technically that's outerwear in a residential zone. I'll allow it.",
  tina: "Finally, something in this town that won't break.",
  kevin: 'Bro. Can I film it?',
};

export const STALLS = [
  {
    id: 'bait', name: 'The Bait Guy', modSalt: 1,
    goods: ['food', 'beer', 'coffee', 'snacks'],
    lines: [
      'Minnows are a rumor. Cans are a fact.',
      'I used to sell bait. Now I sell whatever fits in the cooler.',
      'Pine Lake is right there. So is my price.',
      'No live bait. The live part clocked out.',
      'Coffee if you ask like a person with a boat.',
    ],
  },
  {
    id: 'church', name: 'Church Ladies', modSalt: 2,
    goods: ['food', 'water', 'tp', 'medicine'],
    lines: [
      'We labeled the boxes. The boxes have other ideas.',
      'Take a can. Leave a can. Or leave a story. Stories are thin.',
      'The rummage table does not do credit.',
      'Toilet paper is in the hymnals. Do not ask.',
      'We are not haggling. We are blessing the exchange.',
    ],
  },
  {
    id: 'duane', name: 'Some Guy Named Duane', modSalt: 3,
    goods: ['materials', 'gas', 'cigarettes', 'ammo'],
    lines: [
      'Duane is a name and a folding table. Both work.',
      'Gas cans are half full. Duane is half sure.',
      'I do not know you. The plank does not care.',
      'Ammo for a rifle you might have later. I respect the optimism.',
      'If it fits in a pocket, it has a price. So does the pocket.',
    ],
  },
  {
    id: 'pete', name: 'Pole Barn Pete', modSalt: 4,
    goods: ['materials', 'battery', 'gas', 'tinfoil'],
    lines: [
      'The pole barn had a hierarchy. Tools, then people.',
      'Batteries in the coffee can. The coffee left years ago.',
      'I will trade a plank for a future plank. Kidding. I want a can.',
      'Foil is foil. I am not Larry. I am merely adjacent.',
      'Cash is a hobby now. Goods are the job.',
    ],
  },
  {
    id: 'cousin', name: "Rusty's Cousin", modSalt: 5,
    goods: ['beer', 'food', 'snacks', 'cigarettes'],
    lines: [
      'Rusty left the keys. I left the jukebox alone. We are even.',
      'Silver cans on the left. Opinions on the right. Opinions are free.',
      'The plaid jacket on the table is not for sale. Ask me anyway.',
      'Light beer goes far. So does a rumor, if you feed it.',
      'I am watching the door and the cooler. Both are a hobby.',
    ],
  },
  {
    id: 'cans', name: 'The Can Lady', modSalt: 6,
    goods: ['food', 'water', 'snacks', 'coffee'],
    lines: [
      'Every can faces forward. It is how I sleep.',
      'Labels out. Prices up. That is the whole religion.',
      'Coffee is ground. I checked. I always check.',
      'If you dent a can, you buy the dent.',
      'I do not sell the jacket. I sell what the jacket is sitting near.',
    ],
  },
  {
    id: 'mechanic', name: 'A Quiet Mechanic', modSalt: 7,
    goods: ['gas', 'battery', 'materials', 'ammo'],
    lines: [
      'I fix things that used to start. Some of them still might.',
      'Gas is the sentence. The rest is punctuation.',
      'I do not do small talk. I do spark plugs. We are out of spark plugs.',
      'A battery is a promise with a date on it.',
      'Put it on the tray. I will look at it like a carburetor.',
    ],
  },
];

export const MAYHEM_LINES = {
  works: [
    'Textbook. Nobody has ever been prouder of a two-dollar firework.',
    'It goes up. It comes down as a good decision. Rare.',
    'A clean whistle, a clean pop, and a clean conscience. Two out of three.',
  ],
  hedge: [
    "Dale's hedge catches a spark. The hedge will recover. Dale's paperwork will not.",
    'The hedge files a complaint in advance. Dale will make it official by morning.',
    'A small, personal fire. The hedge is fine by sunrise. Emotionally, no.',
  ],
  biscuit: [
    'Biscuit is fine. Biscuit is offended.',
    'Biscuit goes under the cot like the cot owes him rent. He is not hurt. He is reviewing you.',
    'The bandana stays on. The dog stays under the cot. Both are correct.',
  ],
  bunker: [
    'It hangs a U-turn and comes inside to think. One room gets a scorch mark. Nobody gets a scratch.',
    'The rocket chooses the bunker. The bunker did not apply. A mark on the wall, and that is all.',
    'Back indoors, rude about it. A scorch, a sigh, and zero injuries.',
  ],
  spectacular: [
    'The whole town saw it. Somebody clapped.',
    'It draws a perfect line and then a perfect ending. You allow yourself one smile.',
    'For three seconds Lake Orwell has a skyline. Then it is just a Tuesday again.',
  ],
};

export const LIGHT_LINES = {
  stranger: [
    'They reconsider their evening and leave at a jog. Nothing is broken. Pride is elsewhere.',
    'The rocket makes the point. The stranger takes the point somewhere else.',
    'They flee. You keep your bag and your lack of a plan.',
  ],
  zombie: [
    'They scatter like the idea was yours. The attack does not happen. You stay put.',
    'A whistle, a pop, and the yard is empty of company. No loss. No trophy.',
    'They wander off after the light. You do not follow. Correct.',
  ],
  crowd: [
    'The crowd turns as one. You turn toward the shelf. This trip comes back heavier.',
    'You buy a minute of chaos and spend it on the aisle. The haul doubles.',
    'Everybody watches the ceiling. You watch the shelf. The shelf loses.',
  ],
  raccoon: [
    'The raccoon leaves, deeply offended. The pantry is yours again. The raccoon will write about this.',
    'It stares, it judges, it exits. Nothing was bitten. Something was insulted.',
    'The raccoon takes the complaint outside. You keep the latch and the dignity, barely.',
  ],
  fizzle: [
    'The rocket comes home early. The problem outside does not get the memo.',
    'Pretty, indoor, useless. The trouble is still trouble.',
    'You lit it. It declined the assignment.',
  ],
};

export const NOTICE_FORMS = [
  { id: 'hole', rule: 'Section 4(b): Excessive Hole.' },
  { id: 'hedge', rule: 'Section 9: Fireworks Adjacent to Hedge.' },
  { id: 'optimism', rule: 'Section 12: Suspicious Optimism.' },
  { id: 'latch', rule: 'Section 2: Unlicensed Latch.' },
  { id: 'beans', rule: 'Section 7: Beans Without a Permit.' },
];

export const DISTRESS_LINES = {
  gary: 'Gary comes through the yard like the yard asked. Once. He will not make a habit of it.',
  kevin: 'Kevin was already nearby. He has snack cakes and a camera. He shares the cakes.',
  hatch: 'Somebody respectable enough knocks. They have a tray and no small talk.',
  trouble: 'The rocket works. So does the attention. A looter liked the show.',
  fizzle: 'The distress rocket comes back inside. Nobody out there takes the hint.',
};
