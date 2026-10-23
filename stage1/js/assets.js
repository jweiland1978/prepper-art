const BASE = 'https://jweiland1978.github.io/prepper-art/';

/** Single table of hosted paintings. Keys stay stable if a filename changes. */
export const ASSETS = {
  bgTitle: {
    key: 'bg-title',
    url: `${BASE}bg-title.jpg`,
    kind: 'background',
  },
  bgBunker: {
    key: 'bg-bunker',
    url: `${BASE}bg-bunker.jpg`,
    kind: 'background',
  },
  bgMainstreet: {
    key: 'bg-mainstreet',
    url: `${BASE}bg-mainstreet.jpg`,
    kind: 'background',
  },
  map: {
    key: 'map-lake-orwell',
    url: `${BASE}map-lake-orwell.jpg`,
    kind: 'background',
  },
  larry: {
    key: 'portrait-larry',
    url: `${BASE}portrait-larry.jpg`,
    kind: 'portrait',
    initial: 'L',
    name: 'Larry',
  },
  kowalski: {
    key: 'portrait-kowalski',
    url: `${BASE}portrait-kowalski.jpg`,
    kind: 'portrait',
    initial: 'K',
    name: 'Mrs. Kowalski',
  },
  dale: {
    key: 'portrait-dale',
    url: `${BASE}portrait-dale.jpg`,
    kind: 'portrait',
    initial: 'D',
    name: 'Dale',
  },
  tina: {
    key: 'portrait-tina',
    url: `${BASE}portrait-tina.jpg`,
    kind: 'portrait',
    initial: 'T',
    name: 'Tina',
  },
  kevin: {
    key: 'portrait-kevin',
    url: `${BASE}portrait-kevin.jpg`,
    kind: 'portrait',
    initial: 'K',
    name: 'Kevin',
  },
  gary: {
    key: 'portrait-gary',
    url: `${BASE}portrait-gary.jpg`,
    kind: 'portrait',
    initial: 'G',
    name: 'Gary',
  },
  biscuit: {
    key: 'portrait-biscuit',
    url: `${BASE}portrait-biscuit.jpg`,
    kind: 'portrait',
    initial: 'B',
    name: 'Biscuit',
  },
};

export const ASSET_LIST = Object.values(ASSETS);
