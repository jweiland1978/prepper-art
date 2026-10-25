/**
 * Scavenge events. One row per beat. Scenes should not grow a switch on location.
 * kind: find | choice | danger | cameo | trade
 */
export const EVENTS = [
  {
    id: 'party-cooler', location: 'party', kind: 'find', weight: 3,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The cooler hums like it still has a shift to finish. The beer is warm. The cans behind it are not.',
    bias: ['food', 'food', 'water'],
  },
  {
    id: 'party-larry', location: 'party', kind: 'cameo', weight: 2,
    phases: ['calm', 'panic'],
    who: 'Larry', portrait: 'portrait-larry',
    text: "They put fluoride in the creamed corn. I'm taking all of it, for science.",
    grant: { loot: true, bias: ['food', 'food', 'food'] },
    button: 'TAKE THE CORN',
  },
  {
    id: 'party-counter', location: 'party', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The register is open. The counter is sticky. Neither of you is surprised.',
    choices: [
      { label: 'Just the cooler', risk: 'Safe', success: { loot: true, bias: ['food', 'water'], text: 'You take what the cooler was willing to give.' } },
      { label: 'Check the drawer', risk: 'Risky', success: { materials: 1, food: 1, text: 'Pencils, a coupon, and a can of something honest.' }, fail: { morale: -1, text: 'A bell rings. You put it back like a person with a future.' } },
      { label: 'Stockroom', risk: 'Very risky', success: { loot: true, bias: ['food', 'food', 'materials'], text: 'The stockroom pays out. You leave before it changes its mind.' }, fail: { health: -1, morale: -1, text: 'A shelf introduces itself to your shoulder. You keep the shoulder.' } },
    ],
  },
  {
    id: 'party-jogger', location: 'party', kind: 'danger', weight: 1,
    weightByPhase: { calm: 1, panic: 3, collapse: 4 },
    phases: ['calm', 'panic', 'collapse'],
    face: 'A very rude jogger',
    text: 'A jogger in reflective shorts is very interested in your bag. He is not winded. He should be winded.',
    bias: ['food', 'water'],
  },
  {
    id: 'party-weights', location: 'party', kind: 'find', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The ammo display is fishing weights and a handwritten sign that says "close enough." You shop accordingly.',
    bias: ['materials', 'food', 'water'],
  },

  {
    id: 'hard-nails', location: 'hardware', kind: 'find', weight: 3,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The nail bins have been loved. The plank rack has not. You fix that imbalance.',
    bias: ['materials', 'materials', 'materials'],
  },
  {
    id: 'hard-dale', location: 'hardware', kind: 'cameo', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    who: 'Dale', portrait: 'portrait-dale',
    text: 'Dale hands you a violation notice for an "unpermitted hole." He also hands you a 2x4. Mixed message. Useful message.',
    grant: { weapon: 'studded_2x4', materials: 1 },
    button: 'TAKE THE NOTICE',
  },
  {
    id: 'hard-bins', location: 'hardware', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Bolt bins, a locked cage of good tools, and a smell like a honest mistake.',
    choices: [
      { label: 'Scoop the bolts', risk: 'Safe', success: { loot: true, bias: ['materials', 'materials'], text: 'Bolts. Not glamorous. The bunker does not require glamour.' } },
      { label: 'The tool cage', risk: 'Risky', success: { materials: 2, text: 'The cage was optimistic. You are now richer in metal.' }, fail: { morale: -1, text: 'The cage wins. You salute it and leave.' } },
      { label: 'Back alley pile', risk: 'Very risky', success: { loot: true, bias: ['materials', 'materials', 'food'], text: 'The alley pile is half treasure. You take the half that is.' }, fail: { health: -1, text: 'A loose pipe argues with your knee. The pipe remains in the alley.' } },
    ],
  },
  {
    id: 'hard-looter', location: 'hardware', kind: 'danger', weight: 1,
    weightByPhase: { calm: 1, panic: 3, collapse: 4 },
    phases: ['calm', 'panic', 'collapse'],
    face: 'A looter with a cart',
    text: 'Someone is loading a cart like the store is a suggestion. They look up. The cart squeaks.',
    bias: ['materials', 'materials'],
  },
  {
    id: 'hard-shovel', location: 'hardware', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'A snow shovel hangs where October can see it. It has been waiting for a different reputation.',
    choices: [
      { label: 'Take the shovel', risk: 'Safe', success: { weapon: 'snow_shovel', text: 'You take the snow shovel. Finally useful in October.' } },
      { label: 'Planks instead', risk: 'Safe', success: { loot: true, bias: ['materials', 'materials', 'materials'], text: 'You leave the shovel for a person with less dirt at home. You take planks.' } },
    ],
  },

  {
    id: 'super-food', location: 'super', kind: 'find', weight: 3,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The supercenter still believes in abundance. The shelves are negotiating.',
    bias: ['food', 'food', 'water', 'food'],
  },
  {
    id: 'super-kevin', location: 'super', kind: 'trade', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    who: 'Kevin', portrait: 'portrait-kevin',
    text: 'Kevin is livestreaming the empty bread aisle to zero viewers. He offers a tip for snacks. He is not the joke. The aisle is.',
    cost: { food: 1 },
    grant: { materials: 2, rumor: 'kale-standards' },
    payLabel: 'TRADE A CAN',
    leaveLabel: 'KEEP WALKING',
  },
  {
    id: 'super-aisle', location: 'super', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Three aisles. One of them still looks like a store. The other two look like a decision.',
    choices: [
      { label: 'The stocked aisle', risk: 'Safe', success: { loot: true, bias: ['food', 'water'], text: 'You shop like a person with a list. The list is "yes."' } },
      { label: 'The crowded aisle', risk: 'Risky', success: { food: 2, text: 'You get in, you get cans, you get out. A personal best.' }, fail: { morale: -1, text: 'Someone takes the last cart. You take the hint.' } },
      { label: 'The dark aisle', risk: 'Very risky', success: { loot: true, bias: ['food', 'medicine', 'materials'], text: 'The dark aisle pays rent. You do not stay to meet the landlord.' }, fail: { health: -1, text: 'You bump a display. The display bumps back. You leave the display in the aisle.' } },
    ],
  },
  {
    id: 'super-crowd', location: 'super', kind: 'danger', crowd: true, weight: 1,
    weightByPhase: { calm: 1, panic: 4, collapse: 5 },
    phases: ['calm', 'panic', 'collapse'],
    face: 'A very determined shopper',
    text: 'A shopper wants your basket and does not have a theory of personal space. The kale watches.',
    bias: ['food', 'food'],
  },
  {
    id: 'super-stick', location: 'super', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Sporting goods still has a hockey stick. The tag says it belongs in Kevin\'s trunk. The trunk is not here.',
    choices: [
      { label: 'Take the stick', risk: 'Safe', success: { weapon: 'hockey_stick', text: 'You take the hockey stick. Kevin can want it back. Wanting is free.' } },
      { label: 'Snacks instead', risk: 'Safe', success: { loot: true, bias: ['food', 'water'], text: 'You leave the stick and take snacks. The stick understands.' } },
    ],
  },

  {
    id: 'pharm-meds', location: 'pharmacy', kind: 'find', weight: 3,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The pharmacy still alphabetizes. The alphabet is shorter than last week.',
    bias: ['medicine', 'medicine', 'water'],
  },
  {
    id: 'pharm-kowalski', location: 'pharmacy', kind: 'cameo', weight: 2,
    phases: ['calm', 'panic'],
    who: 'Mrs. Kowalski', portrait: 'portrait-kowalski',
    text: 'She gives you a casserole and judges your pantry without seeing it. She also mentions the skillet cooks. Twice.',
    grant: { food: 3, weapon: 'skillet' },
    button: 'TAKE THE DISH',
  },
  {
    id: 'pharm-tina', location: 'pharmacy', kind: 'cameo', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    who: 'Tina', portrait: 'portrait-tina',
    text: "I've seen worse at 3 AM.",
    grant: { health: 2, medicine: 1 },
    button: 'HOLD STILL',
  },
  {
    id: 'pharm-back', location: 'pharmacy', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The front is picked. The back room has a light on and a door that did not invite you.',
    choices: [
      { label: 'Front counter', risk: 'Safe', success: { loot: true, bias: ['medicine', 'water'], text: 'Bandages and a jug. The counter dings out of habit.' } },
      { label: 'Ask around', risk: 'Risky', success: { medicine: 2, morale: 1, text: 'Somebody points. You leave with medicine and a smaller worry.' }, fail: { morale: -1, text: 'Nobody is in the mood. You buy nothing and owe nothing.' } },
      { label: 'Back room', risk: 'Very risky', success: { loot: true, bias: ['medicine', 'medicine', 'food'], text: 'The back room is just a back room. You take the boring treasure.' }, fail: { health: -1, text: 'You stumble on a step. The step keeps your dignity. You keep the ankle, mostly.' } },
    ],
  },
  {
    id: 'pharm-shutter', location: 'pharmacy', kind: 'danger', weight: 1,
    weightByPhase: { calm: 1, panic: 2, collapse: 4 },
    phases: ['calm', 'panic', 'collapse'],
    face: 'Something by the shutter',
    text: 'The security shutter is half down. Something on the other side wants your bag and does not want a conversation.',
    bias: ['medicine', 'water'],
  },

  {
    id: 'tav-jukebox', location: 'tavern', kind: 'find', weight: 3,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The jukebox is playing a song from a year that had fewer countdowns. Somebody left a stash under the booth.',
    bias: ['food', 'water', 'morale'],
    grantRumor: 'deer-meeting',
  },
  {
    id: 'tav-stash', location: 'tavern', kind: 'find', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Rusty locked the good stuff in 1997 and lost the feeling, not the key. The feeling is back. The key is on a nail.',
    bias: ['food', 'food', 'materials'],
  },
  {
    id: 'tav-key', location: 'tavern', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Bar, kitchen, or the stool that should not be in the middle of the floor.',
    choices: [
      { label: 'Pour nothing, take cans', risk: 'Safe', success: { loot: true, bias: ['food', 'water'], text: 'You skip the taps and take sealed food. Character development.' } },
      { label: 'Kitchen pass', risk: 'Risky', success: { food: 2, morale: 1, text: 'The pass window still has crackers and a joke you don\'t repeat.' }, fail: { morale: -1, text: 'The kitchen is a opinion. You back out of it.' } },
      { label: 'Move the stool', risk: 'Very risky', success: { loot: true, bias: ['food', 'materials', 'medicine'], rumor: 'rude-jogger', text: 'Behind the stool: supplies, and a rumor you did not order.' }, fail: { health: -1, morale: -1, text: 'The stool moves back. You hop once and call it strategy.' } },
    ],
  },
  {
    id: 'tav-stool', location: 'tavern', kind: 'danger', weight: 1,
    weightByPhase: { calm: 1, panic: 3, collapse: 4 },
    phases: ['calm', 'panic', 'collapse'],
    face: 'A patron who stayed',
    text: 'A patron is still at the bar. They want what you are carrying. The jukebox picks a slow song, which is rude.',
    bias: ['food', 'materials'],
  },
  {
    id: 'party-foil', location: 'party', kind: 'find', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'A roll of tinfoil is wearing a price sticker from a calmer year. Larry would call it architecture.',
    bias: ['materials', 'food'],
    stash: { tinfoil: 2 },
  },
  {
    id: 'party-larry-join', location: 'party', kind: 'recruit', neighbor: 'larry', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Larry is inventorying the cooler like it owes him a deposition.',
  },
  {
    id: 'hard-cells', location: 'hardware', kind: 'find', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The battery rack is a graveyard of brands you do not trust. One cell still has a charge and no logo.',
    bias: ['materials'],
    stash: { battery: 1 },
  },
  {
    id: 'hard-dale-join', location: 'hardware', kind: 'recruit', neighbor: 'dale', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Dale is measuring the aisle with a clipboard. The aisle is losing.',
  },
  {
    id: 'super-kevin-join', location: 'super', kind: 'recruit', neighbor: 'kevin', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Kevin is filming an empty endcap. The endcap is giving the performance of its life.',
  },
  {
    id: 'pharm-coffee', location: 'pharmacy', kind: 'find', weight: 2,
    phases: ['calm', 'panic'],
    text: 'Behind the counter, a tin of coffee and a note that says "for the night shift." The night shift is not here.',
    bias: ['medicine', 'water'],
    stash: { coffee: 1 },
  },
  {
    id: 'pharm-tina-join', location: 'pharmacy', kind: 'recruit', neighbor: 'tina', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Tina is sitting on the counter like the counter is a break room. It might be, now.',
  },
  {
    id: 'tav-kowalski-join', location: 'tavern', kind: 'recruit', neighbor: 'kowalski', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Mrs. Kowalski has commandeered a table and is judging the pretzels. The pretzels are not ready.',
  },
  {
    id: 'tav-flare', location: 'tavern', kind: 'choice', weight: 1,
    phases: ['panic', 'collapse'],
    text: 'Above the register, a flare gun. The card under it says it also signals for help. The help line is a joke Rusty liked.',
    choices: [
      { label: 'Take the flare gun', risk: 'Risky', success: { weapon: 'flare_gun', text: 'You take the flare gun. It also signals for help that never comes. Still, it is a flare gun.' }, fail: { morale: -1, text: 'You reach. A bottle comments on your wrist. You leave the flare for a braver wrist.' } },
      { label: 'Leave it on the nail', risk: 'Safe', success: { loot: true, bias: ['food', 'water'], text: 'You leave the theatrics and take supper.' } },
    ],
  },
  {
    id: 'bait-coffee', location: 'bait', kind: 'find', weight: 3,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The coffee pot has outlived the lottery machine. You take the one that still means something.',
    bias: ['food', 'water'],
  },
  {
    id: 'bait-flare', location: 'bait', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'A flare gun hangs over the nightcrawlers. The card says it also signals for help. The help is a rumor.',
    choices: [
      { label: 'Take the flare gun', risk: 'Risky', success: { weapon: 'flare_gun', text: 'You take the flare gun. It also signals for help that may not be in town anymore. Still, it is a flare gun.' }, fail: { morale: -1, text: 'The hook it was on has a friend. You leave the flare and keep the fingers.' } },
      { label: 'Just the coffee', risk: 'Safe', success: { loot: true, bias: ['food', 'water'], text: 'Coffee, a snack cake, and a lottery ticket you do not scratch.' } },
      { label: 'Check the cooler', risk: 'Safe', success: { loot: true, bias: ['water', 'food'], text: 'Silver cans and a jug. The lake is not involved. The cooler is.' } },
    ],
  },
  {
    id: 'bait-tina', location: 'bait', kind: 'recruit', neighbor: 'tina', weight: 2,
    phases: ['calm', 'panic'],
    text: 'Tina is on the step with a coffee she bought and a shift she already worked.',
  },
  {
    id: 'bait-quiet', location: 'bait', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The shop is a long walk from the hatch. The walk is the dangerous part. The shop is mostly coffee.',
    choices: [
      { label: 'Fill a bag and go', risk: 'Safe', success: { loot: true, bias: ['food', 'water'], text: 'You shop like a person who knows the road home.' } },
      { label: 'Wait for the mist to thin', risk: 'Risky', success: { water: 2, morale: 1, text: 'The mist thins. Pine Lake looks like itself. You leave with water and a quieter head.' }, fail: { morale: -1, text: 'The mist does not thin. You leave anyway, slightly more poetic than planned.' } },
    ],
  },
  {
    id: 'dairy-sign', location: 'dairy', kind: 'find', weight: 3,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The sign still says SEE YOU IN MAY. You take a snack cake from a freezer that is mostly optimism.',
    bias: ['food', 'water'],
  },
  {
    id: 'dairy-freezer', location: 'dairy', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The soft-serve machine is a sculpture now. The freezer behind it is still a freezer.',
    choices: [
      { label: 'Open the freezer', risk: 'Safe', success: { loot: true, bias: ['food', 'water'], text: 'Something frozen, something drinkable, nothing that bites.' } },
      { label: 'Read the sign and leave', risk: 'Safe', success: { morale: 1, text: 'SEE YOU IN MAY. You respect the confidence. You take a bottle of water as a tip.' } },
      { label: 'Check the back lot', risk: 'Risky', success: { materials: 1, water: 1, text: 'A crate, a jug, and nobody waiting. A good night for a closed stand.' }, fail: { morale: -1, text: 'A raccoon has the back lot. You let the raccoon have the back lot.' } },
    ],
  },
  {
    id: 'dairy-hide', location: 'dairy', kind: 'cameo', weight: 2,
    phases: ['panic', 'collapse'],
    who: 'Kevin', portrait: 'portrait-kevin',
    text: 'Kevin is behind the stand, filming a sign that says SEE YOU IN MAY. He looks like he might stay.',
    grant: { loot: true, bias: ['food', 'water'] },
    button: 'SHARE THE SNACKS',
  },
  {
    id: 'dairy-dale', location: 'dairy', kind: 'recruit', neighbor: 'dale', weight: 1,
    phases: ['calm', 'panic'],
    text: 'Dale is measuring the stand for a violation the season has not earned. He would rather measure a bunker.',
  },
  {
    id: 'church-rummage', location: 'church', kind: 'find', weight: 3,
    phases: ['calm', 'panic', 'collapse'],
    text: 'Everything is a quarter. Nobody is here to take the quarter. You leave one anyway, out of habit.',
    bias: ['materials', 'food'],
  },
  {
    id: 'church-game', location: 'church', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'A board game in a mashed box. The pieces are all there, which is more than you can say for the week.',
    choices: [
      { label: 'Take the game', risk: 'Safe', success: { morale: 1, flag: 'boardGame', text: 'You take the game. A rec room would know what to do with it.' } },
      { label: 'Take the foil pans', risk: 'Safe', success: { loot: true, bias: ['materials'], text: 'Tinfoil and a tray. Larry will hear about the tray from across town.' } },
      { label: 'Basement corner', risk: 'Risky', success: { materials: 2, text: 'Folding chairs and a plank somebody donated in 2004. You accept the donation.' }, fail: { morale: -1, text: 'The fluorescent light dies mid-search. You leave with your dignity and no plank.' } },
    ],
  },
  {
    id: 'church-kowalski', location: 'church', kind: 'recruit', neighbor: 'kowalski', weight: 2,
    phases: ['calm', 'panic'],
    text: 'Mrs. Kowalski is staging a casserole on a rummage table. The table is trying to deserve it.',
  },
  {
    id: 'church-quiet', location: 'church', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: 'The basement is low danger and high fluorescent. A plaid sleeve shows under a coat pile and is not the one.',
    choices: [
      { label: 'Keep looking', risk: 'Safe', success: { loot: true, bias: ['materials', 'food'], text: 'Useful junk. The famous coat is not in this pile. You knew it would not be that easy.' } },
      { label: 'Sit a minute', risk: 'Safe', success: { morale: 1, text: 'You sit. The church ladies are not here to haggle, which is its own blessing.' } },
    ],
  },
  {
    id: 'tent-chair', location: 'tent', kind: 'find', weight: 3,
    phases: ['calm', 'panic'],
    text: "The guy in the folding chair says the bottle rockets are basically safe. He is missing two eyebrows. You buy them anyway.",
    bias: ['materials'],
  },
  {
    id: 'tent-crate', location: 'tent', kind: 'choice', weight: 2,
    phases: ['calm', 'panic'],
    text: 'Crates of bottle rockets, a gas can, and a FIREWORKS sign that is doing its best.',
    choices: [
      { label: 'The crate', risk: 'Safe', success: { loot: true, bias: ['materials'], text: 'You take the crate he points at. He does not stand up. Standing is extra.' } },
      { label: 'The gas can', risk: 'Risky', success: { loot: true, bias: ['materials'], text: 'The gas can was not for sale until you looked at it like a person with a generator.' }, fail: { morale: -1, text: 'He says the can is his ride home. You believe him. He has no eyebrows and a lot of road.' } },
      { label: 'Ask if it is safe', risk: 'Safe', success: { morale: 1, text: "He says 'basically.' You have never trusted an adverb less, or bought one faster." } },
    ],
  },
  {
    id: 'tent-larry', location: 'tent', kind: 'cameo', weight: 2,
    phases: ['calm', 'panic'],
    who: 'Larry', portrait: 'portrait-larry',
    text: 'Larry is reading a fuse like it owes him a confession. He will not be buying. He will be judging.',
    grant: { loot: true, bias: ['materials'] },
    button: 'BUY THEM ANYWAY',
  },
  {
    id: 'tent-looter', location: 'tent', kind: 'danger', weight: 1,
    phases: ['calm', 'panic'],
    face: 'A stranger at the tent',
    text: 'Somebody else wants the crate. They are rude about it. The folding chair does not intervene.',
    bias: ['materials'],
  },
  {
    id: 'tav-jukebox', location: 'tavern', kind: 'choice', weight: 2,
    phases: ['calm', 'panic'],
    text: 'The jukebox still works. Nobody knows why. It wants a battery and a decision.',
    choices: [
      { label: 'Let it play', risk: 'Safe', success: { morale: 1, text: 'It plays something from a year you remember too well. You leave a little lighter.' } },
      { label: 'Check the back', risk: 'Risky', success: { loot: true, bias: ['food', 'water'], text: 'Silver cans, a rumor, and a pool cue that stays behind.' }, fail: { morale: -1, text: 'The jukebox skips and so does your nerve. You leave the back room to Rusty.' } },
    ],
  },
  {
    id: 'tav-gossip', location: 'tavern', kind: 'cameo', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    who: 'Dale', portrait: 'portrait-dale',
    text: 'Dale is telling the bar that fireworks are a zoning issue. The bar is not a court. He continues.',
    grant: { morale: 1 },
    button: 'LISTEN',
  },
  {
    id: 'hard-sign', location: 'hardware', kind: 'choice', weight: 2,
    phases: ['calm', 'panic', 'collapse'],
    text: "The sign is still up. The owner is not. You leave an IOU anyway, out of respect.",
    choices: [
      { label: 'Take the planks', risk: 'Safe', success: { loot: true, bias: ['materials', 'materials'], text: 'You take planks and leave the IOU under the NO CREDIT, NO EXCEPTIONS sign.' } },
      { label: 'Batteries and foil', risk: 'Safe', success: { loot: true, bias: ['materials'], text: 'Batteries, a roll of tinfoil, and the feeling of a fair trade with a ghost.' } },
      { label: 'The back cage', risk: 'Risky', success: { materials: 3, text: 'The cage pays out. The sign watches. You do not ask it for credit.' }, fail: { health: -1, text: 'A shelf introduces itself. You keep the IOU and lose a little ease.' } },
    ],
  },
  {
    id: 'hard-gas', location: 'hardware', kind: 'find', weight: 2,
    phases: ['panic', 'collapse'],
    text: 'A gas can behind the key machine. The key machine is retired. The can is not.',
    bias: ['materials', 'materials'],
  },

  // The Bait & Brew job lives in js/heist.js. NightSummary offers it. Not a map event.
];

export function eventById(id) {
  return EVENTS.find((event) => event.id === id) || null;
}
