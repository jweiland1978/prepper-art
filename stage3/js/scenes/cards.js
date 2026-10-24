import { CONFIG } from '../config.js?v=6';
import { Audio } from '../audio.js?v=6';
import { clearKnock, markOffered, recruit, recruitView, refuse } from '../crew.js?v=6';
import { actionChance, oddsWord } from '../logic.js?v=6';
import { Save } from '../save.js?v=6';
import { Game, touchState } from '../state.js?v=6';
import { addButton, addPanel, addText } from '../ui.js?v=6';

/**
 * One modal, always with a button. Clicking the dimmer does nothing, so a choice
 * can't be dismissed into a soft-lock. Pass buttons or a single button label.
 */
export function showNotice(scene, opts = {}) {
  const root = scene.add.container(0, 0).setDepth(opts.depth ?? 40);
  const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.62).setInteractive();
  const panel = addPanel(scene, 150, 108, 980, 520);
  root.add([blocker, panel]);
  Audio.rustle();

  let textX = 640;
  let wrap = 860;
  if (opts.portrait && scene.textures.exists(opts.portrait)) {
    const frame = scene.add.graphics();
    frame.lineStyle(4, CONFIG.COLORS.rust, 1);
    frame.strokeRect(188, 248, 148, 176);
    frame.lineStyle(2, CONFIG.COLORS.orange, 0.8);
    frame.strokeRect(196, 256, 132, 160);
    const img = scene.add.image(262, 336, opts.portrait);
    const scale = Math.min(124 / (img.width || 124), 148 / (img.height || 148));
    img.setScale(scale);
    if (opts.grey) {
      img.setTint(0x888888);
      frame.lineStyle(4, 0x6a7380, 1);
      frame.strokeRect(188, 248, 148, 176);
    }
    root.add([frame, img]);
    textX = 760;
    wrap = 560;
  }

  if (opts.kicker) {
    root.add(addText(scene, textX, 140, opts.kicker, {
      fontFamily: CONFIG.FONTS.heading,
      fontSize: '16px',
      color: CONFIG.COLORS.orangeCss,
      originX: 0.5,
      originY: 0.5,
    }));
  }
  root.add(addText(scene, textX, 186, opts.title || '', {
    fontFamily: CONFIG.FONTS.display,
    fontSize: '40px',
    color: CONFIG.COLORS.text,
    originX: 0.5,
    originY: 0.5,
    align: 'center',
    wordWrap: { width: wrap },
  }));
  root.add(addText(scene, textX, 230, opts.body || '', {
    fontFamily: opts.radio ? CONFIG.FONTS.radio : CONFIG.FONTS.body,
    fontSize: '18px',
    color: CONFIG.COLORS.text,
    originX: 0.5,
    originY: 0,
    align: 'center',
    wordWrap: { width: wrap },
    lineSpacing: 4,
  }));
  opts.decorate?.(root, scene);

  const buttons = opts.buttons?.length
    ? opts.buttons
    : [{ label: opts.button || 'CLOSE', primary: true, onClick: opts.onClose }];
  const bw = opts.buttonW || (buttons.length >= 5 ? 176 : buttons.length >= 4 ? 200 : 240);
  const gap = buttons.length >= 5 ? 10 : 14;
  const total = buttons.length * bw + (buttons.length - 1) * gap;
  let x = 640 - total / 2 + bw / 2;
  const close = () => {
    if (root.active) root.destroy();
  };
  buttons.forEach((button) => {
    const node = addButton(scene, x, 560, button.label, () => {
      close();
      button.onClick?.();
    }, {
      w: bw,
      h: button.subtitle ? 64 : 54,
      primary: !!button.primary,
      subtitle: button.subtitle || '',
      fontSize: button.fontSize || (buttons.length >= 5 ? '18px' : '22px'),
    });
    root.add(node);
    x += bw + gap;
  });
  return { root, close };
}

export function showDanger(scene, opts) {
  const state = Game.state;
  const weapon = CONFIG.WEAPONS[state?.weapon] || CONFIG.WEAPONS.bare_hands;
  const actions = ['fight', 'hide', 'bargain', 'run'];
  const buttons = actions.map((action, index) => ({
    label: action.toUpperCase(),
    subtitle: state ? oddsWord(actionChance(action, state)) : 'Coin flip',
    primary: index === 0,
    onClick: () => opts.onPick?.(action),
  }));
  const rockets = state?.stash?.rockets || 0;
  if (rockets >= 1) {
    buttons.push({
      label: 'LIGHT ONE',
      subtitle: `×${rockets}`,
      fontSize: '16px',
      onClick: () => opts.onPick?.('light'),
    });
  }
  return showNotice(scene, {
    kicker: 'DANGER',
    title: opts.face || 'Trouble',
    body: `${opts.text || ''}\n\nHolding: ${weapon.name}. ${weapon.blurb}`,
    depth: opts.depth ?? 46,
    buttons,
  });
}

/** Recruit card. Resolves with the line to show next. Joining is free. */
export function presentRecruit(scene, id, opts = {}) {
  const state = Game.state;
  if (!state || !id) return Promise.resolve('');
  markOffered(state, id);
  const view = recruitView(state, id);
  return new Promise((resolve) => {
    const done = (text) => {
      clearKnock(state);
      touchState();
      Save.write(state);
      resolve(text || '');
    };
    showNotice(scene, {
      kicker: opts.source === 'knock' ? 'KNOCK AT THE HATCH' : 'NEIGHBOR',
      title: view.name,
      portrait: view.portrait,
      body: view.body,
      buttons: [
        {
          label: 'NOT TODAY',
          onClick: () => {
            const result = refuse(state, id, opts.source);
            done(result.morale ? `${result.line}\n\nMorale ${result.morale}.` : result.line);
          },
        },
        {
          label: 'WELCOME ABOARD',
          primary: true,
          onClick: () => {
            const result = recruit(state, id);
            const finish = () => done(result.ok ? result.line : result.reason);
            if (result.ok) offerTip(scene, 'recruit', finish);
            else finish();
          },
        },
      ],
    });
  });
}

const TIPS = {
  recruit: {
    title: 'CREW',
    body: 'Jobs are on the crew board downstairs. Rest, guard, work, or come along. One of them can also go out alone, once a day. That does not cost an action.',
  },
  trade: {
    title: 'BARTER',
    body: 'Arrows move goods. The bar wants to land near the middle. A coat is not a casual trade.',
  },
  rocket: {
    title: 'BOTTLE ROCKET',
    body: 'LIGHT ONE shows up on a danger card when you are holding rockets. It spends one. It is a mood with a fuse.',
  },
  swap: {
    title: 'SWAP MEET',
    body: "Rusty's tables take one action. Prices wobble. Leave when the story gets longer than the haul.",
  },
  loss: {
    title: 'THE WALL',
    body: 'Their name is on the plank by the ladder. The cot stays empty. The radio will say the name.',
  },
};

/** One skippable card per first. Seen flags live on the save. */
export function offerTip(scene, key, onDone) {
  const state = Game.state;
  const tip = TIPS[key];
  if (!scene || !state || !tip) {
    onDone?.();
    return;
  }
  state.flags.tips = state.flags.tips || {};
  if (state.flags.tips[key]) {
    onDone?.();
    return;
  }
  state.flags.tips[key] = true;
  touchState();
  Save.write(state);
  showNotice(scene, {
    kicker: 'FIRST TIME',
    title: tip.title,
    body: tip.body,
    depth: 80,
    buttons: [
      { label: 'SKIP', onClick: () => onDone?.() },
      { label: 'GOT IT', primary: true, onClick: () => onDone?.() },
    ],
  });
}
