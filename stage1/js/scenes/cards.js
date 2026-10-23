import { CONFIG } from '../config.js';
import { Audio } from '../audio.js';
import { Game } from '../state.js';
import { actionChance, oddsWord } from '../logic.js';
import { addButton, addPanel, addText } from '../ui.js';

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
  const bw = buttons.length >= 4 ? 210 : 240;
  const gap = 14;
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
  return showNotice(scene, {
    kicker: 'DANGER',
    title: opts.face || 'Trouble',
    body: `${opts.text || ''}\n\nHolding: ${weapon.name}. ${weapon.blurb}`,
    depth: opts.depth ?? 46,
    buttons: actions.map((action, index) => ({
      label: action.toUpperCase(),
      subtitle: state ? oddsWord(actionChance(action, state)) : 'Coin flip',
      primary: index === 0,
      onClick: () => opts.onPick?.(action),
    })),
  });
}
