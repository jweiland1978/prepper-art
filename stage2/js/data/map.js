/**
 * Marker table for the 1280×720 town map.
 * Coordinates are the pin centers from the spec. labelDy nudges the name plate
 * so neighbors don't sit on each other. Jeff can move both.
 */
export const MARKERS = [
  {
    id: 'party', name: 'Party Store', kind: 'open', far: true, x: 385, y: 262, labelDy: -40,
    quip: 'Beer, ammo, regrets.',
    loot: ['food', 'water', 'materials'],
    danger: { calm: 1, panic: 2, collapse: 2 },
    arc: {
      calm: { lootMul: 1, danger: 1, rolls: 1, weights: { beer: 3, rockets: 1, snacks: 2, food: 2, ammo: 1, coffee: 1 } },
      panic: { lootMul: 1, danger: 2, rolls: 1, weights: { beer: 3, rockets: 2, snacks: 1, food: 1 } },
      collapse: { lootMul: 0.9, danger: 2, rolls: 1, weights: { beer: 2, rockets: 1, food: 1 } },
    },
    expect: {
      calm: 'The cooler is still doing its job.',
      panic: 'People are buying like the receipt is a will.',
      collapse: 'Mostly regrets. A few cans.',
    },
  },
  {
    id: 'hardware', name: 'Lake Orwell Hardware', kind: 'open', far: true, x: 460, y: 262, labelDy: 34,
    quip: 'No Credit, No Exceptions.',
    loot: ['materials', 'battery', 'tinfoil', 'gas'],
    danger: { calm: 1, panic: 1, collapse: 2 },
    arc: {
      calm: { lootMul: 1.1, danger: 1, rolls: 1, weights: { materials: 4, battery: 2, tinfoil: 2, gas: 1 } },
      panic: { lootMul: 0.9, danger: 1, rolls: 1, weights: { materials: 3, battery: 1, tinfoil: 1, gas: 1 } },
      collapse: { lootMul: 0.7, danger: 2, rolls: 1, weights: { materials: 2, battery: 1, gas: 1 } },
    },
    expect: {
      calm: 'Best pile of planks in town.',
      panic: 'The nail bins are being loved too hard.',
      collapse: 'Picked over. The bolts remain, out of spite.',
    },
  },
  {
    id: 'super', name: 'Big-Box Supercenter', kind: 'open', far: true, x: 640, y: 294, labelDy: 36,
    quip: 'Everything. Probably.',
    loot: ['food', 'food', 'water'],
    danger: { calm: 1, panic: 2, collapse: 3 },
    arc: {
      calm: { lootMul: 1.6, danger: 1, rolls: 2, weights: { food: 5, water: 3, snacks: 2, tp: 4 } },
      panic: { lootMul: 0.75, danger: 3, rolls: 1, crowd: true, weights: { food: 2, water: 1, snacks: 1, tp: 1 } },
      collapse: {
        lootMul: 0.4, danger: 3, rolls: 1, crowd: true,
        boardedFrom: 25,
        boardedLine: "Boarded up. Somebody wrote 'NO' on it. Just 'NO.'",
        weights: { food: 1 },
      },
    },
    expect: {
      calm: 'Stocked. Take the cans while that sentence is true.',
      panic: 'Crowded. The kale is still there.',
      collapse: 'Scarce, loud, and a bad place to linger.',
    },
  },
  {
    id: 'pharmacy', name: 'Pharmacy', kind: 'open', x: 538, y: 400, labelDy: 34,
    quip: 'Aspirin, bandages, last hopes.',
    loot: ['medicine', 'medicine', 'water'],
    danger: { calm: 1, panic: 2, collapse: 2 },
    arc: {
      calm: { lootMul: 1, danger: 1, rolls: 1, weights: { medicine: 4, coffee: 2, water: 1 } },
      panic: { lootMul: 0.45, danger: 2, rolls: 1, weights: { medicine: 1, coffee: 1 } },
      collapse: {
        lootMul: 0.35, danger: 2, rolls: 1,
        weights: { coffee: 1 },
        jackpot: 0.18, jackpotItem: 'medicine', jackpotCount: 3,
      },
    },
    expect: {
      calm: 'Bandages and unsolicited advice.',
      panic: 'The useful shelf is shorter.',
      collapse: 'Breath mints and a bad feeling.',
    },
  },
  {
    id: 'tavern', name: "Rusty's Tavern", kind: 'open', far: true, x: 385, y: 400, labelDy: -42,
    quip: 'The jukebox still works. Nobody knows why.',
    loot: ['food', 'morale', 'rumor'],
    danger: { calm: 1, panic: 2, collapse: 3 },
    // Part 2: from Day 21 this pin is also the swap meet. Rumors stay. Do not build the stalls here.
    arc: {
      calm: { lootMul: 1, danger: 1, rolls: 1, weights: { food: 2, beer: 3, cigarettes: 1 } },
      panic: { lootMul: 0.9, danger: 2, rolls: 1, weights: { food: 1, beer: 2, cigarettes: 1 } },
      collapse: { lootMul: 0.7, danger: 3, rolls: 1, weights: { food: 1, beer: 2 } },
    },
    expect: {
      calm: 'Gossip, and sometimes a decent find.',
      panic: 'The rumors are louder than the jukebox.',
      collapse: 'Swap meet. Bring something good.',
    },
  },
  {
    id: 'home', name: 'Your House', kind: 'home', x: 675, y: 519, labelDy: 32,
    quip: 'Home sweet hole.',
    loot: [],
    expect: { calm: 'The hatch is the part you are proud of.', panic: 'The hatch is the part you are proud of.', collapse: 'The hatch is the part you are proud of.' },
  },
  {
    id: 'bait', name: 'The Bait & Brew', kind: 'open', far: true, x: 94, y: 344, labelDy: 30,
    quip: "Bait, coffee, lottery tickets. Nobody's sure which keeps it open.",
    tint: 0x7f9bb8,
    mist: true,
    loot: ['coffee', 'snacks', 'water', 'beer'],
    danger: { calm: 1, panic: 2, collapse: 2 },
    arc: {
      calm: { lootMul: 1, danger: 1, rolls: 1, weights: { coffee: 4, snacks: 3, water: 2, beer: 2, food: 1 } },
      panic: { lootMul: 0.8, danger: 2, rolls: 1, weights: { coffee: 3, snacks: 2, beer: 2, water: 1 } },
      collapse: { lootMul: 0.6, danger: 2, rolls: 1, weights: { coffee: 2, beer: 1, snacks: 1 } },
    },
    expect: {
      calm: 'Coffee, nightcrawlers, and a lottery ticket that is mostly a wish.',
      panic: 'The coffee is the serious shelf.',
      collapse: 'Far side of town. The road has opinions.',
    },
  },
  {
    id: 'church', name: "St. Casimir's", kind: 'open', x: 531, y: 294, labelDy: -44,
    opensOn: 6,
    quip: "Everything's a quarter. Nobody's haggling.",
    reason: 'Rummage sale starts next week. Optimistic.',
    tint: 0xffe2b0,
    flicker: 'fluorescent',
    loot: ['materials', 'tinfoil', 'morale'],
    danger: { calm: 1, panic: 1, collapse: 1 },
    arc: {
      calm: { lootMul: 0.8, danger: 1, rolls: 1, weights: { tinfoil: 3, materials: 2, snacks: 1 } },
      panic: { lootMul: 0.8, danger: 1, rolls: 1, weights: { tinfoil: 2, materials: 2, snacks: 1, beer: 1 } },
      collapse: { lootMul: 0.6, danger: 1, rolls: 1, weights: { tinfoil: 2, materials: 1 } },
    },
    expect: {
      calm: "Everything's a quarter. The basement is fluorescent and patient.",
      panic: 'A basement of junk that turned out to be useful.',
      collapse: 'Still a quarter. Still no haggling.',
    },
  },
  {
    id: 'dairy', name: 'The Dairy Shack', kind: 'open', x: 538, y: 519, labelDy: -36,
    quip: 'SEE YOU IN MAY.',
    tint: 0xd7b0c8,
    loot: ['snacks', 'water', 'food'],
    danger: { calm: 1, panic: 1, collapse: 1 },
    arc: {
      calm: { lootMul: 0.7, danger: 1, rolls: 1, weights: { snacks: 3, water: 2, food: 1 } },
      panic: { lootMul: 0.7, danger: 1, rolls: 1, weights: { snacks: 2, water: 2 } },
      collapse: { lootMul: 0.6, danger: 1, rolls: 1, weights: { snacks: 2, water: 1 } },
    },
    expect: {
      calm: 'Closed for the season. The season did not get the note.',
      panic: 'A safe stop when everything else is loud.',
      collapse: 'A neighbor could be hiding behind the soft-serve machine.',
    },
  },
  {
    id: 'tent', name: 'Fireworks Tent', kind: 'open', far: true, x: 880, y: 345, labelDy: 34,
    closesOn: 21,
    closedLine: 'Gone. Just a scorch mark and a sign.',
    quip: 'Explosives, sold from a folding chair.',
    bg: 'bg-fireworks-tent',
    loot: ['rockets', 'snacks', 'gas'],
    danger: { calm: 1, panic: 2, collapse: 2 },
    arc: {
      calm: { lootMul: 0.5, danger: 1, rolls: 1, weights: { snacks: 2, gas: 1 } },
      panic: { lootMul: 0.4, danger: 2, rolls: 1, weights: { snacks: 1, gas: 1 } },
      collapse: {
        lootMul: 0, danger: 1, rolls: 0, weights: { snacks: 1 },
        boardedFrom: 21,
        boardedLine: 'Gone. Just a scorch mark and a sign.',
      },
    },
    expect: {
      calm: 'He says the bottle rockets are basically safe. He is missing two eyebrows.',
      panic: 'Crates, a folding chair, and a man who has made peace with sparks.',
      collapse: 'Gone. Just a scorch mark and a sign.',
    },
  },
  {
    id: 'towerwater', name: 'Water Tower', kind: 'landmark', x: 250, y: 470, labelDy: -32,
    quip: "CLASS OF '96.",
    reason: "'CLASS OF '96' spray-painted in 1996. Nobody ever painted over it. It's the most finished thing in town.",
  },
  {
    id: 'camp', name: 'Deer Camp', kind: 'locked', x: 828, y: 129, labelDy: 30,
    quip: 'Out past town. Need a truck that starts.',
    reason: 'Out past town. Need a truck that starts.',
  },
  {
    id: 'gary', name: "Gary's Place", kind: 'locked', x: 1075, y: 362, labelDy: 32,
    quip: "Gary says come back when you've earned it.",
    reason: "Gary says come back when you've earned it.",
  },
  {
    id: 'tower', name: 'Radio Tower', kind: 'locked', x: 1131, y: 56, labelDy: 0, silent: true,
    quip: 'Static. And something else.',
    reason: 'Static. And something else.',
  },
];

export function markerById(id) {
  return MARKERS.find((marker) => marker.id === id) || null;
}

export function phaseProfile(marker, phase) {
  if (!marker?.arc) return null;
  const key = phase === 'end' ? 'collapse' : phase;
  return marker.arc[key] || marker.arc.calm || null;
}

export function markerDanger(marker, phase) {
  const arc = phaseProfile(marker, phase);
  if (arc?.danger) return arc.danger;
  if (!marker?.danger) return 0;
  const key = phase === 'end' ? 'collapse' : phase;
  return marker.danger[key] || marker.danger.calm || 1;
}
