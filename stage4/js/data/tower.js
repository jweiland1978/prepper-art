/**
 * Stage 4 Part B copy: the hidden clues, the Radio Tower climb, the studio, the voice,
 * the two tower endings, and what the radio says on the run after each ending.
 * {name} is the player's name. {voice} is the name of whoever took the mic last time.
 */

// One clue at most per broadcast, never degraded, always wrapped in static so it feels found.
export const CLUE_LINES = {
  1: '...kkhhh... {name}? ...{name}. If that is you, leave the radio on. ...kkhhh...',
  2: '...kkhhh... is Biscuit still wearing the red bandana? ...good. Keep it on him. ...kkhhh...',
  3: "...kkhhh... If you're hearing this, it's not too late. It was for me. ...kkhhh...",
};

// Days a clue can surface. Never the banner days, never Day 30.
export const CLUE_DAYS = [3, 8, 13, 17, 23, 27];

export const TOWER_PIN = {
  kicker: 'RADIO TOWER',
  title: 'The Radio Tower',
  closed: 'Static. And something else. The gate is chained until the town stops pretending. (Day 20.)',
  open: 'The gate is open. The beacon blinks like it is waiting on you.\n\nThe climb takes the rest of the day.',
  noActions: 'The climb takes a whole day. Today is already spent. Come back tomorrow.',
  button: 'CLIMB (ALL ACTIONS)',
};

export const CLIMB_LINES = [
  'The ladder is cold. The rungs are counted by somebody who never finished counting.',
  'Halfway up, Pine Lake is a coin somebody dropped. Lake Orwell is the change.',
  'The shack at the top has a door. The door has a sticky note. It says: "Knock. Or don\'t. I already know."',
];

export const CLIMB_AGAIN = {
  break: 'Somebody broke the loop here once. The chair still faces the door.',
  voice: 'The chair is warm. The mug says 88.3. The handwriting on the sticky note looks like yours.',
};

export const STUDIO_LINES = [
  'The ON AIR light is on. Nobody is in the chair.',
  'A mug. A sticky note. A dog bed with a red paisley bandana folded on it.',
  'The board hums. Then the voice from every morning starts talking. In the room. To you.',
];

// The voice's monologue. {name} is filled in. Typed at 70 ms, one tap per line.
export const MONOLOGUE = [
  '{name}. You made it up the ladder. Good. I was running out of jokes.',
  'I know your name because I said it. Every run. Every morning. Since before you started counting.',
  'Biscuit kept the bandana on. Red paisley. I asked you to. You listened. Nobody listens.',
  'Thirty days, a hatch, a rumor that might be true. Again and again. It is a loop. I am the part that talks.',
  'You can break it. Turn the board off and walk down. Tomorrow the radio is somebody new.',
  "Or you can sit here. Say the sign-off. Somebody down there needs to hear it's not too late.",
  'It was for me. It could be for you.',
];

export const CHOICES = {
  break: { label: 'BREAK THE LOOP', subtitle: 'Turn the board off. Walk down.' },
  voice: { label: 'TAKE THE MIC', subtitle: 'Sit down. Say the sign-off.' },
};

export const ENDINGS = {
  break: {
    kicker: 'BROKE THE LOOP',
    bg: 'bg-tower-dawn',
    lines: [
      'You flip the switch. The ON AIR light thinks about it. Then it goes out.',
      'The ladder down is shorter. Biscuit is waiting at the bottom, bandana on, tail going.',
      'The sun comes up over Pine Lake like nobody told it about any of this.',
      'Tomorrow the radio will be somebody else. You will not know their voice. That is the point.',
    ],
  },
  voice: {
    kicker: 'IT WAS FOR ME',
    bg: 'bg-tower-voice',
    lines: [
      'You sit. The chair fits. The headphones were already warm.',
      'You lean in to the mic. Somewhere below, a radio in a hole in the ground clicks on.',
      "\"This is {name}. If you're hearing this, it's not too late.\"",
      '"It was for me."',
    ],
  },
};

// Next run after BREAK THE LOOP: a stranger hosts. Replaces the usual greeting every morning.
export const STRANGER_GREETINGS = [
  "Uh. Hi. Is this on? This is... the morning show, I guess. The last guy left. I'm Deb. I'm reading what he left taped to the desk.",
  "Morning, Lake Orwell. It's still Deb. The sticky notes are getting weirder. One just says 'feed the dog.' There's no dog.",
  "Deb again. I found the jingle button. I'm not going to push it. I'm scared of it.",
  "This is Deb. Somebody called in to ask where the old voice went. I don't know. Nobody tells the new girl anything.",
];

export const STRANGER_SIGNOFF = "That's the show. I think. Deb, signing off. Somebody please tell me how the sign-off goes.";

// Next run after IT WAS FOR ME: Day 1 opens with your own sign-off.
export const OWN_SIGNOFF = "This is {voice}, on the overnight. If you're hearing this, it's not too late. It was for me.";

// Ham Shack level 3. Lies are always STATIC, so CHECKED is never wrong.
export const HAM_TAGS = {
  checked: 'CHECKED',
  static: 'STATIC',
};

export const HAM_LINES = {
  checked: 'From the ham shack: a trucker two counties over says the morning rumor holds up. CHECKED.',
  static: 'From the ham shack: nobody on the band can back up the morning rumor. STATIC.',
};

// Gary. Blunt tips in the night report (one some nights).
export const GARY_TIPS = [
  'Gary: "Water first. You heard me."',
  'Gary: "Your barricade is a suggestion. Make it a sentence."',
  'Gary: "Stop guessing the end of the world off one rumor. Write them down."',
  'Gary: "Larry\'s FAKE stamp is right. Do not tell him I said that."',
  'Gary: "A full pantry is a mood. A full water tank is a plan."',
  'Gary: "Do not go out on an empty day. Go out on a dumb day."',
  'Gary: "The dog eats first. That is not a tip. That is a rule."',
];

export const GARY_PIN = {
  ask: 'ASK HIM IN',
  askBody: "The gate is unlatched. Gary is on the porch with a level, checking the porch.\n\nHe trades water, planks, medicine, gas, batteries, and sometimes ammo. He does not haggle.\n\nYou could ask him to move in. He has been waiting for you to ask. He will deny that.",
};
