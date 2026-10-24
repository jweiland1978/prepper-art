import { CONFIG, phaseForDay } from './config.js?v=5';
import { Game, changeStat, newRun, syncDerived, touchState } from './state.js?v=5';
import { Save } from './save.js?v=5';
import { addButton, addText } from './ui.js?v=5';

/** Only the ?dev=1 buttons call these. Caps rise with the grant so the food actually stays. */
export function devSkip(state, day) {
  state.mode = 'prep';
  state.ending = null;
  state.day = day;
  state.survivalDay = 0;
  state.actionsLeft = CONFIG.ACTIONS_PER_DAY;
  state.phase = phaseForDay(day);
  state.flags = state.flags || {};
  delete state.flags.script;
  delete state.flags.scriptDay;
  delete state.flags.radioHeard;
  delete state.flags.bannerDay;
  delete state.flags.trip;
  delete state.flags.survival;
  delete state.flags.apocalypseSeen;
  delete state.flags.nightReport;
  delete state.flags.upkeepDay;
  delete state.flags.scorecard;
  delete state.flags.brace;
  delete state.flags.seenZombies;
  delete state.flags.barricadeReady;
  delete state.flags.downReason;
  syncDerived(state);
  touchState();
  Save.write(state);
  return state;
}

export function devGrant(state) {
  state.flags = state.flags || {};
  state.flags.devStock = (state.flags.devStock || 0) + 20;
  changeStat('food', 20);
  changeStat('water', 20);
  changeStat('materials', 20);
  changeStat('medicine', 20);
  changeStat('health', 20);
  changeStat('morale', 20);
  touchState();
  Save.write(state);
  return state;
}

const DAYS = [10, 20, 29, 30];

function devButtons(scene, y, x0, onSkip, onGrant) {
  const nodes = [];
  DAYS.forEach((day, index) => {
    nodes.push(addButton(scene, x0 + index * 132, y, `DAY ${day}`, () => onSkip(day), {
      w: 122, h: 40, fontSize: '16px', depth: 80,
    }));
  });
  nodes.push(addButton(scene, x0 + DAYS.length * 132, y, '+20 EACH', () => onGrant(), {
    w: 122, h: 40, fontSize: '16px', primary: true, depth: 80,
  }));
  return nodes;
}

/** Hidden unless the URL has ?dev=1. */
export function mountDevTools(scene, opts = {}) {
  if (!Game.dev) return null;
  const y = opts.y ?? 618;
  if (opts.mode === 'row') {
    const label = addText(scene, 150, y, 'DEV', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '16px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }).setDepth(80);
    const nodes = devButtons(scene, y, 250, opts.onSkip, opts.onGrant);
    return { label, nodes };
  }

  let panel = null;
  const close = () => {
    panel?.destroy();
    panel = null;
    Game.hudLock = false;
  };
  const open = () => {
    opts.onOpen?.();
    close();
    Game.hudLock = true;
    panel = scene.add.container(0, 0).setDepth(60);
    const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.28).setInteractive();
    blocker.on('pointerup', close);
    panel.add(blocker);
    panel.add(addText(scene, 150, y, 'DEV', {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '16px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }));
    devButtons(scene, y, 250, (day) => {
      close();
      opts.onSkip?.(day);
    }, () => {
      close();
      opts.onGrant?.();
    }).forEach((node) => panel.add(node));
  };
  addButton(scene, 78, 688, 'DEV', open, { w: 88, h: 36, fontSize: '16px', depth: 70 });
  return { open, close };
}

export function devBootRun(day) {
  const state = newRun('Neighbor');
  return devSkip(state, day);
}
