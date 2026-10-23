/** Day 30 broadcast, bunker zombies, and ending lines. Jeff can retune copy here. */

export const APOCALYPSE_LINES = [
  "Day 30. Lake Orwell. This is The Last Shift on 88.3. The needle has already left.",
  "Sirens downtown. More of them than the town owns. I checked my math. The math left too.",
  "The party store, the pharmacy, Rusty's. The doors are open. People are not using them correctly.",
  "I was wrong about the toaster. I was wrong about the moon. I hate being wrong in this specific way.",
  "They're walking like the diagram. They're moaning like Larry's wind. The wind filed a complaint.",
  "If you are in the hole, stay in the hole. If you are not, become the kind of person who is.",
  "I'm going to say the quiet part—",
];

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

export const WIN_LINES = [
  'Ten days. The hatch still closes. I had a eulogy ready, which is embarrassing for both of us.',
  'Biscuit is fine. You are approximately fine. The town is a rumor that learned to walk.',
  "This has been The Last Shift on 88.3. Get some sleep. Or don't. I'm not your dad. Probably.",
];

/** Said after the name, once. Hints at the loop. Does not explain it. Does not repeat the name. */
export const LOSS_HINT = 'That is the last clean word. I used to be on your side of the hatch. Leave it there.';

export function zombieById(id) {
  return ZOMBIES.find((item) => item.id === id) || ZOMBIES[0];
}
