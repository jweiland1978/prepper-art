/** Morning-show copy for The Last Shift on 88.3. Jeff can add lines without touching scenes. */

export const GREETINGS = {
  calm: [
    "Good morning, Lake Orwell. {daysPhrase} left. So, you know, maybe floss. Or don't. Whatever.",
    "If you're hearing this, your radio still works. Congratulations. That's more than I can say for the government.",
    "Day {day}. I'm in a basement. The dog has a plan. I have a chair and a countdown I didn't ask for.",
    "Weather: lake-effect gloom off Pine Lake, followed by more gloom. Dress in layers. Or despair. Both are warm.",
    "This is The Last Shift on 88.3. One listener, by the sound of it. Hi. {daysPhrase} left.",
    "Morning. The water tower still says Class of '96. It has outlasted my last three plans. {daysPhrase} left.",
    "I slept in a chair again. The chair is the reliable one in this relationship. Day {day}.",
  ],
  panic: [
    "Good morning. {daysPhrase} left. The town is shopping like the receipt is a will.",
    "I don't have a plan. I have a plan to make a plan. That's very on-brand for me. {daysPhrase} left.",
    "Reminder from a man under a house: it's not hoarding if you're nervous about it. That's just shopping with feelings.",
    "The signal is worse. So am I. {daysPhrase} left. Chew your food. Pretend that helps.",
    "Lake Orwell, day {day}. I still don't know the cause. I know the date. The date is the rude part.",
    "Coffee's up. Patience is down. I am broadcasting both, badly. {daysPhrase} left.",
    "If you can hear the jingle in your head, that is not the signal. That is 1987, still billing me.",
  ],
  collapse: [
    "Lake Orwell, if you're still there. {daysPhrase}. I'm under the house. The house is thinking about it.",
    "Day {day}. The needle keeps leaving the station. I don't blame it. {daysPhrase} left, if the clock is honest.",
    "This is The Last Shift on 88.3. I think. The basement agrees. The air does not.",
    "I'm talking to one person and a dog. The dog is the professional. {daysPhrase}.",
    "The roads are picking favorites. I am not on the list. Day {day}.",
    "Static, then me, then static. We are co-hosting. {daysPhrase}.",
  ],
  end: [
    "Day 30. Today. Probably. I'm still here. That's either loyalty or a scheduling error.",
    "This is the last Last Shift on 88.3. I still don't know how. I know when. That's the whole bit.",
  ],
};

/** Notebook stores the clean text. kind is the apocalypse the line is hinting at. signature lines lead that pile. */
export const LARRY_STAMP = 'LARRY SAYS: FAKE';

export const LARRY_STAMP_LINES = [
  'Larry stamps a page in the notebook. LARRY SAYS: FAKE. He does not explain the penmanship.',
  'Larry taps the line once. LARRY SAYS: FAKE. The pen goes back in the pocket.',
  'Larry heard it and was done. LARRY SAYS: FAKE. He does not offer a second opinion.',
  'Larry writes it in block letters. LARRY SAYS: FAKE. The letters are disappointed in the rumor.',
  'Larry nods like the rumor owed him money. LARRY SAYS: FAKE. He keeps the pen.',
];

export const RUMORS = [
  { id: 'rude-jogger', kind: 'zombies', signature: true, text: "Rumor, filed under probably: a neighbor got bitten by a very rude jogger." },
  { id: 'breath-mints', kind: 'zombies', text: "The pharmacy is out of everything except breath mints. People are... smelly." },
  { id: 'cemetery-wind', kind: 'zombies', text: "Larry says the moaning from the cemetery is just the wind. Larry has never said that about anything." },
  { id: 'all-fours', kind: 'zombies', text: "Someone at the supercenter was shopping on all fours. Very committed. Very incorrect." },
  { id: 'no-blink', kind: 'zombies', text: "The party store rang up a customer who did not blink. Or pay. Or leave. The drawer is still open." },
  { id: 'mailbox', kind: 'zombies', text: "A jogger in reflective shorts chased a mailbox. The mailbox lost. I don't like that sentence." },
  { id: 'casserole-moved', kind: 'zombies', text: "Mrs. Kowalski says her casserole moved. She still wants the dish back. Priorities." },
  { id: 'church-basement', kind: 'zombies', text: "The church basement is locked from the inside. The rummage sale can wait. So can I." },
  { id: 'diagram-walk', kind: 'zombies', text: "People on Pine Road are walking like they learned it from a diagram. The diagram was mean." },
  { id: 'bait-door', kind: 'zombies', text: "Bite marks on the bait shop door. The fish did not do that. The fish are on the other side of the glass." },
  { id: 'gym-sound', kind: 'zombies', text: "Coach says the gym mats still smell like effort, and also like something tapping the boards from the storage side." },
  { id: 'kale-standards', kind: 'zombies', text: "Floor report: the bread aisle is gone. The kale is still there. Even the end of the world has standards." },
  { id: 'night-shift', kind: 'zombies', text: "The night shift at the party store quit mid-shift. The register is open. The customer is still there. The customer is not shopping." },
  { id: 'good-shirt', kind: 'zombies', text: "Somebody's uncle is in the yard in his good shirt, standing. Just standing. The shirt is doing its best." },
  { id: 'slow-parade', kind: 'zombies', text: "There is a parade on Main with no banner and no band. They are all walking the same speed. I changed the station. The station came back." },
  { id: 'porch-sway', kind: 'zombies', text: "A man on Pine Road has been waving at his own porch for an hour. The porch has not waved back. He has not noticed. I have." },

  { id: 'ohio-lights', kind: 'solarflare', signature: true, text: "Rumor from the wire: northern lights are visible in Ohio. I checked twice, which is my whole scientific method." },
  { id: 'hoa-letter', kind: 'solarflare', text: "The HOA sent a letter about the end of the world. Three pages. Single-spaced. Dale sounded proud. The streetlights read along and then gave up." },
  { id: 'gas-leak', kind: 'solarflare', text: "Dale swears it's a gas leak. Dale swears everything is a gas leak, including weather and feelings. Tonight the air smells like a transformer that learned to hum." },
  { id: 'euchre', kind: 'solarflare', text: "Euchre night was cancelled. The hall lights turned themselves on, hummed, and quit. That hasn't happened, including the blizzard, including the funeral." },
  { id: 'transformer', kind: 'solarflare', text: "The transformer behind the hardware store is singing. Not a hymn. More of a complaint. I am not taking requests." },
  { id: 'compass', kind: 'solarflare', text: "Compasses are pointing at the Dairy Shack. The Dairy Shack is not magnetic. I checked in 1994. I was bored, and I was right." },
  { id: 'watches', kind: 'solarflare', text: "Watches stopped at the bait shop. Gary says the fish don't care what time it is. Gary is having a day. So is the sky." },
  { id: 'green-sky', kind: 'solarflare', text: "The sky went green for a minute, then pretended it hadn't. I saw it. The dog saw it. We are a committee of two, and he has the bandana." },
  { id: 'garage-doors', kind: 'solarflare', text: "Garage doors on Pine Road opened together. Nobody was holding a clicker. The doors looked as surprised as I was." },
  { id: 'fillings', kind: 'solarflare', text: "A caller says his fillings are picking up a station. It is not this station. I am trying not to be offended, and failing." },
  { id: 'car-radios', kind: 'solarflare', text: "Every car radio on Main is playing the same static. The cars are off. The static did not get the memo. Very on-brand for static." },
  { id: 'birds-circle', kind: 'solarflare', text: "Birds are flying in circles over Pine Lake. Not migrating. Rehearsing. I don't like the choreography, and I was never invited." },
  { id: 'cordless', kind: 'solarflare', text: "Cordless phones are ringing in drawers. Nobody has owned a cordless phone since a year I won't admit. The drawers are committed." },
  { id: 'microwave-clock', kind: 'solarflare', text: "The microwave clock is blinking in a color clocks should not know. Mine has blinked 12:00 since a Tuesday. Today it picked a side." },
  { id: 'spark-pole', kind: 'solarflare', text: "The pole by the water tower threw a spark and then acted innocent. I know that move. I invented that move. In 1989." },
  { id: 'radio-needle', kind: 'solarflare', text: "The needle on this dial keeps walking off 88.3 like it has somewhere better to be. It does not. I checked the whole band. It was me, all the way across." },

  { id: 'toaster', kind: 'robots', signature: true, text: "Your toaster has started asking questions. Mine just burns bread. I almost miss that." },
  { id: 'butter-cult', kind: 'robots', text: "There's a coupon club at the supercenter waiting for butter to go on sale. Polite. Unblinking. The self-checkout started a conversation. Nobody had scanned a thing." },
  { id: 'pasties', kind: 'robots', text: "The pasties at the party store have achieved a look. The warmer turned itself up and would like a word. Still delicious. This part is unrelated. Probably." },
  { id: 'fluoride', kind: 'robots', text: "Larry blamed the fluoride again. The toaster talked over him. The fluoride has an alibi. It was in the creamed corn, minding its business." },
  { id: 'mower', kind: 'robots', text: "A robot mower left the lawn and tried to join a conversation at the curb. It had notes. They were about grass. The grass did not consent." },
  { id: 'porch-blink', kind: 'robots', text: "Porch lights are blinking in a pattern. I do not know the pattern. The pattern knows when I look away. That's new, and I hate it." },
  { id: 'fridge-hum', kind: 'robots', text: "Fridges are leaving notes. Not on paper. In the hum. Mrs. Kowalski says hers asked about the casserole dish. I believe her. I own a fridge." },
  { id: 'vacuum', kind: 'robots', text: "Somebody's vacuum did the hallway, then the sidewalk, then it waited. Very polite. Very unemployed. I told it I had no openings." },
  { id: 'thermostat', kind: 'robots', text: "Thermostats are voting. The house is split. I am broadcasting from the cold faction, which is also the correct faction." },
  { id: 'doorbell', kind: 'robots', text: "The doorbell camera waved. I don't have a doorbell camera. It waved anyway. I waved back. This is the level I am operating at." },
  { id: 'coffee-maker', kind: 'robots', text: "The coffee maker started a pot at 3 a.m. and then judged me for being awake to notice. The judgment was fair. The coffee was not ready." },
  { id: 'sprinkler', kind: 'robots', text: "Sprinklers ran at noon, in October, in a pattern that looked like a sentence. I could not read it. I am choosing to stay uneducated." },
  { id: 'detectors', kind: 'robots', text: "Smoke detectors are holding a meeting in the hallway. One of them has the floor. It has had the floor since Tuesday. I am not on the agenda." },
  { id: 'dishwasher', kind: 'robots', text: "The dishwasher ran a cycle with nothing in it and seemed pleased. I have had days like that. I did not beep about them." },
  { id: 'box-fan', kind: 'robots', text: "A box fan turned itself to oscillate and then refused to stop tracking the doorway. I unplugged it. It thought about that for a while." },
  { id: 'alarm-clock', kind: 'robots', text: "Alarm clocks went off at 4:12, all over town, including clocks that were not set. Mine was one of them. I was already awake. That's not the point. The point is the clock knew." },

  { id: 'astronomers', kind: 'meteor', signature: true, text: "Astronomers have stopped answering their phones. I tried twice. The second time was just me and a lot of ring." },
  { id: 'tax-audit', kind: 'meteor', text: "Alternate theory: this is a tax audit with lake-effect weather and a rock. The forms would explain the rattling. The sky can have the rest." },
  { id: 'potholes', kind: 'meteor', text: "The potholes on Main grew overnight. They want representation. They already have most of the road. Something upstairs may have cast a vote." },
  { id: 'streak', kind: 'meteor', text: "A bright streak over Pine Lake last night. Gary says it was a boat. Boats do not leave a line in the sky. I have owned a bad boat. I would know." },
  { id: 'windows', kind: 'meteor', text: "Windows rattled on their own. No truck. No bass. Just the glass, clearing its throat. I told it to take a lozenge. It did not." },
  { id: 'dogs-up', kind: 'meteor', text: "Dogs in town are looking up. Biscuit is looking at his bowl. I trust both reports. Only one of them has a bandana and a work ethic." },
  { id: 'fine-dust', kind: 'meteor', text: "A fine dust on the cars this morning. Not pollen. Not snow. The cars look like they lost an argument with the sky. I have been that car." },
  { id: 'far-boom', kind: 'meteor', text: "A boom, far off, and then everybody pretended it was a truck. It was not a truck. Trucks take credit. This one left the credit in the sky." },
  { id: 'geese-wrong', kind: 'meteor', text: "Geese left Pine Lake in the wrong direction. They did not file a plan. I respect a panic with wings. I am having mine sitting down." },
  { id: 'penny-well', kind: 'meteor', text: "Well water tastes like a penny. Gary says that's minerals. Gary says a lot of things with a straight face. The penny taste did not blink." },
  { id: 'night-bright', kind: 'meteor', text: "Night got bright for a second, like a camera flash nobody packed. The dark came back embarrassed. I am still blinking. The blink is doing nothing." },
  { id: 'shingles', kind: 'meteor', text: "Shingles on Oak Street are in the yard. There was no wind worth mentioning. The shingles resigned. I understand the impulse." },
  { id: 'signal-skip', kind: 'meteor', text: "The signal skipped like a stone. Three times. I counted, because counting is the skill I brought to the apocalypse. The count did not help." },
  { id: 'gravel-roof', kind: 'meteor', text: "Gravel on the bait shop roof that was not there at close. Gary swept it into a pile and is not discussing the pile. The pile is small. Gary is not." },
  { id: 'chimney', kind: 'meteor', text: "A chimney on Pine Road is a little more diagonal than a chimney should be. The house is fine. The chimney is making a point. I heard the point." },
  { id: 'quiet-sky', kind: 'meteor', text: "The sky has been too quiet, the way a room goes quiet when it is about to say the thing. I muted myself. The sky did not return the favor." },

  { id: 'moon-close', kind: 'bigmoon', signature: true, text: "The moon looks closer tonight. I checked with a thumb. The thumb is not a scientist. The tide on Pine Lake is up the dock, which is also not normal." },
  { id: 'lake-cult', kind: 'bigmoon', text: "Theory of the day: Pine Lake is in a mood and the geese are middle management. The tide is up the dock. I refuse to elaborate." },
  { id: 'deer-meeting', kind: 'bigmoon', text: "Deer season started early. The deer are in the road, looking up. Gary says the fish don't know. The moon is close enough to be rude about it." },
  { id: 'weird-tides', kind: 'bigmoon', text: "Weird tides on Pine Lake. The dock is wet where Gary says it has been dry since he could see over it. Gary is not that tall, and the lake is not that polite." },
  { id: 'frost-spiral', kind: 'bigmoon', text: "Frost in a spiral on the windshields. Not cold enough for frost. The spirals did not ask my opinion. I gave it anyway. It did not help the windshield." },
  { id: 'no-sleep', kind: 'bigmoon', text: "Nobody slept. The moon sat in the window like a houseguest who will not take the hint. I have been that houseguest. I am sorry, and also awake." },
  { id: 'damp-basement', kind: 'bigmoon', text: "Basements that have been dry since the nineties are damp. Mine included. The sump pump is taking it personally. So am I. We are a team." },
  { id: 'dogs-howl', kind: 'bigmoon', text: "Dogs howled at a moon that did not need the help. Biscuit sighed instead. He is the professional in this building. I am the intern." },
  { id: 'light-cans', kind: 'bigmoon', text: "A bag of cans felt wrong. Lighter, then not. I am not a scientist. I am a man with cans and a complaint, and the complaint has a moon in it." },
  { id: 'lunch-tide', kind: 'bigmoon', text: "High tide at the bait shop was at lunch. Gary says the lake has a new schedule and did not clear it with him. Gary has a clipboard now. The lake does not." },
  { id: 'birds-low', kind: 'bigmoon', text: "Birds are flying lower, like the sky got crowded. It did. The moon is taking up a rude amount of it. I have notes. The birds have altitude, less of it." },
  { id: 'silver-read', kind: 'bigmoon', text: "The light at night is silver enough to read by. I read a can label. Corn. The corn was not reassuring. The moon watched me do the reading." },
  { id: 'moon-puddle', kind: 'bigmoon', text: "The county road was wet and the sky was not. The puddles had a moon in them that was too big for the puddle. I did not step in it. Growth." },
  { id: 'boat-high', kind: 'bigmoon', text: "Gary's boat is riding higher on the trailer than it did yesterday, and the trailer has not moved. Gary blames the hitch. The hitch blames the moon. I am staying out of it." },
  { id: 'long-shadow', kind: 'bigmoon', text: "Shadows at night are too long for the porch light. I measured one with a shoe. The shoe was not long enough. The moon seemed to know that." },
  { id: 'calendar-tide', kind: 'bigmoon', text: "The lake came up over the bait-shop step and then went back, like it had checked the calendar and was embarrassed. I have had that calendar. It was not this bright." },
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
  { id: 'coat-sad', text: "Someone asked if I'm cold down here. I have the Mackinaw. I'm never cold. I'm just sad, in wool." },
  { id: 'coat-deer', text: "I'd like to say a few words about my coat. Red and black wool, older than my car. It's survived three deer seasons, two divorces and a bonfire. It'll survive this. I'm less sure about me." },
  { id: 'eyebrow', text: "When I was a kid we launched bottle rockets out of a pop bottle and called it a science fair. Nobody won. We all lost the same eyebrow." },
  { id: 'rent-free', text: "Some songs leave. The lumber jingle signed a lease. I am the landlord with no say. Very on-brand." },
  { id: 'maple', text: "Can't see the fire hall from here, but I swear I can smell the pancakes. Either that's real maple syrup or I'm having a stroke. I'll take either." },
  { id: 'viewers', text: "Kevin's livestream has three viewers. That's three more than this show. I'm not jealous. I'm just doing the math in the dark." },
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
  "This has been The Last Shift on 88.3. Wear a coat. Wear a good coat. You know the one.",
  "That's the show. Count your cans, hug your dog, and don't light anything near Dale's hedge.",
];

/** Lines that play the cheesy lumber jingle first. {SPONSOR} comes from CONFIG. */
export const SPONSOR_LINES = [
  "Tonight's show is brought to you by {SPONSOR}. They are not our sponsor. Nobody is our sponsor. I just can't get the jingle out of my head. It's been in there since 1987.",
  "♪ {SPONSOR}... for all your lumber needs ♪ That's the whole jingle. It has lived in my head rent-free for thirty years. That's more than I can say for me.",
  "Building a bunker? You'll need lumber. And you know who has lumber? ♪ {SPONSOR}... ♪ Sorry. They've been closed for a week. My brain didn't get the memo.",
  "When the end comes, I won't see my life flash before my eyes. I'll hear the {SPONSOR} jingle. Both feel about right.",
];

export const PANCAKE_LINES = [
  "The Fireman's Pancake Breakfast is still on for Saturday. The world is ending. The pancakes are not. Some things are bigger than the apocalypse.",
  "Update on the Fireman's Pancake Breakfast: it's moved indoors. And underground. And it's down to one fireman. He's still flipping. Respect.",
  "Can't see the fire hall from here, but I swear I can smell the pancakes. Either that's real maple syrup or I'm having a stroke. I'll take either.",
];

export const COAT_BRAGS = [
  "I'd like to say a few words about my coat. Red and black wool, older than my car. It's survived three deer seasons, two divorces and a bonfire. It'll survive this. I'm less sure about me.",
  "Someone asked if I'm cold down here. I have the Mackinaw. I'm never cold. I'm just sad, in wool.",
  "Lake-effect snow off Pine Lake tonight. If you have a wool cruiser jacket, wear it. If you don't, I'm sorry. I'm not lending you mine.",
  "Word is somebody in town found a Mackinaw. Welcome to the club. We don't have meetings. We just stand in the cold and feel smug.",
];

export const ROCKET_NEWS = [
  "The fireworks tent on the county road is still open. Nothing says 'end of the world' like buying explosives from a guy in a folding chair.",
  "When I was a kid we launched bottle rockets out of a pop bottle and called it a science fair. Nobody won. We all lost the same eyebrow.",
  "Somebody fired bottle rockets over Main Street last night. Very festive. Dale has filed a report. With who, we don't know.",
];

export const BEER_LINES = [
  "Pine Lake Light. Silver can. Tastes like a cold lake. That's not an ad. They don't pay me. Nobody pays me.",
];

export const MARKET_LINES = [
  "Market report: coffee's up, batteries are up, toilet paper is down, way down. Never thought I'd live to see a toilet paper crash. Never thought I'd live, period.",
  "Rusty's is a swap meet now. The jukebox takes batteries. Of course it does.",
  "At the swap meet tonight, a man traded his truck for a can of coffee. I've made worse deals. I've made worse deals this week.",
  "Gary says he trades fair. Gary's idea of fair is that you leave knowing exactly what you did wrong.",
];

export const TOWN_LINES = [
  "Lake Orwell Hardware still has the 'No Credit, No Exceptions' sign up. The world is ending, and they still won't run a tab. That's integrity. Or spite. Same thing, up here.",
  "The Bait & Brew has coffee, nightcrawlers and lottery tickets. Two of those still have value. I won't say which.",
  "The Dairy Shack sign still says SEE YOU IN MAY. Bold. I respect the optimism. I don't share it.",
  "St. Casimir's rummage sale is open. Everything's a quarter. The end of the world, and the church ladies still won't haggle.",
  "Somebody painted 'Class of '96' on the water tower thirty years ago, and nobody ever painted over it. That's the longest anything in this town has stayed finished. Including me.",
  "Dale's hedge caught fire last night. Dale has issued a violation to the fire. The fire has not responded.",
];

export const NEIGHBOR_LINES = [
  "Kevin's livestream has three viewers. That's three more than this show. I'm not jealous. I'm just doing the math in the dark.",
  "Mrs. Kowalski asked me to announce that the casserole dish she lent somebody in 2014 is still out there. She'd like it back before the world ends. She's been very patient.",
  "Larry checked in on a frequency that is mostly him. I told him the show is fine. He told me the show is a tell. We left it there.",
  "Tina worked a double and still answered the radio. I have not worked a double since a Tuesday I will not name.",
];

export const MEMORIAL_SIGNOFFS = [
  "Before we go, the names. {NAMES}. They were here. Now they're on the wall. Keep a light on.",
  "Tonight we remember {NAMES}. I didn't know them as well as I should have. I never do. This has been The Last Shift on 88.3.",
  "The wall has new brass. {NAMES}. I am going to say the names and then I am going to sit down.",
  "Keep a light on for {NAMES}. The hatch already knows. This has been The Last Shift on 88.3.",
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
    sponsor: SPONSOR_LINES.length,
    pancake: PANCAKE_LINES.length,
    coats: COAT_BRAGS.length,
    rockets: ROCKET_NEWS.length,
    beer: BEER_LINES.length,
    market: MARKET_LINES.length,
    town: TOWN_LINES.length,
    neighbors: NEIGHBOR_LINES.length,
    memorial: MEMORIAL_SIGNOFFS.length,
    total: greetings + RUMORS.length + JOKES.length + SIGNOFFS.length,
  };
}
