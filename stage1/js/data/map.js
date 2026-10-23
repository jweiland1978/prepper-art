/**
 * Marker table for the 1280×720 town map.
 * Coordinates are the pin centers from the spec. labelDy nudges the name plate
 * so neighbors don't sit on each other. Jeff can move both.
 */
export const MARKERS = [
  {
    id: 'party', name: 'Party Store', kind: 'open', x: 385, y: 262, labelDy: -40,
    quip: 'Beer, ammo, regrets.',
    loot: ['food', 'water', 'materials'],
    danger: { calm: 1, panic: 2, collapse: 2 },
    expect: {
      calm: 'The cooler is still doing its job.',
      panic: 'People are buying like the receipt is a will.',
      collapse: 'Mostly regrets. A few cans.',
    },
  },
  {
    id: 'hardware', name: 'Hardware Store', kind: 'open', x: 460, y: 262, labelDy: 34,
    quip: 'Tools, nails, poor decisions.',
    loot: ['materials', 'materials', 'weapon'],
    danger: { calm: 1, panic: 1, collapse: 2 },
    expect: {
      calm: 'Best pile of planks in town.',
      panic: 'The nail bins are being loved too hard.',
      collapse: 'Picked over. The bolts remain, out of spite.',
    },
  },
  {
    id: 'super', name: 'Big-Box Supercenter', kind: 'open', x: 640, y: 294, labelDy: 36,
    quip: 'Everything. Probably.',
    loot: ['food', 'food', 'water'],
    danger: { calm: 1, panic: 2, collapse: 3 },
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
    expect: {
      calm: 'Bandages and unsolicited advice.',
      panic: 'The useful shelf is shorter.',
      collapse: 'Breath mints and a bad feeling.',
    },
  },
  {
    id: 'tavern', name: "Rusty's Tavern", kind: 'open', x: 385, y: 400, labelDy: -42,
    quip: 'The jukebox still works. Nobody knows why.',
    loot: ['food', 'morale', 'rumor'],
    danger: { calm: 1, panic: 2, collapse: 3 },
    expect: {
      calm: 'Gossip, and sometimes a decent find.',
      panic: 'The rumors are louder than the jukebox.',
      collapse: 'Dark. Something moved a stool.',
    },
  },
  {
    id: 'home', name: 'Your House', kind: 'home', x: 675, y: 519, labelDy: 32,
    quip: 'Home sweet hole.',
    loot: [],
    expect: { calm: 'The hatch is the part you are proud of.', panic: 'The hatch is the part you are proud of.', collapse: 'The hatch is the part you are proud of.' },
  },
  {
    id: 'bait', name: 'Bait Shop', kind: 'locked', x: 94, y: 344, labelDy: 30,
    quip: 'Closed. Gone fishing. Forever, possibly.',
    reason: 'Closed. Gone fishing. Forever, possibly.',
  },
  {
    id: 'church', name: 'Church', kind: 'locked', x: 531, y: 294, labelDy: -44,
    quip: 'Rummage sale starts next week. Optimistic.',
    reason: 'Rummage sale starts next week. Optimistic.',
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

export function markerDanger(marker, phase) {
  if (!marker?.danger) return 0;
  const key = phase === 'end' ? 'collapse' : phase;
  return marker.danger[key] || marker.danger.calm || 1;
}
