/** Short night beats. Danger is resolved with the same four choices as a trip. */
export const NIGHT_EVENTS = [
  { id: 'wolves', weight: 3, text: 'Something howls past the county line. It stays there. You allow it.' },
  { id: 'dale-light', weight: 2, text: "Dale's flashlight sweeps the yard. He writes nothing down. This is growth.", deltas: { morale: 1 } },
  { id: 'buoy', weight: 3, text: 'A buoy clanks out on Pine Lake. Gary would know its name. You do not. You sleep anyway.' },
  { id: 'biscuit', weight: 3, text: 'Biscuit alerts at the hatch, once, then goes back to sleep. Employed. Unharmed. Correct.' },
  { id: 'one-note', weight: 3, text: 'The radio plays one note and thinks better of it. You agree with the radio.' },
  { id: 'raccoon', weight: 2, text: 'A raccoon files a complaint at the hatch and leaves. You keep the latch. Morale files a smaller complaint.', deltas: { morale: -1 } },
  { id: 'flicker', weight: 2, text: 'The bulb flickers. Old wiring, or the town clearing its throat. Neither sends a follow-up.' },
  {
    id: 'looter',
    kind: 'danger',
    weight: 1,
    weightByPhase: { calm: 1, panic: 2, collapse: 3 },
    face: 'A looter at the hatch',
    text: 'Somebody tries the hatch. They are bad at it, and still here.',
    bias: ['materials', 'food'],
  },
];
