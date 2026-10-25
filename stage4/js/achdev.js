/**
 * Test hooks for the achievement system (Playwright and the dev console).
 * Reading these changes nothing; the functions are the same ones the game calls.
 */
import * as Ach from './achievements.js?v=1';
import * as Meta from './meta.js?v=1';
import * as Logic from './logic.js?v=1';
import * as Crew from './crew.js?v=1';
import * as Rumors from './rumors.js?v=1';
import * as State from './state.js?v=1';
import * as Trade from './trade.js?v=1';
import { Save } from './save.js?v=1';

globalThis.__PREPPER_ACH = {
  Ach, Meta, Logic, Crew, Rumors, State, Trade, Save,
  meta: () => JSON.parse(JSON.stringify(Meta.readMeta())),
  run: () => JSON.parse(JSON.stringify(State.Game.state?.ach || null)),
  list: () => Ach.ACHIEVEMENTS.map((row) => row.id),
};
