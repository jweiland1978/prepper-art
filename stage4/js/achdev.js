/**
 * Test hooks for the achievement system (Playwright and the dev console).
 * Reading these changes nothing; the functions are the same ones the game calls.
 */
import * as Ach from './achievements.js?v=2';
import * as Meta from './meta.js?v=2';
import * as Logic from './logic.js?v=2';
import * as Crew from './crew.js?v=2';
import * as Rumors from './rumors.js?v=2';
import * as State from './state.js?v=2';
import * as Trade from './trade.js?v=2';
import { Save } from './save.js?v=2';
import * as Unlocks from './unlocks.js?v=2';
import * as UnlockData from './data/unlocks.js?v=2';
import * as Dev from './dev.js?v=2';

globalThis.__PREPPER_ACH = {
  Ach, Meta, Logic, Crew, Rumors, State, Trade, Save, Unlocks, UnlockData, Dev,
  meta: () => JSON.parse(JSON.stringify(Meta.readMeta())),
  run: () => JSON.parse(JSON.stringify(State.Game.state?.ach || null)),
  list: () => Ach.ACHIEVEMENTS.map((row) => row.id),
};
