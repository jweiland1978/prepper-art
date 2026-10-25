/**
 * Test hooks for the achievement system (Playwright and the dev console).
 * Reading these changes nothing; the functions are the same ones the game calls.
 */
import * as Ach from './achievements.js?v=5';
import * as Meta from './meta.js?v=5';
import * as Logic from './logic.js?v=5';
import * as Crew from './crew.js?v=5';
import * as Rumors from './rumors.js?v=5';
import * as State from './state.js?v=5';
import * as Trade from './trade.js?v=5';
import { Save } from './save.js?v=5';
import * as Unlocks from './unlocks.js?v=5';
import * as UnlockData from './data/unlocks.js?v=5';
import * as Dev from './dev.js?v=5';
import * as Tower from './tower.js?v=5';
import * as Guide from './guide.js?v=5';
import { Audio } from './audio.js?v=5';

globalThis.__PREPPER_ACH = {
  Ach, Meta, Logic, Crew, Rumors, State, Trade, Save, Unlocks, UnlockData, Dev, Tower, Guide, Audio,
  meta: () => JSON.parse(JSON.stringify(Meta.readMeta())),
  run: () => JSON.parse(JSON.stringify(State.Game.state?.ach || null)),
  list: () => Ach.ACHIEVEMENTS.map((row) => row.id),
};
