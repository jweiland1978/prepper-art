/**
 * Stash, trade overlay, swap meet, rocket cards, and the Mackinaw moment.
 * The scene list stays as it was. These are overlays.
 */
import { CONFIG } from '../config.js?v=6';
import { ITEMS, STAT_GOODS, itemById } from '../data/items.js?v=6';
import { COAT_LINES, GARY_COAT } from '../data/traders.js?v=6';
import { drinkCoffee, nickCrew, recruited, resolveNotice } from '../crew.js?v=6';
import { applyDeltas, oddsWord, resolveDanger } from '../logic.js?v=6';
import { Save } from '../save.js?v=6';
import { Game, touchState } from '../state.js?v=6';
import { Audio } from '../audio.js?v=6';
import { addButton, addText } from '../ui.js?v=6';
import { offerTip, showDanger, showNotice } from './cards.js?v=6';
import { larryPanicDue, presentLarryPanic } from '../heist.js?v=6';
import {
  beginMeet,
  crackBeer,
  dealQuote,
  distressAllowed,
  distressChance,
  eatSnack,
  executeDeal,
  fireRocket,
  grantCoat,
  holdCount,
  itemBlurb,
  makeTrader,
  maybeGaryCoat,
  medicineTargets,
  moveGood,
  priceArrow,
  priceOf,
  useMedicine,
} from '../trade.js?v=6';

const NAMES = { tip: 'A tip', dock: 'Sewer map' };

function goodName(id) {
  return NAMES[id] || itemById(id)?.name || id;
}

export function drawSilverCan(g, x, y, scale = 1) {
  const w = 14 * scale;
  const h = 22 * scale;
  g.fillStyle(0xc5ccd1, 1);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 3 * scale);
  g.fillStyle(0xe7ebee, 1);
  g.fillRect(x - w / 2, y - h / 2, w, 3 * scale);
  g.fillStyle(0x1f6b3a, 1);
  g.fillTriangle(x, y - 4 * scale, x - 4 * scale, y + 4 * scale, x + 4 * scale, y + 4 * scale);
  g.fillRect(x - 1 * scale, y + 3 * scale, 2 * scale, 4 * scale);
}

export function drawItemIcon(g, id, x, y) {
  if (id === 'coffee') {
    g.fillStyle(0x6b3a22, 1);
    g.fillRoundedRect(x - 10, y - 8, 20, 18, 3);
    g.fillStyle(0xc4a574, 1);
    g.fillRect(x - 8, y - 4, 16, 4);
  } else if (id === 'battery') {
    g.fillStyle(0x2f6b3a, 1);
    g.fillRoundedRect(x - 6, y - 12, 12, 22, 2);
    g.fillStyle(0xd7dde4, 1);
    g.fillRect(x - 3, y - 16, 6, 4);
  } else if (id === 'tp') {
    g.fillStyle(0xf4efe4, 1);
    g.fillCircle(x, y, 10);
    g.fillStyle(0xc4a574, 1);
    g.fillCircle(x, y, 3);
  } else if (id === 'gas') {
    g.fillStyle(0xc45c38, 1);
    g.fillRoundedRect(x - 9, y - 8, 16, 18, 2);
    g.fillRect(x + 7, y - 2, 5, 4);
    g.fillStyle(0x1a120c, 1);
    g.fillRect(x - 2, y - 12, 4, 5);
  } else if (id === 'cigarettes') {
    g.fillStyle(0xf4efe4, 1);
    g.fillRoundedRect(x - 12, y - 6, 24, 12, 2);
    g.fillStyle(0xc45c38, 1);
    g.fillRect(x + 6, y - 6, 6, 12);
  } else if (id === 'ammo') {
    g.fillStyle(0x8a6a32, 1);
    g.fillRoundedRect(x - 12, y - 8, 24, 16, 2);
    g.fillStyle(0xe6d3ae, 1);
    g.fillRect(x - 8, y - 2, 16, 3);
  } else if (id === 'tinfoil') {
    g.fillStyle(0xd7dde4, 1);
    g.fillRoundedRect(x - 8, y - 10, 16, 20, 4);
    g.lineStyle(1, 0x8a93a3, 0.8);
    g.lineBetween(x - 4, y - 6, x + 4, y - 2);
    g.lineBetween(x - 4, y + 2, x + 4, y + 6);
  } else if (id === 'snacks') {
    g.fillStyle(0xe07a32, 1);
    g.fillRoundedRect(x - 10, y - 8, 20, 16, 2);
    g.fillStyle(0xf4efe4, 1);
    g.fillRect(x - 6, y - 2, 12, 3);
  } else if (id === 'beer') {
    drawSilverCan(g, x, y, 1);
  } else if (id === 'rockets') {
    g.fillStyle(0xc45c38, 1);
    g.fillRect(x - 2, y - 4, 4, 16);
    g.fillStyle(0xf4efe4, 1);
    g.fillTriangle(x, y - 14, x - 5, y - 4, x + 5, y - 4);
  } else if (id === 'coat') {
    g.fillStyle(0x8f1d1d, 1);
    g.fillRoundedRect(x - 12, y - 10, 24, 20, 3);
    g.fillStyle(0x1a120c, 1);
    g.fillRect(x - 4, y - 10, 8, 20);
    g.fillRect(x - 12, y - 2, 24, 4);
  } else if (id === 'food') {
    g.fillStyle(0xc45c38, 1);
    g.fillRoundedRect(x - 7, y - 9, 14, 18, 2);
  } else if (id === 'water') {
    g.fillStyle(0x7eb0d4, 1);
    g.fillRoundedRect(x - 6, y - 8, 12, 16, 3);
  } else if (id === 'materials') {
    g.fillStyle(0x8a5a32, 1);
    g.fillRect(x - 12, y - 4, 24, 6);
    g.fillRect(x - 10, y + 4, 20, 5);
  } else if (id === 'medicine') {
    g.fillStyle(0xf4efe4, 1);
    g.fillRoundedRect(x - 8, y - 8, 16, 16, 2);
    g.fillStyle(0xe85d4c, 1);
    g.fillRect(x - 2, y - 6, 4, 12);
    g.fillRect(x - 6, y - 2, 12, 4);
  } else if (id === 'tip') {
    g.fillStyle(0xf4efe4, 1);
    g.fillRoundedRect(x - 8, y - 10, 16, 20, 2);
  } else if (id === 'dock') {
    g.fillStyle(0xe6d3ae, 1);
    g.fillRect(x - 10, y - 8, 20, 16);
    g.lineStyle(1, 0x8a4b2a, 1);
    g.strokeRect(x - 10, y - 8, 20, 16);
  }
}

function paintIcon(scene, id, x, y, size) {
  const parts = [];
  const frame = scene.add.graphics();
  frame.fillStyle(0x120e0c, 1);
  frame.fillRoundedRect(-size / 2, -size / 2, size, size, 8);
  frame.lineStyle(2, CONFIG.COLORS.rust, 1);
  frame.strokeRoundedRect(-size / 2, -size / 2, size, size, 8);
  parts.push(frame);
  const key = itemById(id)?.icon;
  if (key && key !== 'code' && scene.textures.exists(key)) {
    const img = scene.add.image(0, 0, key);
    const scale = Math.min((size - 8) / (img.width || size), (size - 8) / (img.height || size));
    img.setScale(scale);
    parts.push(img);
  } else {
    const g = scene.add.graphics();
    drawItemIcon(g, id, 0, 0);
    parts.push(g);
  }
  return scene.add.container(x, y, parts);
}

function arrowText(arrow) {
  if (arrow === 'up') return '▲';
  if (arrow === 'down') return '▼';
  return '';
}

function toast(scene, text) {
  const g = scene.add.graphics();
  g.fillStyle(CONFIG.COLORS.orange, 1);
  g.fillRoundedRect(-180, -18, 360, 36, 6);
  const label = addText(scene, 0, 0, text, {
    fontFamily: CONFIG.FONTS.heading,
    fontSize: '20px',
    color: CONFIG.COLORS.inkCss,
    originX: 0.5,
    originY: 0.5,
  });
  const root = scene.add.container(640, 96, [g, label]).setDepth(80);
  scene.tweens.add({
    targets: root,
    y: 78,
    alpha: 0,
    delay: 1500,
    duration: 380,
    onComplete: () => root.destroy(),
  });
}

function animateRocket(scene, onDone) {
  const reduce = !!Game.settings?.reduceEffects;
  Audio.playWhistle();
  const g = scene.add.graphics().setDepth(68);
  const spark = { t: 0 };
  scene.tweens.add({
    targets: spark,
    t: 1,
    duration: reduce ? 240 : 640,
    onUpdate: () => {
      g.clear();
      const x = 380 + spark.t * 520;
      const y = 640 - spark.t * 500;
      g.lineStyle(reduce ? 2 : 4, CONFIG.COLORS.orange, 0.95);
      g.lineBetween(380, 640, x, y);
      g.fillStyle(0xf4efe4, 1);
      g.fillCircle(x, y, reduce ? 3 : 6);
      if (!reduce) {
        g.fillStyle(CONFIG.COLORS.orange, 0.85);
        g.fillCircle(x - 12, y + 16, 2.4);
        g.fillCircle(x + 8, y + 20, 2);
        g.fillCircle(x + 2, y + 28, 1.6);
      }
    },
    onComplete: () => {
      g.clear();
      g.fillStyle(0xffe0b0, reduce ? 0.25 : 0.7);
      g.fillCircle(900, 140, reduce ? 6 : 16);
      if (!reduce) scene.cameras?.main?.shake(140, 0.004);
      scene.time.delayedCall(reduce ? 160 : 380, () => {
        g.destroy();
        onDone?.();
      });
    },
  });
}

export function presentCoat(scene, how, onDone) {
  const state = Game.state;
  Audio.playFanfare();
  toast(scene, 'Found the Mackinaw');
  const notes = recruited(state)
    .map((row) => (COAT_LINES[row.id] ? `${row.name}: "${COAT_LINES[row.id]}"` : ''))
    .filter(Boolean);
  const gift = how === 'gary' ? `\n\nGary: "${GARY_COAT}"` : '';
  const body = [itemBlurb('coat'), gift, notes.join('\n')].filter(Boolean).join('\n\n');
  showNotice(scene, {
    kicker: 'FOUND THE MACKINAW',
    title: 'The Mackinaw',
    portrait: scene.textures.exists('icon-mackinaw') ? 'icon-mackinaw' : '',
    body,
    depth: 72,
    button: 'WEAR IT',
    onClose: () => onDone?.(),
  });
}

export function presentLaunch(scene, opts = {}) {
  const state = Game.state;
  return new Promise((resolve) => {
    const result = fireRocket(state, opts);
    if (!result.ok) {
      showNotice(scene, {
        kicker: 'ROCKETS',
        title: 'Not today',
        body: result.line,
        depth: 70,
        button: 'OK',
        onClose: () => resolve(result),
      });
      return;
    }
    Save.write(state);
    touchState();
    Audio.playRocket(result.mayhem);
    animateRocket(scene, () => {
      const rec = result.filming ? '\n\nREC  Kevin is filming. He says so.' : '';
      showNotice(scene, {
        kicker: result.filming ? 'REC  ·  BOTTLE ROCKET' : 'BOTTLE ROCKET',
        title: result.mayhem === 'spectacular' ? 'Spectacular' : 'Mayhem',
        body: `${result.text}${rec}`,
        depth: 70,
        button: 'OK',
        onClose: () => offerTip(scene, 'rocket', () => resolve(result)),
      });
    });
  });
}

function bindSlot(scene, node, onTap, onStack) {
  let timer = null;
  let held = false;
  node.setSize(76, 86);
  // Part C touch pass: cover the name and price under the icon too (local y -36..60).
  node.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(0, 7, 76, 96),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  });
  node.on('pointerdown', () => {
    held = false;
    timer = scene.time.delayedCall(450, () => {
      held = true;
      onStack?.();
    });
  });
  node.on('pointerup', () => {
    timer?.remove?.();
    if (!held) onTap?.();
  });
  node.on('pointerout', () => timer?.remove?.());
}

function slotButton(scene, x, y, id, count, price, arrow, onTap, onStack) {
  const root = scene.add.container(x, y);
  root.add(paintIcon(scene, id, 0, -6, 52));
  root.add(addText(scene, 18, -24, `${count}`, {
    fontFamily: CONFIG.FONTS.heading, fontSize: '14px', color: CONFIG.COLORS.text, originX: 1, originY: 0,
  }));
  root.add(addText(scene, 0, 28, goodName(id), {
    fontFamily: CONFIG.FONTS.body, fontSize: '11px', color: CONFIG.COLORS.textMuted, originX: 0.5, originY: 0,
  }));
  const mark = arrowText(arrow);
  const priceColor = arrow === 'up' ? CONFIG.COLORS.orangeCss : arrow === 'down' ? CONFIG.COLORS.good : CONFIG.COLORS.text;
  root.add(addText(scene, 0, 42, price ? `${price}${mark}` : '', {
    fontFamily: CONFIG.FONTS.heading, fontSize: '13px', color: priceColor, originX: 0.5, originY: 0,
  }));
  bindSlot(scene, root, onTap, onStack);
  return root;
}

export function openStash(scene, onClose) {
  const state = Game.state;
  if (!state) return { close() {} };
  Game.hudLock = true;
  const root = scene.add.container(0, 0).setDepth(30);
  const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.62).setInteractive();
  root.add(blocker);
  const panel = scene.add.graphics();
  panel.fillStyle(CONFIG.COLORS.navy, 0.96);
  panel.fillRoundedRect(80, 80, 1120, 560, 12);
  panel.lineStyle(2, CONFIG.COLORS.rust, 1);
  panel.strokeRoundedRect(80, 80, 1120, 560, 12);
  root.add(panel);
  root.add(addText(scene, 640, 112, 'THE STASH', {
    fontFamily: CONFIG.FONTS.display, fontSize: '40px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
  }));
  const close = () => {
    if (root.active) root.destroy();
    Game.hudLock = false;
    onClose?.();
  };
  const refresh = () => {
    close();
    openStash(scene, onClose);
  };
  // Medicine is a stat (like food and water), so it lives in state.stats, not state.stash.
  // It still belongs in the bag: show it as the 12th slot so the player can see and use it.
  const slots = [...ITEMS, ...STAT_GOODS.filter((row) => row.id === 'medicine')];
  slots.forEach((item, index) => {
    const col = index % 6;
    const row = Math.floor(index / 6);
    const x = 200 + col * 170;
    const y = 230 + row * 150;
    const count = holdCount(state, item.id);
    const node = scene.add.container(x, y);
    node.add(paintIcon(scene, item.id, 0, 0, 72));
    node.add(addText(scene, 0, 48, item.name, {
      fontFamily: CONFIG.FONTS.body, fontSize: '13px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0,
    }));
    node.add(addText(scene, 0, 66, `×${count}`, {
      fontFamily: CONFIG.FONTS.heading, fontSize: '16px', color: count ? CONFIG.COLORS.orangeCss : CONFIG.COLORS.textMuted,
      originX: 0.5, originY: 0,
    }));
    node.setSize(90, 100);
    // Part C touch pass: the whole icon + name + count (local y -40..86).
    node.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 10, 90, 126),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    node.on('pointerup', () => openItemCard(scene, item.id, refresh));
    root.add(node);
  });
  root.add(addButton(scene, 640, 590, 'CLOSE', close, { w: 200, h: 48 }));
  return { close };
}

function openItemCard(scene, id, refresh) {
  const state = Game.state;
  const item = itemById(id);
  if (!item) return;
  const count = holdCount(state, id);
  const buttons = [{ label: 'BACK' }];
  if (id === 'coffee' && count > 0) {
    buttons.push({
      label: 'DRINK',
      primary: true,
      onClick: () => {
        const line = drinkCoffee(state);
        Save.write(state);
        touchState();
        showNotice(scene, { kicker: 'COFFEE', title: 'Coffee', body: line, depth: 70, button: 'OK', onClose: () => refresh?.() });
      },
    });
  } else if (id === 'snacks' && count > 0) {
    buttons.push({
      label: 'EAT',
      primary: true,
      onClick: () => {
        const result = eatSnack(state);
        Save.write(state);
        touchState();
        showNotice(scene, { kicker: 'SNACKS', title: 'Snack cake', body: result.line, depth: 70, button: 'OK', onClose: () => refresh?.() });
      },
    });
  } else if (id === 'beer' && count > 0) {
    buttons.push({
      label: 'CRACK ONE',
      primary: true,
      onClick: () => {
        const result = crackBeer(state, 'day');
        if (result.ok) Audio.crackCan();
        Save.write(state);
        touchState();
        showNotice(scene, { kicker: 'PINE LAKE LIGHT', title: 'Silver can', body: result.line, depth: 70, button: 'OK', onClose: () => refresh?.() });
      },
    });
  } else if (id === 'medicine' && count > 0) {
    buttons.push({
      label: 'USE',
      primary: true,
      onClick: () => openMedicinePicker(scene, refresh),
    });
  } else if (id === 'coat' && count > 0) {
    const worn = state.flags.coatWorn !== false;
    buttons.push({
      label: worn ? 'TAKE IT OFF' : 'PUT IT ON',
      primary: true,
      onClick: () => {
        state.flags.coatWorn = !worn;
        Save.write(state);
        touchState();
        refresh?.();
      },
    });
  }
  const useNote = id === 'medicine'
    ? `\n\nHeals you +${CONFIG.ITEMS.medicineHealth || 3} health, or a neighbor +${CONFIG.ITEMS.medicineCrew || 2} (and gets a laid-up neighbor back on their feet). Tina doubles it.`
    : id === 'gas'
    ? '\n\nFeeds the generator for 3 nights when it sputters. No can, no power that night.'
    : id === 'battery'
      ? '\n\nKeeps the morning broadcast clear when the generator is out. Larry also has opinions.'
      : id === 'coat' && count
        ? `\n\n${state.flags.coatWorn === false ? 'In the stash.' : 'You are wearing it.'}`
        : '';
  showNotice(scene, {
    kicker: 'STASH',
    title: item.name,
    portrait: item.icon && item.icon !== 'code' && scene.textures.exists(item.icon) ? item.icon : '',
    body: `${item.description}\n\nYou have ${count}.${useNote}`,
    depth: 60,
    buttons,
  });
}

function openMedicinePicker(scene, refresh) {
  const state = Game.state;
  const targets = medicineTargets(state);
  const hurt = targets.filter((row) => row.hurt);
  const done = (line, title = 'Medicine') => {
    Save.write(state);
    touchState();
    showNotice(scene, { kicker: 'MEDICINE', title, body: line, depth: 70, button: 'OK', onClose: () => refresh?.() });
  };
  if (!hurt.length) {
    done('Everybody is as held together as the day allows. Save the bottle.', 'Nobody needs it');
    return;
  }
  let notice = null;
  const decorate = (root) => {
    const cols = Math.min(3, hurt.length);
    const bw = 290;
    const bh = 64;
    const gap = 16;
    hurt.forEach((row, index) => {
      const col = index % cols;
      const line = Math.floor(index / cols);
      const rowCount = Math.min(cols, hurt.length - line * cols);
      const startX = 640 - (rowCount * bw + (rowCount - 1) * gap) / 2 + bw / 2;
      const sub = row.laidUp ? 'Laid up' : `Health ${Math.round(row.health)}/${row.max}`;
      const node = addButton(scene, startX + col * (bw + gap), 320 + line * (bh + gap), row.id === 'you' ? 'YOU' : row.name.toUpperCase(), () => {
        notice?.close();
        const result = useMedicine(state, row.id);
        done(result.line, row.id === 'you' ? 'You' : row.name);
      }, { w: bw, h: bh, subtitle: sub, primary: row.id === 'you', fontSize: '22px' });
      root.add(node);
    });
  };
  notice = showNotice(scene, {
    kicker: 'MEDICINE',
    title: 'Who gets it?',
    body: `You have ${state.stats?.medicine || 0}. One bottle per tap.`,
    depth: 65,
    decorate,
    buttons: [{ label: 'BACK', onClick: () => refresh?.() }],
  });
}

function traderView(spec, state) {
  if (spec && spec.stock) return spec;
  return makeTrader(spec, state);
}

export function openTrade(scene, opts = {}) {
  const state = Game.state;
  if (!state) return { close() {} };
  if (opts.who === 'gary' && maybeGaryCoat(state)) {
    grantCoat(state, 'gary');
    Save.write(state);
    presentCoat(scene, 'gary', () => openTrade(scene, { ...opts, who: 'gary' }));
    return { close() {} };
  }
  const trader = traderView(opts.trader || opts.who, state);
  if (!trader) return { close() {} };
  if (opts.who === 'kevin' && !(trader.stock.tip > 0)) {
    showNotice(scene, {
      kicker: 'KEVIN',
      title: 'Kevin',
      portrait: 'portrait-kevin',
      body: 'Kevin already traded a tip this stretch. Snack cakes can wait two days.',
      depth: 60,
      button: 'OK',
      onClose: () => opts.onDone?.('Kevin is between tips.'),
    });
    return { close() {} };
  }
  Game.hudLock = true;
  const session = { give: {}, get: {} };
  const root = scene.add.container(0, 0).setDepth(opts.depth || 50);
  const content = scene.add.container(0, 0);
  root.add(content);
  let note = '';
  const close = (line) => {
    if (root.active) root.destroy();
    if (!opts.holdLock) Game.hudLock = false;
    Save.write(state);
    touchState();
    opts.onDone?.(line || note || 'You step back from the table.');
  };
  const redraw = () => {
    content.removeAll(true);
    const blocker = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.72).setInteractive();
    content.add(blocker);
    const panel = scene.add.graphics();
    panel.fillStyle(CONFIG.COLORS.navy, 0.96);
    panel.fillRoundedRect(24, 78, 1232, 580, 12);
    panel.lineStyle(2, CONFIG.COLORS.rust, 1);
    panel.strokeRoundedRect(24, 78, 1232, 580, 12);
    content.add(panel);
    content.add(addText(scene, 180, 108, trader.name.toUpperCase(), {
      fontFamily: CONFIG.FONTS.display, fontSize: '32px', color: CONFIG.COLORS.text, originX: 0, originY: 0.5,
    }));
    content.add(addText(scene, 180, 142, trader.line || '', {
      fontFamily: CONFIG.FONTS.body, fontSize: '14px', color: CONFIG.COLORS.textMuted, originX: 0, originY: 0,
      wordWrap: { width: 280 },
    }));
    if (trader.portrait && scene.textures.exists(trader.portrait)) {
      const img = scene.add.image(96, 160, trader.portrait);
      const scale = Math.min(72 / (img.width || 72), 84 / (img.height || 84));
      img.setScale(scale);
      const frame = scene.add.graphics();
      frame.lineStyle(3, CONFIG.COLORS.rust, 1);
      frame.strokeRoundedRect(96 - 40, 160 - 46, 80, 92, 6);
      content.add([img, frame]);
    } else {
      const g = scene.add.graphics();
      g.fillStyle(0x1a120c, 1);
      g.fillCircle(96, 150, 28);
      g.fillRoundedRect(76, 176, 40, 36, 8);
      g.lineStyle(2, CONFIG.COLORS.rust, 1);
      g.strokeCircle(96, 150, 28);
      content.add(g);
    }
    const day = state.day || 1;
    const stockKeys = Object.keys(trader.stock || {}).filter((key) => key !== 'day' && key !== 'bucket' && (trader.stock[key] || 0) > (session.get[key] || 0));
    stockKeys.forEach((key, index) => {
      const count = trader.stock[key] - (session.get[key] || 0);
      const price = priceOf(key, day, trader.who, { side: 'get', respect: trader.respect, mod: trader.mod, steep: trader.steep });
      const arrow = priceArrow(key, day, trader.who, { side: 'get', respect: trader.respect, mod: trader.mod, steep: trader.steep });
      content.add(slotButton(scene, 120 + (index % 3) * 96, 250 + Math.floor(index / 3) * 100, key, count, price, arrow, () => shift('stock', key, 1), () => shift('stock', key, 5)));
    });
    content.add(addText(scene, 1040, 108, 'YOUR STASH', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '18px', color: CONFIG.COLORS.orangeCss, originX: 0.5, originY: 0.5,
    }));
    const mine = [...['food', 'water', 'materials', 'medicine'], ...ITEMS.map((item) => item.id)]
      .filter((key) => holdCount(state, key) - (session.give[key] || 0) > 0);
    mine.forEach((key, index) => {
      const count = holdCount(state, key) - (session.give[key] || 0);
      const price = priceOf(key, day, trader.who, { side: 'give', respect: trader.respect, mod: trader.mod });
      const arrow = priceArrow(key, day, trader.who, { side: 'give', respect: trader.respect, mod: trader.mod });
      content.add(slotButton(scene, 980 + (index % 3) * 96, 180 + Math.floor(index / 3) * 96, key, count, price, arrow, () => offer(key, 1), () => offer(key, 5)));
    });
    content.add(addText(scene, 500, 200, 'YOU GIVE', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '16px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
    }));
    content.add(addText(scene, 760, 200, 'YOU GET', {
      fontFamily: CONFIG.FONTS.heading, fontSize: '16px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
    }));
    paintTray(scene, content, 430, 240, session.give, (key) => shift('give', key, 1), (key) => shift('give', key, 5));
    paintTray(scene, content, 690, 240, session.get, (key) => shift('get', key, 1), (key) => shift('get', key, 5));
    const quote = dealQuote(state, trader, session.give, session.get);
    const bar = scene.add.graphics();
    const total = quote.giveV + quote.getV;
    const frac = total ? quote.giveV / total : 0.5;
    bar.fillStyle(0x1a120c, 1);
    bar.fillRoundedRect(430, 500, 360, 18, 6);
    bar.fillStyle(quote.ok ? 0x6fbf4a : 0xff8c28, 1);
    bar.fillRoundedRect(430, 500, Math.max(8, 360 * frac), 18, 6);
    bar.lineStyle(2, 0xf4efe4, 0.8);
    bar.lineBetween(610, 496, 610, 522);
    content.add(bar);
    content.add(addText(scene, 610, 536, quote.ok ? `Fair enough. ${quote.giveV} for ${quote.getV}.` : (quote.reason || ''), {
      fontFamily: CONFIG.FONTS.body, fontSize: '14px', color: quote.ok ? CONFIG.COLORS.good : CONFIG.COLORS.orangeCss,
      originX: 0.5, originY: 0, align: 'center', wordWrap: { width: 420 },
    }));
    if (note) {
      content.add(addText(scene, 610, 470, note, {
        fontFamily: CONFIG.FONTS.body, fontSize: '13px', color: CONFIG.COLORS.textMuted,
        originX: 0.5, originY: 0.5, align: 'center', wordWrap: { width: 380 },
      }));
    }
    content.add(addButton(scene, 430, 610, 'LEAVE', () => close(note), { w: 160, h: 48 }));
    content.add(addButton(scene, 800, 610, quote.ok ? 'DEAL' : 'NOT YET', () => {
      if (!quote.ok) return;
      const result = executeDeal(state, trader, session.give, session.get);
      session.give = {};
      session.get = {};
      note = result.line || '';
      Save.write(state);
      if (result.ok) Audio.kaChunk();
      const after = () => {
        if (result.gotCoat) {
          presentCoat(scene, 'trade', () => redraw());
          return;
        }
        redraw();
      };
      if (result.ok) offerTip(scene, 'trade', after);
      else after();
    }, { w: 200, h: 52, primary: quote.ok }));
  };
  const shift = (from, key, count) => {
    const moved = moveGood(state, trader, session, from, key, count);
    if (!moved.ok && moved.line) note = moved.line;
    else note = '';
    redraw();
  };
  const offer = (key, count) => {
    if (key === 'coat') {
      showNotice(scene, {
        kicker: 'THE MACKINAW',
        title: 'Are you sure? This is the Mackinaw.',
        body: "He'd never do that.",
        depth: 70,
        buttons: [
          { label: 'KEEP IT', onClick: () => {} },
          { label: 'TRADE IT', primary: true, onClick: () => shift('player', 'coat', 1) },
        ],
      });
      return;
    }
    shift('player', key, count);
  };
  redraw();
  return { close: () => close() };
}

function paintTray(scene, content, x, y, bag, onTap, onStack) {
  const keys = Object.keys(bag).filter((key) => bag[key] > 0);
  if (!keys.length) {
    content.add(addText(scene, x + 70, y + 30, 'Empty', {
      fontFamily: CONFIG.FONTS.body, fontSize: '14px', color: CONFIG.COLORS.textMuted, originX: 0.5, originY: 0.5,
    }));
    return;
  }
  keys.forEach((key, index) => {
    content.add(slotButton(scene, x + (index % 2) * 90, y + Math.floor(index / 2) * 96, key, bag[key], 0, '', () => onTap(key), () => onStack(key)));
  });
}

export function openMeet(scene, onLeave) {
  const state = Game.state;
  const meet = beginMeet(state);
  Save.write(state);
  Game.hudLock = true;
  const root = scene.add.container(0, 0).setDepth(46);
  if (scene.textures.exists('bg-tavern')) {
    const img = scene.add.image(640, 360, 'bg-tavern');
    const scale = Math.max(CONFIG.WIDTH / (img.width || CONFIG.WIDTH), CONFIG.HEIGHT / (img.height || CONFIG.HEIGHT));
    img.setScale(scale);
    root.add(img);
  }
  const shade = scene.add.rectangle(640, 360, 1280, 720, 0x070b12, 0.5).setInteractive();
  root.add(shade);
  const list = scene.add.container(0, 0);
  root.add(list);
  Audio.startJukebox();
  Audio.startMurmur();
  const leave = () => {
    Audio.stopJukebox();
    Audio.stopMurmur();
    root.destroy();
    Game.hudLock = false;
    touchState();
    onLeave?.();
  };
  const draw = () => {
    list.removeAll(true);
    list.add(addText(scene, 640, 110, "RUSTY'S SWAP MEET", {
      fontFamily: CONFIG.FONTS.display, fontSize: '48px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
    }));
    list.add(addText(scene, 640, 156, meet.rumor ? `You hear: ${meet.rumor}` : 'Three tables. No cash.', {
      fontFamily: CONFIG.FONTS.radio, fontSize: '16px', color: CONFIG.COLORS.textMuted,
      originX: 0.5, originY: 0, align: 'center', wordWrap: { width: 900 },
    }));
    meet.stalls.forEach((stall, index) => {
      const x = 280 + index * 340;
      const g = scene.add.graphics();
      g.fillStyle(0x1a120c, 0.88);
      g.fillRoundedRect(x - 140, 240, 280, 280, 10);
      g.lineStyle(2, CONFIG.COLORS.rust, 1);
      g.strokeRoundedRect(x - 140, 240, 280, 280, 10);
      g.fillStyle(0x2a241c, 1);
      g.fillCircle(x, 300, 28);
      g.fillRoundedRect(x - 22, 324, 44, 40, 8);
      list.add(g);
      list.add(addText(scene, x, 390, stall.name, {
        fontFamily: CONFIG.FONTS.heading, fontSize: '20px', color: CONFIG.COLORS.text, originX: 0.5, originY: 0.5,
      }));
      list.add(addText(scene, x, 430, stall.line, {
        fontFamily: CONFIG.FONTS.body, fontSize: '14px', color: CONFIG.COLORS.textMuted,
        originX: 0.5, originY: 0, align: 'center', wordWrap: { width: 240 },
      }));
      list.add(addButton(scene, x, 490, 'BROWSE', () => {
        openTrade(scene, { trader: stall, depth: 52, holdLock: true, onDone: () => draw() });
      }, { w: 180, h: 48, primary: true }));
    });
    list.add(addButton(scene, 640, 640, 'LEAVE THE MEET', leave, { w: 280, h: 52 }));
  };
  draw();
  offerTip(scene, 'swap', () => {
    if (larryPanicDue(Game.state)) presentLarryPanic(scene);
  });
  return { close: leave };
}

export function distressWord(state) {
  return oddsWord(distressChance(state));
}

export function canDistress(state) {
  return distressAllowed(state);
}

export function hatchTrader() {
  return {
    id: 'hatch',
    who: 'stall',
    name: 'Somebody at the hatch',
    portrait: '',
    line: 'They have a tray and almost no time.',
    short: 'They are not running a store. They are running a minute.',
    mod: 1,
    respect: 0,
    steep: false,
    stock: { food: 2, water: 2, materials: 2, snacks: 2 },
  };
}

export function followDistress(scene, result, done) {
  if (!result?.ok) {
    showNotice(scene, {
      kicker: 'ROCKETS',
      title: 'Not tonight',
      body: result?.line || 'The rocket stays in the box.',
      depth: 70,
      button: 'OK',
      onClose: () => done?.(),
    });
    return;
  }
  if (result.kind === 'hatch' && result.tactical) {
    openTrade(scene, { trader: hatchTrader(), depth: 52, onDone: () => done?.() });
    return;
  }
  if (result.kind === 'trouble' && result.tactical) {
    const ask = () => {
      showDanger(scene, {
        face: 'A looter at the hatch',
        text: 'The rocket brought company. They are bad at the hatch, and still here.',
        onPick: (action) => {
          const state = Game.state;
          if (!state) return;
          if (action === 'light') {
            presentLaunch(scene, { mode: 'light', event: { id: 'looter', face: 'A looter at the hatch' }, where: 'night' }).then((next) => {
              if (!next?.tactical) {
                ask();
                return;
              }
              done?.();
            });
            return;
          }
          state.flags = state.flags || {};
          state.flags.dangerWhere = 'night';
          const outcome = resolveDanger(action, state, ['materials']);
          const nick = !outcome.ok ? nickCrew(state, 1) : '';
          const gained = applyDeltas(state, outcome.deltas);
          Save.write(state);
          showNotice(scene, {
            kicker: 'HATCH',
            title: outcome.ok ? 'They leave' : 'That went poorly',
            body: [outcome.text, gained, nick].filter(Boolean).join('\n\n'),
            depth: 70,
            button: 'OK',
            onClose: () => done?.(),
          });
        },
      });
    };
    ask();
    return;
  }
  done?.();
}
