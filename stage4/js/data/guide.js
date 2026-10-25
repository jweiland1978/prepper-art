/**
 * Stage 4 Part C: Field Guide copy. Jeff can retune any line here.
 * Apocalypse pages have two halves: SEEN opens at that apocalypse's Day 30 reveal,
 * SURVIVED (tips, in the Last Shift voice) opens the first time you win it.
 * No page ever names an apocalypse you haven't seen yet.
 */

export const GUIDE_TABS = [
  { id: 'apoc', label: 'THE ENDS' },
  { id: 'nbr', label: 'NEIGHBORS' },
  { id: 'room', label: 'ROOMS' },
  { id: 'radio', label: 'RADIO' },
  { id: 'back', label: 'BACK PAGE' },
];

export const APOC_PAGES = {
  zombies: {
    seen: "They walk like a diagram and they do not knock. The radio spent a month talking about moaning on Pine Road and I spent a month saying it was the wind. It was not the wind.",
    survived: "From the booth: boards first. A Barricade makes FIGHT and HIDE better, and the Generator keeps the night quieter. They hear arguments, so keep morale up. Keep the hatch shut. I mean it. Shut.",
  },
  solarflare: {
    seen: "The sky went green, then red, then it stopped pretending that was weather. Everything with a plug had a bad day. The day itself has opinions now, and they are hot.",
    survived: "From the booth: the Faraday Closet is not a joke anymore, tell Larry. Lead lining helps you HIDE. Do not go up in the daylight. Batteries in the closet, radio in the closet, you near the closet.",
  },
  robots: {
    seen: "The porch lights blinked in a pattern and the mower joined a conversation at the curb. The toaster asked a question. Twice. That is how you know.",
    survived: "From the booth: anything with a chip is a witness. The Faraday Closet helps you FIGHT and HIDE, and keeps the threat down. Manual tools still work. Panic is a language they speak, so speak something else.",
  },
  meteor: {
    seen: "A streak, a boom that was not a truck, then dust in the vent and a well that tastes like a penny. The sky filed the paperwork. The surface practiced winter in October.",
    survived: "From the booth: go deep. Lower rooms help, and so do lead lining and a full Water Tank. It gets cold, so wear the coat. The aftershocks are the county clearing its throat. Let it.",
  },
  bigmoon: {
    seen: "The moon came closer. That was the whole trick. Tides up the dock, frost in spirals, shadows too long for the porch light. It takes up a rude amount of sky.",
    survived: "From the booth: this one takes a while, so food is a long-term relationship. A Grow Room keeps the threat down and helps you bargain. Wear the coat. Do not stare. It stares back politely.",
  },
};

export const BISCUIT_PAGE = {
  title: 'BISCUIT',
  body: "Good boy. Red bandana, always. Already home when you get here, and never leaves.\n\nBarks when trouble is close. His warning helps you HIDE or RUN. Ask him anything in the bunker. He will listen like it matters, because to him it does.",
};

export const ROOM_HELP_WORDS = {
  threat: 'less danger',
  hide: 'HIDE',
  fight: 'FIGHT',
  run: 'RUN',
  bargain: 'bargaining',
  ready: 'readiness',
};

export const RADIO_PAGE = {
  title: 'THE LAST SHIFT, 88.3',
  intro: 'The station that never signs off. Write down anything that did not sound like the regular show.',
  clueLocked: '...kkhhh... (nothing yet)',
  towerLocked: 'THE TOWER: ???',
  towerSeen: 'THE TOWER: You climbed it. Somebody was already at the mic.',
};

export const BACK_PAGE = {
  title: 'BACK PAGE',
  note: 'Pages fill in as you go. Meet it, build it, hear it, survive it.',
};

export const LOCKED_LINES = {
  apoc: 'Not seen yet. Something ends the world on Day 30. It is not on this page yet.',
  nbr: 'Not met yet. Somebody in town might move in.',
  room: 'Not built yet. Dig a room to fill this in.',
};

