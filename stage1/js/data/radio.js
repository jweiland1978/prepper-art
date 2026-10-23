/** Morning-show copy for The Last Shift on 88.3. Jeff can add lines without touching scenes. */

export const GREETINGS = {
  calm: [
    "Good morning, Lake Orwell. {daysPhrase} left. So, you know, maybe floss. Or don't. Whatever.",
    "If you're hearing this, your radio still works. Congratulations. That's more than I can say for the government.",
    "Day {day}. I'm in a basement. The dog has a plan. I have a chair and a countdown I didn't ask for.",
    "Weather: lake-effect gloom off Pine Lake, followed by more gloom. Dress in layers. Or despair. Both are warm.",
    "This is The Last Shift on 88.3. One listener, by the sound of it. Hi. {daysPhrase} left.",
  ],
  panic: [
    "Good morning. {daysPhrase} left. The town is shopping like the receipt is a will.",
    "I don't have a plan. I have a plan to make a plan. That's very on-brand for me. {daysPhrase} left.",
    "Reminder from a man under a house: it's not hoarding if you're nervous about it. That's just shopping with feelings.",
    "The signal is worse. So am I. {daysPhrase} left. Chew your food. Pretend that helps.",
    "Lake Orwell, day {day}. I still don't know the cause. I know the date. The date is the rude part.",
  ],
  collapse: [
    "Lake Orwell, if you're still there. {daysPhrase}. I'm under the house. The house is thinking about it.",
    "Day {day}. The needle keeps leaving the station. I don't blame it. {daysPhrase} left, if the clock is honest.",
    "This is The Last Shift on 88.3. I think. The basement agrees. The air does not.",
    "I'm talking to one person and a dog. The dog is the professional. {daysPhrase}.",
  ],
  end: [
    "Day 30. Today. Probably. I'm still here. That's either loyalty or a scheduling error.",
    "This is the last Last Shift on 88.3. I still don't know how. I know when. That's the whole bit.",
  ],
};

/** Twenty-plus rumors. Zombie hints sit next to red herrings. Notebook stores the clean text. */
export const RUMORS = [
  { id: 'rude-jogger', kind: 'zombie', text: "Rumor, filed under probably: a neighbor got bitten by a very rude jogger." },
  { id: 'breath-mints', kind: 'zombie', text: "The pharmacy is out of everything except breath mints. People are... smelly." },
  { id: 'cemetery-wind', kind: 'zombie', text: "Larry says the moaning from the cemetery is just the wind. Larry has never said that about anything." },
  { id: 'all-fours', kind: 'zombie', text: "Someone at the supercenter was shopping on all fours. Very committed. Very incorrect." },
  { id: 'no-blink', kind: 'zombie', text: "The party store rang up a customer who did not blink. Or pay. Or leave. The drawer is still open." },
  { id: 'mailbox', kind: 'zombie', text: "A jogger in reflective shorts chased a mailbox. The mailbox lost. I don't like that sentence." },
  { id: 'casserole-moved', kind: 'zombie', text: "Mrs. Kowalski says her casserole moved. She still wants the dish back. Priorities." },
  { id: 'church-basement', kind: 'zombie', text: "The church basement is locked from the inside. The rummage sale can wait. So can I." },
  { id: 'diagram-walk', kind: 'zombie', text: "People on Pine Road are walking like they learned it from a diagram. The diagram was mean." },
  { id: 'bait-door', kind: 'zombie', text: "Bite marks on the bait shop door. The fish did not do that. The fish are on the other side of the glass." },
  { id: 'gym-sound', kind: 'zombie', text: "Coach says the gym mats still smell like effort, and also like something tapping the boards from the storage side." },
  { id: 'toaster', kind: 'herring', text: "Your toaster has started asking questions. Mine just burns bread. I almost miss that." },
  { id: 'moon-close', kind: 'herring', text: "The moon looks closer tonight. I checked with a thumb. The thumb is not a scientist." },
  { id: 'hoa-letter', kind: 'herring', text: "The HOA sent a letter about the end of the world. Three pages. Single-spaced. Dale sounded proud." },
  { id: 'gas-leak', kind: 'herring', text: "Dale swears it's a gas leak. Dale swears everything is a gas leak, including weather and feelings." },
  { id: 'butter-cult', kind: 'herring', text: "There's a coupon club at the supercenter waiting for butter to go on sale. Polite. Unblinking. Probably unrelated." },
  { id: 'lake-cult', kind: 'herring', text: "Theory of the day: Pine Lake is a cult and the geese are middle management. I refuse to elaborate." },
  { id: 'tax-audit', kind: 'herring', text: "Alternate theory: this is a tax audit with lake-effect weather. The forms would explain the moaning." },
  { id: 'potholes', kind: 'herring', text: "The potholes on Main are organizing. They want representation. They already have most of the road." },
  { id: 'euchre', kind: 'herring', text: "Euchre night was cancelled. That hasn't happened, including the blizzard, including the funeral." },
  { id: 'pasties', kind: 'herring', text: "The pasties at the party store have achieved a look. Still delicious. This part is unrelated. Probably." },
  { id: 'deer-meeting', kind: 'herring', text: "Deer season started early. The deer are holding a meeting. Gary says the fish don't know, and he respects that." },
  { id: 'fluoride', kind: 'herring', text: "Larry blamed the fluoride again. The fluoride has an alibi. It was in the creamed corn, minding its business." },
  { id: 'kale-standards', kind: 'zombie', text: "Floor report: the bread aisle is gone. The kale is still there. Even the end of the world has standards." },
];

export const JOKES = [
  { id: 'kale', text: "Grocery update: the bread aisle is gone. The kale is still there. Even the end of the world has standards.", calmOnly: true },
  { id: 'mixtape', text: "I made a mixtape for the apocalypse. It's forty minutes of me missing the record button." },
  { id: 'lawndarts', text: "My generation survived lawn darts, no seatbelts, and drinking from the garden hose. And look how great we turned out. I'm broadcasting from a basement and talking to a dog." },
  { id: 'plan', text: "I don't have a plan. I have a plan to make a plan. That's very on-brand for me." },
  { id: 'hoard', text: "Reminder: it's not hoarding if you're nervous about it. That's just shopping with feelings.", calmOnly: true },
  { id: 'meditate', text: "I tried to meditate. I made a list of worries in a calmer voice. The list filed a complaint." },
  { id: 'kettle', text: "The kettle is on. The kettle has been on since a Tuesday I won't name. We don't talk about it." },
  { id: 'flashlights', text: "I own seven flashlights. None of them have agreed to work on the same night. Union job.", calmOnly: true },
  { id: 'labels', text: "I labeled the cans. Then I labeled the labels. The basement is winning on points." },
  { id: 'back', text: "My back hurts, which I am counting as cardio. The dog did not sign the form." },
  { id: 'speech', text: "I practiced an emergency speech. It was mostly apologies to a chair. The chair accepted." },
  { id: 'scissors', text: "The good scissors are still missing. The apocalypse can wait its turn. I had them in 1997." },
  { id: 'alphabet', text: "I alphabetized the worry. It looks professional. It did not help. Very me." },
  { id: 'coffee', text: "Coffee number four. Decisions number zero. A classic ratio for this particular generation of me.", calmOnly: true },
  { id: 'cooler', text: "I told myself I'd be cooler in a crisis. The data came back. The data was unkind, and correct." },
  { id: 'sigh', text: "The dog sighed at me. I accepted the note. He has a bandana and a work ethic." },
  { id: 'pencil', text: "I rewound a cassette with a pencil. The pencil got promoted. I remain hourly." },
  { id: 'pothole-joke', text: "I used to complain about potholes. Now I complain near them. Growth, of a kind." },
];

export const SIGNOFFS = [
  "This has been The Last Shift on 88.3. Get some sleep. Or don't. I'm not your dad. Probably.",
  "88.3, signing off. The basement remains undefeated. {daysPhrase} left. Probably.",
  "Go to sleep. I'll be here, which is not as comforting as I hoped.",
  "End of shift. If the static talks, don't answer. I already did. It was disappointing.",
  "That's the show. Eat something. The dog invoices nightly, and he is never wrong.",
  "Signing off from under the house. The hatch knows where I live. {daysPhrase}.",
  "The needle is tired. So am I. This has been The Last Shift on 88.3.",
  "I'm going to stop talking before the station does it for me. Sleep if you can.",
];

export function rumorById(id) {
  return RUMORS.find((rumor) => rumor.id === id) || null;
}

export function radioInventory() {
  const greetings = Object.values(GREETINGS).reduce((sum, list) => sum + list.length, 0);
  return {
    greetings,
    rumors: RUMORS.length,
    jokes: JOKES.length,
    signoffs: SIGNOFFS.length,
    total: greetings + RUMORS.length + JOKES.length + SIGNOFFS.length,
  };
}
