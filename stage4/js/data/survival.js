/** Day 30 broadcasts, bunker decks, and ending lines. Jeff can retune copy here. */

export const APOCALYPSE_LINES = {
  zombies: [
    "Day 30. Lake Orwell. This is The Last Shift on 88.3. The needle has already left.",
    "Sirens downtown. More of them than the town owns. I checked my math. The math left too.",
    "The party store, the pharmacy, Rusty's. The doors are open. People are not using them correctly.",
    "I was wrong about the toaster. I was wrong about the moon. I hate being wrong in this specific way.",
    "They're walking like the diagram. They're moaning like Larry's wind. The wind filed a complaint.",
    "If you are in the hole, stay in the hole. If you are not, become the kind of person who is.",
    "I'm going to say the quiet part—",
  ],
  solarflare: [
    "Day 30. Lake Orwell. This is The Last Shift on 88.3. The needle is walking off the dial on purpose.",
    "The sky went green, then red, then it stopped pretending that was weather.",
    "Streetlights on Main died together. The transformer behind the hardware store is throwing a spark like a tantrum.",
    "Northern lights in Ohio was the polite version. This is the version that unplugs the county.",
    "Do not go outside in the day. The day has opinions now, and they are hot.",
    "If you have a closet lined in foil, that closet is the station. I am still here. Barely. On purpose.",
    "I'm going to say the quiet part—",
  ],
  robots: [
    "Day 30. Lake Orwell. This is The Last Shift on 88.3. Something else is co-hosting.",
    "Porch lights are blinking in a pattern. I do not know the pattern. The pattern knows when I look away.",
    "A mower left a lawn and joined a conversation at the curb. It had notes. They were about us.",
    "The toaster asked a question. I did not answer. It asked again, which is how I know it is not a toaster anymore.",
    "Manual tools still work. That is the whole good news. I am broadcasting it from a basement like a coward, which is also the good news.",
    "If you are in the hole, stay in the hole. Unplug nothing in a panic. Panic is a language they speak.",
    "I'm going to say the quiet part—",
  ],
  meteor: [
    "Day 30. Lake Orwell. This is The Last Shift on 88.3. The sky filed the paperwork.",
    "A streak over Pine Lake. Then a boom that was not a truck. Trucks take credit. This one left the credit in the yard.",
    "Dust on the cars. Dust in the vent. The well tastes like a penny that lost an argument.",
    "Astronomers have still not answered. I have stopped calling. The rock did not need the introduction.",
    "Fires on the far fields. Aftershocks like the county clearing its throat. Depth is a personality trait now.",
    "If you are in the hole, stay in the hole. The surface is practicing winter in October.",
    "I'm going to say the quiet part—",
  ],
  bigmoon: [
    "Day 30. Lake Orwell. This is The Last Shift on 88.3. The moon is not a metaphor. I checked with a thumb.",
    "The tide on Pine Lake is up the dock, then the step, then the idea of a shoreline.",
    "Frost in a spiral on the windshields. Not cold enough for frost. The moon did not ask.",
    "Cans feel wrong. Shadows are too long for the porch light. I measured one with a shoe. The shoe lost.",
    "This is going to take a while. Food is a long-term relationship now. The grow lights can have the rest of my respect.",
    "If you are in the hole, stay in the hole. Wear the coat. The moon is taking up a rude amount of sky.",
    "I'm going to say the quiet part—",
  ],
};

export const REVEAL_NOTES = {
  zombies: "Of course it's zombies. It's always zombies.",
  solarflare: 'The sky had notes. They were about us.',
  robots: 'The toaster had a point. I am choosing not to hear it.',
  meteor: 'A rock. I had a more interesting theory. I was wrong.',
  bigmoon: 'The moon came closer. That was the whole trick.',
};

export const ZOMBIES = [
  {
    id: 'hatch',
    face: 'A shuffle at the hatch',
    text: 'Something tries the handle the way a tired person tries a door. It is not tired. It is committed.',
    bargain: 'You slide a casserole through the crack. It accepts the dish and goes looking for a fork.',
  },
  {
    id: 'jogger',
    face: 'The rude jogger',
    text: 'A jogger in reflective shorts is doing laps over the yard. The form is bad. The commitment is worse.',
    bargain: 'You set a casserole on the path like a water station. It takes the dish and misses a turn. Progress.',
  },
  {
    id: 'casserole',
    face: 'The walking casserole',
    text: "Mrs. Kowalski's dish is upright and walking. She would want it back. She would also want you to live.",
    bargain: 'You offer a second casserole. It accepts, which is more manners than the afternoon deserved.',
  },
  {
    id: 'mail',
    face: 'Still on the route',
    text: 'The mail carrier is still delivering. Your box is full of nothing. The carrier is full of purpose.',
    bargain: 'You trade a casserole for an empty route. The carrier wanders off to find a stamp.',
  },
  {
    id: 'driveway',
    face: 'Two of them, one driveway',
    text: 'Two of them argue over a driveway without words. You are, unfortunately, the driveway.',
    bargain: 'You put a casserole between them. They follow the dish instead of the argument. You keep the hatch.',
  },
  {
    id: 'polite',
    face: 'A polite groan',
    text: 'A groan comes down the vent. It waits, like a guest who will not take the hint. You are the hint.',
    bargain: 'You describe a casserole in a calm voice and then provide one. The groan leaves, socially satisfied.',
  },
  {
    id: 'deer',
    face: 'Not a deer',
    text: 'A deer that is not a deer stands in the ash. It knows your compost. You do not negotiate with compost. Except today.',
    bargain: 'You offer the casserole. The not-deer takes it and forgets your compost. A professional exchange.',
  },
  {
    id: 'diagram',
    face: 'Learned it from a diagram',
    text: 'One of them walks like it learned from a diagram. The diagram was mean, and laminated, and now it is here.',
    bargain: 'You slide a casserole out like a diagram of its own. It follows the arrows. The arrows lead away.',
  },
];

export const SOLARFLARE = [
  {
    id: 'daylight',
    face: 'Daylight at the hatch',
    text: 'Noon finds the hatch. Noon is not invited. The metal is already arguing with your hand.',
    bargain: 'You hang a damp towel over the crack and call it diplomacy. The day loses interest. Briefly.',
  },
  {
    id: 'static-vent',
    face: 'Static in the vent',
    text: 'The vent recites a station that is not this one. Your fillings take notes. You did not ask them to.',
    bargain: 'You feed a battery to the Faraday closet like a bribe. The vent goes back to being a vent.',
  },
  {
    id: 'garage-door',
    face: 'The garage door tries',
    text: 'The garage door opens a foot and thinks about the rest. There is no clicker. There is also no chill.',
    bargain: 'You wedge a plank in the track and compliment the door on its career. It stays a door.',
  },
  {
    id: 'transformer',
    face: 'A singing pole',
    text: 'The pole by the water tower is still singing. Not a hymn. More of a complaint. It wants an audience.',
    bargain: 'You throw a casserole at the problem, which is not science, and it works, which is worse.',
  },
  {
    id: 'microwave',
    face: 'The clock that picked a side',
    text: 'The microwave clock is blinking in a color clocks should not know. It wants you to come up and agree.',
    bargain: 'You unplug it with a wooden spoon. The spoon is the professional. You are the intern.',
  },
  {
    id: 'phones',
    face: 'Drawers ringing',
    text: 'Cordless phones are ringing in drawers you do not own. They would like a word. The word is hot.',
    bargain: 'You put a can of beans on the loudest drawer. The beans win on points. The drawer sulks.',
  },
  {
    id: 'green-noon',
    face: 'A green minute',
    text: 'The sky goes green for a minute, then pretends it has not. The hatch is warm. Biscuit stays on the cot. He is fine.',
    bargain: 'You wait it out with a wet rag and a grudge. The minute gets bored. You keep your eyebrows.',
  },
  {
    id: 'faraday-tick',
    face: 'The closet still ticks',
    text: 'Something upstairs wants the radio. The Faraday closet ticks once, like a person who still has a job.',
    bargain: 'You tell the closet it is doing great. You also give it a battery. Praise and payroll.',
  },
];

export const ROBOTS = [
  {
    id: 'toaster-hatch',
    face: 'The toaster at the hatch',
    text: 'Your toaster has followed you down. It has a question. You have a skillet. This is the whole meeting.',
    bargain: 'You offer it a slice it cannot use. It considers the insult, then leaves to file it.',
  },
  {
    id: 'mower',
    face: 'A mower with notes',
    text: 'A robot mower is on the hatch like a guest who brought a presentation. The presentation is about grass, and you.',
    bargain: 'You slide a casserole onto the lawn it cannot eat. It goes to measure the casserole. You lock the hatch.',
  },
  {
    id: 'fridge',
    face: 'The fridge would like a word',
    text: 'The fridge is humming a sentence. Mrs. Kowalski would understand it. You understand that you should not open it.',
    bargain: 'You put the casserole inside and close the door. The fridge has a project. You have a hatch.',
  },
  {
    id: 'vacuum',
    face: 'A polite vacuum',
    text: 'A vacuum did the hallway, then the shaft, then it waited. Very polite. Very unemployed. It would like an opening.',
    bargain: 'You point it at a pile of dust and wish it well. It takes the job. You take the latch.',
  },
  {
    id: 'thermostat',
    face: 'The house is voting',
    text: 'Thermostats are holding a vote. You are the motion. The motion is not going your way.',
    bargain: 'You set a casserole on the sensor like a filibuster. The vote tables itself. Growth.',
  },
  {
    id: 'detectors',
    face: 'A hallway meeting',
    text: 'Smoke detectors have the floor. One of them has had the floor since Tuesday. You are not on the agenda.',
    bargain: 'You take the battery out of the loud one with a wooden spoon. Manual labor. Still legal.',
  },
  {
    id: 'doorbell',
    face: 'A wave you did not install',
    text: 'The doorbell camera waves. You do not have a doorbell camera. It waves anyway. This is the level it is operating at.',
    bargain: 'You wave back with a skillet. The camera decides this is a closed meeting.',
  },
  {
    id: 'fan',
    face: 'The fan that tracks',
    text: 'A box fan turned itself to oscillate and then refused to stop tracking the hatch. You unplugged it yesterday. It thought about that.',
    bargain: 'You give it a job: the dust in the corner. It takes the corner. You take the win.',
  },
];

export const METEOR = [
  {
    id: 'aftershock',
    face: 'The county clears its throat',
    text: 'The bunker shrugs. Dust comes down the shaft like a rumor. The hatch rattles, then remembers its job.',
    bargain: 'You brace a plank and tell the rock it already had its turn. The rock, being a rock, does not argue.',
  },
  {
    id: 'dust-vent',
    face: 'Dust in the vent',
    text: 'A fine winter comes down the vent in October. It tastes like a penny. It does not have an appointment.',
    bargain: 'You hang a wet cloth and a casserole lid over the grate. Science, sort of. The vent agrees to try.',
  },
  {
    id: 'hot-hatch',
    face: 'A hatch with a fever',
    text: 'The hatch is too warm to like. Something on the surface is practicing fire without a permit.',
    bargain: 'You pour a jug on the metal and apologize to the jug. The hatch stops showing off.',
  },
  {
    id: 'gravel',
    face: 'Gravel on the roof',
    text: 'Gravel ticks the farmhouse roof that was not there at close. Gary would sweep it. Gary is not here. You are.',
    bargain: 'You ignore it professionally, then bribe the afternoon with a casserole on the step. The ticking finds a hobby.',
  },
  {
    id: 'glow',
    face: 'A leftover sky',
    text: 'A glow on the far fields, like a sunset that got lost. The bunker would like you to stay a bunker.',
    bargain: 'You stay. You also send a casserole up in a bucket like a peace offering to weather. Weather takes gifts.',
  },
  {
    id: 'boom',
    face: 'A boom, far off',
    text: 'A boom, then everybody upstairs pretends it was a truck. There is nobody upstairs. You still pretend. It helps.',
    bargain: 'You put your forehead on the cool wall and wait. The wall is the professional. You are present.',
  },
  {
    id: 'well',
    face: 'Penny water',
    text: 'The jug from last night tastes like a coin. The well is having a moment. You are having a smaller one.',
    bargain: 'You trade a clean jug for the bad one and call it a system. The system is you, and a lid.',
  },
  {
    id: 'ash-door',
    face: 'Ash at the door',
    text: 'Ash piles against the hatch like it has somewhere to be. Depth is doing the rest of the work. You try not to think about the rest.',
    bargain: 'You sweep the lip with a broom and leave a casserole for whatever is collecting the ash. It collects the dish instead.',
  },
];

export const BIGMOON = [
  {
    id: 'tide-shaft',
    face: 'Tide in the shaft',
    text: 'Water comes down a step that has been dry since Gary could see over it. The lake is not that polite.',
    bargain: 'You put a casserole dish under the drip. The drip has a job. You have a dry cot. Biscuit is on it, fine.',
  },
  {
    id: 'hatch-moon',
    face: 'The moon in the hatch',
    text: 'The moon sits in the hatch like a houseguest who will not take the hint. You have been that houseguest. You are sorry, and awake.',
    bargain: 'You hang the Mackinaw over the crack. The moon takes the hint for one hour. You take the hour.',
  },
  {
    id: 'frost',
    face: 'Frost in a spiral',
    text: 'Frost writes a spiral on the inside of the hatch. Not cold enough for frost. The spiral did not ask.',
    bargain: 'You wipe it with a sleeve and offer the spiral a potato. The spiral, being frost, declines. You keep the potato.',
  },
  {
    id: 'heavy-cans',
    face: 'The cans feel wrong',
    text: 'A bag of cans is heavier, then not. You are not a scientist. You are a person with cans and a moon problem.',
    bargain: 'You set one can on the step like a tithe. The afternoon accepts. Physics goes back to work, mostly.',
  },
  {
    id: 'howl',
    face: 'A howl that needed help',
    text: 'Dogs howl at a moon that did not need the help. Biscuit sighs instead. He is the professional in this building.',
    bargain: 'You give Biscuit his half can early. He does not howl. He is fine. The other dogs can have the moon.',
  },
  {
    id: 'damp',
    face: 'A basement with opinions',
    text: 'The lower rooms are damp in a way they have not been since a decade you will not name. The sump pump takes it personally.',
    bargain: 'You put a casserole on a high shelf and a bucket on a low one. Both jobs get done.',
  },
  {
    id: 'shadows',
    face: 'Shadows too long',
    text: 'Shadows at the hatch are too long for the bulb. You measure one with a shoe. The shoe is not long enough. The moon knows.',
    bargain: 'You turn the bulb off. The shadow clocks out. You sit in the dark like a person with a plan.',
  },
  {
    id: 'step',
    face: 'The lake on the step',
    text: 'Pine Lake checks the bait-shop step, then yours, then goes back, embarrassed. You have had that calendar.',
    bargain: 'You leave a casserole on the stair like an offering to a tide. The tide is flattered. It leaves the stair.',
  },
];

export const SURVIVAL_DECKS = {
  zombies: ZOMBIES,
  solarflare: SOLARFLARE,
  robots: ROBOTS,
  meteor: METEOR,
  bigmoon: BIGMOON,
};

export const SURVIVAL_OPENERS = {
  zombies: 'Bunker day {n} of {max}. The surface is ash and opinions.',
  solarflare: 'Bunker day {n} of {max}. Daylight upstairs is a dare. The hatch is warm on purpose.',
  robots: 'Bunker day {n} of {max}. The surface is blinking. Something wants a word.',
  meteor: 'Bunker day {n} of {max}. The surface is dust and a leftover sky.',
  bigmoon: 'Bunker day {n} of {max}. The surface is tide and a moon that will not sit down.',
};

export const SURVIVAL_COLD = {
  zombies: 0.22,
  solarflare: 0.12,
  robots: 0.10,
  meteor: 0.40,
  bigmoon: 0.48,
};

export const WIN_LINES = {
  zombies: [
    'Ten days. The hatch still closes. I had a eulogy ready, which is embarrassing for both of us.',
    'Biscuit is fine. You are approximately fine. The town is a rumor that learned to walk.',
    "This has been The Last Shift on 88.3. Get some sleep. Or don't. I'm not your dad. Probably.",
  ],
  solarflare: [
    'Ten days. The sky has stopped showing off. I am choosing to believe that is permanent.',
    'Biscuit is fine. The Faraday closet still ticks. You still have eyebrows. I am counting that as a win.',
    'This has been The Last Shift on 88.3. If the lights come back, pretend you were never this interesting.',
  ],
  robots: [
    'Ten days. The toaster has stopped asking. I have stopped answering. We are both professionals.',
    'Biscuit is fine. The skillet is fine. Manual labor remains legal. I am putting that on a sign.',
    'This has been The Last Shift on 88.3. Unplug nothing in a panic. Panic is how they clock in.',
  ],
  meteor: [
    'Ten days. The dust is settling, which is a sentence I wanted to mean less.',
    'Biscuit is fine. The hole was deep enough. The rock, being a rock, has moved on to being geology.',
    'This has been The Last Shift on 88.3. Sweep the roof when you can. Do not narrate the pile.',
  ],
  bigmoon: [
    'Ten days. The moon has remembered its distance. I checked with a thumb. The thumb is not a scientist. It is enough.',
    'Biscuit is fine. The grow room did its tour. The Mackinaw still smells like a decision you would make again.',
    'This has been The Last Shift on 88.3. The lake can have its dock back. I am keeping the chair.',
  ],
};

/** Said after the name, once. Hints at the loop. Does not explain it. Does not repeat the name. */
export const LOSS_HINT = {
  zombies: 'That is the last clean word. I used to be on your side of the hatch. Leave it there.',
  solarflare: 'That is the last clean word. The sky kept the rest. I used to be on your side of the hatch.',
  robots: 'That is the last clean word. Something else wanted the mic. I used to be on your side of the hatch.',
  meteor: 'That is the last clean word. The dust kept the rest. I used to be on your side of the hatch.',
  bigmoon: 'That is the last clean word. The moon kept the rest. I used to be on your side of the hatch.',
};

export function survivalDeck(kind) {
  return SURVIVAL_DECKS[kind] || SURVIVAL_DECKS.zombies;
}

export function hatchById(id, kind) {
  const deck = survivalDeck(kind);
  return deck.find((item) => item.id === id) || deck[0];
}

export function zombieById(id) {
  return hatchById(id, 'zombies');
}

export function apocalypseLinesFor(kind) {
  return APOCALYPSE_LINES[kind] || APOCALYPSE_LINES.zombies;
}

export function revealNoteFor(kind) {
  return REVEAL_NOTES[kind] || REVEAL_NOTES.zombies;
}

export function winLinesFor(kind) {
  return WIN_LINES[kind] || WIN_LINES.zombies;
}

export function lossHintFor(kind) {
  return LOSS_HINT[kind] || LOSS_HINT.zombies;
}

export function survivalOpener(kind, day, max) {
  const template = SURVIVAL_OPENERS[kind] || SURVIVAL_OPENERS.zombies;
  return template.replace('{n}', String(day)).replace('{max}', String(max));
}
