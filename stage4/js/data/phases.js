/** One-card and one-line copy for the days the town changes. */
export const PHASE_COPY = {
  1: {
    title: 'CALM BEFORE',
    radio: 'Day one. The town is still pretending this is weather. I am pretending I have a format.',
    card: 'The stores are open. The rumors are cheap. Biscuit has already eaten.',
  },
  11: {
    title: 'PANIC BUYING',
    radio: 'Day eleven. Prices went up while I was finding the aux cable. That one is on me.',
    card: 'Prices are up. Patience is down. The Supercenter has a line around the building.',
  },
  21: {
    title: 'COLLAPSE',
    radio: 'Day twenty-one. The roads are negotiating with potholes. The potholes are winning. I would know.',
    card: 'Stores are thin. Some roads are out. People are knocking who used to wave.',
  },
  30: {
    title: 'THE END',
    radio: 'Day thirty. I do not have a closer. I have this microphone and a feeling I trust.',
    card: 'Today. The map can wait. The radio cannot.',
  },
};

export function phaseCopy(day) {
  return PHASE_COPY[day] || null;
}
