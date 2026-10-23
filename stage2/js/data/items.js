/**
 * Stash catalog. Trade numbers live in CONFIG.TRADE.
 * icon "code" is drawn in the UI. Painted icons use the asset key.
 */
export const ITEMS = [
  {
    id: 'coffee', name: 'Coffee', icon: 'code', stackable: true, use: 'drink',
    description: "Ground, not instant. We're not animals.",
  },
  {
    id: 'battery', name: 'Batteries', icon: 'code', stackable: true, use: 'radio',
    description: 'AA. Always AA. Never the size you need.',
  },
  {
    id: 'tp', name: 'Toilet paper', icon: 'code', stackable: true, use: 'trade',
    description: 'Briefly worth more than gold. Then, suddenly, not.',
  },
  {
    id: 'gas', name: 'Gas can', icon: 'code', stackable: true, use: 'generator',
    description: 'Half full. Or half empty. Depends on the day.',
  },
  {
    id: 'cigarettes', name: 'Cigarettes', icon: 'code', stackable: true, use: 'trade',
    description: "You quit in 2009. You're holding them for a friend.",
  },
  {
    id: 'ammo', name: 'Ammo', icon: 'code', stackable: true, use: 'trade',
    description: "For a rifle you don't have yet. Very optimistic.",
  },
  {
    id: 'tinfoil', name: 'Tinfoil', icon: 'code', stackable: true, use: 'trade',
    description: "One roll. Larry's eyes lit up from across the street.",
  },
  {
    id: 'snacks', name: 'Snacks', icon: 'code', stackable: true, use: 'eat',
    description: 'Gas-station snack cakes. Shelf life: yes.',
  },
  {
    id: 'beer', name: 'Pine Lake Light', icon: 'icon-beer', stackable: true, use: 'crack',
    description: "Silver can. Tastes like a cold lake. That's not an endorsement.",
  },
  {
    id: 'rockets', name: 'Bottle rockets', icon: 'icon-bottle-rockets', stackable: true, use: 'light',
    description: 'Not a weapon so much as a lifestyle.',
  },
  {
    id: 'coat', name: 'The Mackinaw', icon: 'icon-mackinaw', stackable: false, use: 'wear',
    description: 'Red and black wool. It will outlive you, your house, and possibly the concept of houses.',
  },
];

export const STAT_GOODS = [
  { id: 'food', name: 'Food', icon: 'code', stackable: true, description: 'Cans. The shelf takes them personally.' },
  { id: 'water', name: 'Water', icon: 'code', stackable: true, description: 'Jugs. Tastes like a hose. Correct.' },
  { id: 'materials', name: 'Materials', icon: 'code', stackable: true, description: 'Planks, nails, and the idea of a wall.' },
  { id: 'medicine', name: 'Medicine', icon: 'code', stackable: true, description: 'Bottles. Tina trusts them. The heat does not.' },
];

const ALL = [...ITEMS, ...STAT_GOODS];

export function itemById(id) {
  return ALL.find((row) => row.id === id) || null;
}

export const PAINTED_ICONS = {
  beer: 'icon-beer',
  rockets: 'icon-bottle-rockets',
  coat: 'icon-mackinaw',
};
