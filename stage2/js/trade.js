/**
 * Barter, item uses, Gary's respect, rockets, and the coat.
 * Scenes paint. This file only changes state.
 */
import { CONFIG, phaseForDay } from './config.js?v=7';
import { itemById } from './data/items.js?v=7';
import { RUMORS } from './data/radio.js?v=7';
import { MARKERS } from './data/map.js?v=7';
import {
  DISTRESS_LINES,
  GARY_BEER,
  GARY_FENCE,
  GARY_FOIL,
  GARY_LINES,
  GARY_SHORT,
  KEVIN_FILM,
  KEVIN_LINES,
  LARRY_LINES,
  LIGHT_LINES,
  MAYHEM_LINES,
  STALLS,
} from './data/traders.js?v=7';
import {
  addNotice,
  garyRespect,
  generatorOn,
  hashDay,
  isHere,
  spotStatus,
  tradeUnit,
  wearingCoat,
} from './crew.js?v=7';
import { Game, changeStat, roomLevel, touchState } from './state.js?v=7';

export const STAT_KEYS = ['food', 'water', 'materials', 'medicine'];

export function holdCount(state, key) {
  if (!state || !key) return 0;
  if (STAT_KEYS.includes(key)) return state.stats?.[key] || 0;
  return state.stash?.[key] || 0;
}

export function priceOf(good, day, who, extra = {}) {
  if (good === 'tip') {
    return Math.max(1, tradeUnit('snacks', day, 'kevin', { side: 'give' }) * CONFIG.TRADE.kevinSnacks);
  }
  if (good === 'dock') {
    return Math.max(6, tradeUnit('materials', day, who || 'larry', { side: 'get', respect: extra.respect }) * 3);
  }
  let price = tradeUnit(good, day, who, extra);
  if (good === 'coat' && extra.steep) price = Math.max(price, Math.round(price * 1.75));
  const flags = Game.state?.flags || {};
  const side = extra.side || 'give';
  if ((flags.heistsDone || 0) >= 1 && good === 'beer' && side === 'give' && who === 'gary') {
    const respect = extra.respect || 0;
    const rate = respect >= CONFIG.TRADE.garyRespectAt ? CONFIG.TRADE.garyBuyRespect : CONFIG.TRADE.garyBuy;
    if (rate > 0) price = Math.max(1, Math.round(price / rate));
  }
  if ((flags.heistsDone || 0) >= 1 && good === 'beer' && side === 'give' && who === 'larry') {
    price = Math.max(price * (CONFIG.HEIST.larryBeer || 4), price + 4);
  }
  const heat = (flags.heistCaught ? 1 : 0) + (flags.heistHeat || 0);
  if (heat && side === 'get') price += (CONFIG.HEIST.priceBump || 1) * heat;
  return Math.max(1, Math.round(price));
}

export function priceArrow(good, day, who, extra = {}) {
  if (!good || good === 'tip' || good === 'dock' || day <= 1) return '';
  const today = priceOf(good, day, who, extra);
  const prev = priceOf(good, day - 1, who, extra);
  if (today > prev) return 'up';
  if (today < prev) return 'down';
  return '';
}

export function noteWaterBuilt(state) {
  if (!state || state.flags.waterDay) return;
  state.flags.waterDay = state.day || 1;
}

export function ensureGaryStock(state) {
  state.flags = state.flags || {};
  const bucket = Math.floor((state.day || 1) / 3);
  const cur = state.flags.garyStock;
  if (cur && cur.bucket === bucket) return cur;
  const h = (salt) => hashDay(bucket + 3, salt);
  state.flags.garyStock = {
    bucket,
    water: 1 + Math.floor(h(1) * 2),
    materials: 1 + Math.floor(h(2) * 2),
    medicine: h(3) < 0.65 ? 1 : 0,
    gas: 1,
    battery: 1 + (h(4) < 0.5 ? 1 : 0),
    ammo: h(5) < 0.45 ? 1 : 0,
  };
  return state.flags.garyStock;
}

export function ensureLarryStock(state) {
  state.flags = state.flags || {};
  const cur = state.flags.larryStock;
  if (cur && cur.day === state.day) {
    if (state.flags.dockBought) cur.dock = 0;
    return cur;
  }
  state.flags.larryStock = {
    day: state.day,
    materials: 4,
    snacks: 4,
    rockets: 2,
    gas: 1,
    dock: state.flags.dockBought ? 0 : 1,
  };
  return state.flags.larryStock;
}

export function kevinReady(state) {
  if (!isHere(state, 'kevin')) return true;
  const last = state.flags?.kevinTipDay || 0;
  return (state.day || 1) >= last + 2;
}

export function larryKnocking(state) {
  if (!state || state.mode !== 'prep' || isHere(state, 'larry')) return false;
  if ((state.day || 1) < 6) return false;
  return hashDay(state.day, 11) < 0.42;
}

function traderCore(who, state) {
  const day = state?.day || 1;
  const respect = garyRespect(state);
  if (who === 'gary') {
    return {
      id: 'gary',
      who: 'gary',
      name: 'Gary',
      portrait: 'portrait-gary',
      title: "Gary's Place",
      line: GARY_LINES[day % GARY_LINES.length],
      short: GARY_SHORT,
      respect,
      steep: false,
      stock: ensureGaryStock(state),
    };
  }
  if (who === 'larry') {
    return {
      id: 'larry',
      who: 'larry',
      name: 'Larry',
      portrait: 'portrait-larry',
      title: 'Larry',
      line: LARRY_LINES[day % LARRY_LINES.length],
      short: 'Larry pays what the foil tells him to pay. The foil is generous and wrong.',
      respect,
      steep: false,
      stock: ensureLarryStock(state),
    };
  }
  if (who === 'kevin') {
    return {
      id: 'kevin',
      who: 'kevin',
      name: 'Kevin',
      portrait: 'portrait-kevin',
      title: 'Kevin',
      line: KEVIN_LINES[day % KEVIN_LINES.length],
      short: 'Two snack cakes. That is the whole menu.',
      respect,
      steep: false,
      snacksOnly: true,
      stock: { tip: kevinReady(state) ? 1 : 0 },
    };
  }
  return null;
}

export function makeTrader(who, state) {
  return traderCore(who, state);
}

export function refuseGood(trader, good, state) {
  if (good === 'beer' && (state?.flags?.heistsDone || 0) < 1) {
    if (trader?.who === 'gary') return GARY_BEER;
    return 'They look at the silver can and look away. Pine Lake Light is not currency. Not yet.';
  }
  if (!trader || trader.who !== 'gary') return '';
  if (good === 'tinfoil') return GARY_FOIL;
  return '';
}

function sideValue(bag, day, trader, side) {
  const extra = { side, respect: trader.respect, mod: trader.mod, steep: trader.steep && side === 'get' };
  return Object.entries(bag || {}).reduce((sum, [key, count]) => {
    if (!count) return sum;
    return sum + priceOf(key, day, trader.who, extra) * count;
  }, 0);
}

export function dealQuote(state, trader, give, get) {
  const day = state?.day || 1;
  const giveV = sideValue(give, day, trader, 'give');
  const getV = sideValue(get, day, trader, 'get');
  let reason = '';
  if (!getV || !giveV) reason = 'Put something on both trays.';
  else if (giveV < getV) reason = trader.short || GARY_SHORT;
  return { giveV, getV, ok: !reason, reason };
}

function addCount(bag, key, count) {
  const next = (bag[key] || 0) + count;
  if (next <= 0) delete bag[key];
  else bag[key] = next;
}

export function moveGood(state, trader, session, from, key, count) {
  const n = Math.max(1, count || 1);
  const give = session.give;
  const get = session.get;
  if (from === 'player') {
    const free = holdCount(state, key) - (give[key] || 0);
    const moved = Math.min(n, free);
    if (moved <= 0) return { ok: false, line: 'You do not have another one loose.' };
    const no = refuseGood(trader, key, state);
    if (no) return { ok: false, line: no };
    if (trader.snacksOnly && key !== 'snacks') return { ok: false, line: 'Kevin trades tips for snacks. Just snacks.' };
    addCount(give, key, moved);
    return { ok: true };
  }
  if (from === 'give') {
    const moved = Math.min(n, give[key] || 0);
    if (moved <= 0) return { ok: false, line: '' };
    addCount(give, key, -moved);
    return { ok: true };
  }
  if (from === 'stock') {
    const free = (trader.stock?.[key] || 0) - (get[key] || 0);
    const moved = Math.min(n, free);
    if (moved <= 0) return { ok: false, line: 'That pile is already on the tray.' };
    addCount(get, key, moved);
    return { ok: true };
  }
  if (from === 'get') {
    const moved = Math.min(n, get[key] || 0);
    if (moved <= 0) return { ok: false, line: '' };
    addCount(get, key, -moved);
    return { ok: true };
  }
  return { ok: false, line: '' };
}

function takeGood(state, key, count) {
  if (STAT_KEYS.includes(key)) {
    changeStat(key, -count);
    return;
  }
  state.stash[key] = Math.max(0, (state.stash[key] || 0) - count);
  if (key === 'coat') {
    state.flags.coatEver = true;
    state.flags.coatWorn = false;
  }
}

function giveGood(state, key, count) {
  if (key === 'tip' || key === 'dock') return;
  if (STAT_KEYS.includes(key)) {
    changeStat(key, count);
    return;
  }
  const cap = key === 'coat' ? 1 : 99;
  state.stash[key] = Math.min(cap, (state.stash[key] || 0) + count);
}

export function grantCoat(state, how) {
  if (!state || state.flags?.coatEver || (state.stash?.coat || 0) > 0) return false;
  state.stash = state.stash || {};
  state.stash.coat = 1;
  state.flags.coatEver = true;
  state.flags.coatWorn = true;
  state.flags.coatRadio = true;
  state.flags.coatHow = how || 'found';
  return true;
}

function openSpots(state) {
  return MARKERS.filter((marker) => marker.kind === 'open' && spotStatus(state, marker).code === 'open');
}

export function applyTip(state) {
  state.flags = state.flags || {};
  state.flags.kevinTipDay = state.day || 1;
  const roll = Math.random();
  const spots = openSpots(state);
  if (roll < 0.34 && spots.length) {
    const spot = spots[Math.floor(Math.random() * spots.length)];
    state.flags.lootBoost = state.flags.lootBoost || {};
    state.flags.lootBoost[spot.id] = (state.flags.lootBoost[spot.id] || 0) + 2;
    return `${spot.name} has a full shelf tomorrow.`;
  }
  if (roll < 0.67 && spots.length) {
    const spot = spots[Math.floor(Math.random() * spots.length)];
    state.flags.crawl = { id: spot.id, from: state.day || 1, until: (state.day || 1) + 1 };
    return `${spot.name} is crawling tomorrow.`;
  }
  const have = new Set((state.rumors || []).map((entry) => entry.id));
  const pool = RUMORS.filter((rumor) => !have.has(rumor.id));
  const rumor = (pool.length ? pool : RUMORS)[Math.floor(Math.random() * (pool.length || RUMORS.length))];
  state.rumors = state.rumors || [];
  if (rumor) {
    state.rumors.push({
      id: rumor.id, day: state.day, text: rumor.text, count: 1, kind: rumor.kind || 'herring',
    });
    return `You write it down. "${rumor.text}"`;
  }
  return 'Kevin shrugs. The tip was a shrug.';
}

export function addSwapRumor(state) {
  const have = new Set((state.rumors || []).map((entry) => entry.id));
  const pool = RUMORS.filter((rumor) => !have.has(rumor.id));
  const rumor = (pool.length ? pool : RUMORS)[Math.floor(Math.random() * Math.max(1, pool.length || RUMORS.length))];
  if (!rumor) return '';
  state.rumors = state.rumors || [];
  state.rumors.push({
    id: rumor.id, day: state.day, text: rumor.text, count: 1, kind: rumor.kind || 'herring',
  });
  return rumor.text;
}

export function executeDeal(state, trader, give, get) {
  const quote = dealQuote(state, trader, give, get);
  if (!quote.ok) return { ok: false, line: quote.reason };
  const gotCoat = (get.coat || 0) > 0 && !(state.stash?.coat > 0) && !state.flags?.coatEver;
  Object.entries(give).forEach(([key, count]) => takeGood(state, key, count));
  Object.entries(get).forEach(([key, count]) => {
    if (key === 'dock') {
      state.flags.dockBought = true;
      state.flags.dockReady = true;
      trader.stock.dock = 0;
      return;
    }
    if (key === 'tip') {
      trader.stock.tip = 0;
      return;
    }
    giveGood(state, key, count);
    if (trader.stock && trader.stock[key]) trader.stock[key] = Math.max(0, trader.stock[key] - count);
  });
  let line = 'The trays clear. Nobody hugs.';
  if (get.tip) line = applyTip(state);
  if (get.dock) line = 'A map of the sewers. It is the Supercenter loading dock. One trip, lower danger.';
  if (gotCoat) {
    state.flags.coatEver = true;
    state.flags.coatWorn = true;
    state.flags.coatRadio = true;
    state.flags.coatHow = 'trade';
    line = 'The Mackinaw changes hands. It does not look thrilled about you either.';
  }
  state.flags.trades = (state.flags.trades || 0) + 1;
  if (trader.who === 'gary') {
    const ratio = quote.giveV / Math.max(1, quote.getV);
    state.flags.lastGaryRatio = ratio;
    if (ratio <= 1.4) state.flags.garyFair = (state.flags.garyFair || 0) + 1;
    else state.flags.garyBad = true;
    line = ratio > 1.4 ? `${line} Gary notices. He lets you do it anyway.` : line;
  }
  touchState();
  return { ok: true, line, gotCoat, quote };
}

function stallMod(day, salt) {
  const span = CONFIG.TRADE.stallMax - CONFIG.TRADE.stallMin;
  return CONFIG.TRADE.stallMin + hashDay(day || 1, salt + 9) * span;
}

export function beginMeet(state) {
  state.flags = state.flags || {};
  state.flags.swapVisits = (state.flags.swapVisits || 0) + 1;
  if (!state.flags.swapHeard) state.flags.swapRadio = true;
  if (!state.flags.coatVisitTarget && !state.flags.coatEver) {
    const salt = [...(state.name || 'N')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    state.flags.coatVisitTarget = 1 + Math.floor(hashDay(salt || 1, 4) * 3);
  }
  const visit = state.flags.swapVisits;
  const offerCoat = !state.flags.coatEver && !state.flags.coatStallGone && visit === state.flags.coatVisitTarget;
  if (visit === state.flags.coatVisitTarget) state.flags.coatStallGone = true;
  const order = STALLS.map((row, index) => ({ row, roll: hashDay((state.day || 1) + visit, index + 3) }));
  order.sort((a, b) => a.roll - b.roll);
  const stalls = order.slice(0, 3).map(({ row }) => {
    const stock = {};
    row.goods.forEach((id, index) => {
      stock[id] = 1 + Math.floor(hashDay((state.day || 1) + visit, row.modSalt * 10 + index) * 2);
    });
    if ((state.flags.heistsDone || 0) >= 1) {
      stock.beer = Math.max(stock.beer || 0, 1 + Math.floor(hashDay((state.day || 1) + visit, row.modSalt + 6) * 2));
    }
    return {
      id: row.id,
      who: 'stall',
      name: row.name,
      portrait: '',
      title: row.name,
      line: row.lines[(state.day + visit + row.modSalt) % row.lines.length],
      lines: row.lines,
      short: 'The table wants a fair stack. Fair is a suggestion with a price.',
      mod: stallMod((state.day || 1) + row.modSalt, row.modSalt),
      respect: garyRespect(state),
      steep: false,
      stock,
    };
  });
  if (offerCoat && stalls[0]) {
    stalls[0].stock.coat = 1;
    stalls[0].steep = true;
    stalls[0].line = 'There is a coat on the table. Red and black. It costs like it knows.';
  }
  const rumor = addSwapRumor(state);
  return { stalls, rumor, offerCoat };
}

export function maybeGaryCoat(state) {
  if (!state || state.flags?.coatEver || (state.stash?.coat || 0) > 0) return false;
  return garyRespect(state) >= 5;
}

export function fenceLine(state) {
  if (!state?.garyVisited || state.mode !== 'prep') return '';
  if (state.flags?.garyFenceDay === state.day) return '';
  if (state.flags?.garyDay === state.day) return '';
  if (hashDay(state.day, 17) > 0.38) return '';
  state.flags.garyFenceDay = state.day;
  const pool = state.flags.garyBad ? GARY_FENCE : GARY_LINES.concat(GARY_FENCE);
  state.flags.garyBad = false;
  return pool[Math.floor(hashDay(state.day, 18) * pool.length)];
}

export function distressChance(state) {
  if (garyRespect(state) >= CONFIG.TRADE.garyRespectAt && !state.flags?.garyBail) return 0.9;
  if (isHere(state, 'kevin')) return 0.3 / 0.7;
  return CONFIG.ROCKETS.distressKevin + CONFIG.ROCKETS.distressTrader;
}

export function distressAllowed(state) {
  if (!state || (state.stash?.rockets || 0) < 1) return false;
  if (state.mode === 'survival') return !(state.flags?.survival?.actionDone);
  return (state.day || 1) >= 11 && (state.actionsLeft || 0) > 0;
}

function rollMayhem(rng) {
  const roll = rng();
  const table = [
    ['works', CONFIG.ROCKETS.works],
    ['hedge', CONFIG.ROCKETS.daleHedge],
    ['biscuit', CONFIG.ROCKETS.biscuitHides],
    ['bunker', CONFIG.ROCKETS.intoBunker],
    ['spectacular', CONFIG.ROCKETS.spectacular],
  ];
  let cursor = 0;
  for (const [id, chance] of table) {
    cursor += chance;
    if (roll < cursor) return id;
  }
  return 'works';
}

function hidingKey(state) {
  if (state.mode === 'survival') return `s${state.survivalDay || 1}`;
  return state.day || 1;
}

function applyMayhem(state, id) {
  const line = MAYHEM_LINES[id][Math.floor(Math.random() * MAYHEM_LINES[id].length)];
  if (id === 'hedge') {
    addNotice(state, 'hedge');
    if (isHere(state, 'dale')) changeStat('morale', -1);
  } else if (id === 'biscuit') {
    state.flags.biscuitHiding = hidingKey(state);
  } else if (id === 'bunker') {
    const rooms = (state.slots || []).filter((slot) => slot.room);
    const pick = rooms.length ? rooms[Math.floor(Math.random() * rooms.length)].room : 'shaft';
    state.flags.scorch = pick;
    changeStat('morale', CONFIG.MORALE_RULES.rocketBunker);
  } else if (id === 'spectacular') {
    changeStat('morale', CONFIG.MORALE_RULES.spectacular);
  }
  return line;
}

function classifyDanger(event) {
  if (!event) return 'stranger';
  if (event.zombie) return 'zombie';
  if (event.raccoon) return 'raccoon';
  if (event.crowd) return 'crowd';
  const face = `${event.face || ''} ${event.id || ''}`.toLowerCase();
  if (face.includes('raccoon')) return 'raccoon';
  if (face.includes('zombie') || face.includes('shuffle') || face.includes('groan')) return 'zombie';
  return 'stranger';
}

function rollDistressKind(state, rng) {
  if (garyRespect(state) >= CONFIG.TRADE.garyRespectAt && !state.flags?.garyBail) return 'gary';
  const kevin = isHere(state, 'kevin') ? 0 : CONFIG.ROCKETS.distressKevin;
  let trader = CONFIG.ROCKETS.distressTrader;
  let trouble = CONFIG.ROCKETS.distressTrouble;
  if (!kevin) {
    const rest = trader + trouble || 1;
    trader /= rest;
    trouble /= rest;
  }
  const roll = rng();
  if (kevin && roll < kevin) return 'kevin';
  if (roll < kevin + trader) return 'hatch';
  return 'trouble';
}

function applyDistress(state, kind) {
  if (kind === 'gary') {
    state.flags.garyBail = true;
    if (state.mode === 'survival') {
      const sheet = state.flags.survival;
      if (sheet && !sheet.zombieDone) {
        sheet.zombieDone = true;
        sheet.lines = sheet.lines || [];
        sheet.lines.push('Gary clears the yard. One day of not doing that yourself.');
      } else {
        changeStat('water', 2);
        changeStat('materials', 2);
      }
      if (sheet) sheet.actionDone = true;
    } else {
      changeStat('water', 4);
      changeStat('materials', 4);
      changeStat('medicine', 2);
    }
  } else if (kind === 'kevin') {
    state.stash.snacks = Math.min(99, (state.stash.snacks || 0) + 3);
  }
  return DISTRESS_LINES[kind] || DISTRESS_LINES.fizzle;
}

export function fireRocket(state, ctx = {}, rng = Math.random) {
  if (!state || (state.stash?.rockets || 0) < 1) {
    return { ok: false, line: 'No bottle rockets. The lifestyle is on backorder.' };
  }
  if (ctx.mode === 'distress' && !distressAllowed(state)) {
    return { ok: false, line: 'Not tonight. A distress rocket wants a spare action and a later day.' };
  }
  state.stash.rockets -= 1;
  state.flags.rocketsFired = (state.flags.rocketsFired || 0) + 1;
  if (!state.flags.rocketHeard) state.flags.rocketRadio = true;
  if (ctx.mode === 'distress') {
    if (state.mode === 'survival') {
      if (state.flags.survival) state.flags.survival.actionDone = true;
    } else {
      state.actionsLeft = Math.max(0, (state.actionsLeft || 0) - 1);
    }
  }
  const forced = state.flags.forceMayhem;
  if (forced) state.flags.forceMayhem = '';
  const mayhem = forced || rollMayhem(rng);
  const mayhemLine = applyMayhem(state, mayhem);
  const tactical = mayhem !== 'bunker';
  let landed = false;
  if (tactical && rng() < 0.12 && !state.flags.garyScorched) {
    state.flags.garyScorched = true;
    landed = true;
  }
  const kind = ctx.mode === 'distress'
    ? (tactical ? rollDistressKind(state, rng) : 'fizzle')
    : (tactical ? classifyDanger(ctx.event) : 'fizzle');
  let effect = tactical && ctx.mode === 'distress' ? applyDistress(state, kind) : '';
  if (!effect) {
    const pool = LIGHT_LINES[kind] || LIGHT_LINES.fizzle;
    effect = pool[Math.floor(Math.random() * pool.length)];
  }
  const filming = !!(ctx.kevin || isHere(state, 'kevin'));
  let film = '';
  if (filming) {
    film = KEVIN_FILM[Math.floor(Math.random() * KEVIN_FILM.length)];
    if (mayhem === 'spectacular') {
      changeStat('morale', CONFIG.MORALE_RULES.kevinViewer);
      film = `${film} Somebody actually watched.`;
    }
  }
  const bits = [mayhemLine, effect];
  if (landed) bits.push("It also finds Gary's property. He will mention this for the rest of the run.");
  if (film) bits.push(film);
  touchState();
  return {
    ok: true,
    tactical,
    mayhem,
    kind,
    crowd: kind === 'crowd',
    filming,
    film,
    landed,
    text: bits.filter(Boolean).join('\n\n'),
    bias: ctx.event?.bias || ['food'],
  };
}

export function maybeJulyBox(state) {
  if (!state || state.flags?.julyBox) return '';
  if (Math.random() > 0.28) return '';
  state.flags.julyBox = true;
  state.stash = state.stash || {};
  state.stash.rockets = Math.min(99, (state.stash.rockets || 0) + CONFIG.ITEMS.julyRockets);
  return "Dad's Fourth of July box. Half the fuses are fine. The other half are also fine, probably.";
}

export function resolveSputter(state) {
  if (roomLevel(state, 'generator') < 1) {
    return 'The cough in the dark is not your generator. You do not have one.';
  }
  if ((state.flags.gasLeft || 0) > 0) {
    state.flags.gasLeft -= 1;
    const left = state.flags.gasLeft;
    return `The generator coughs and keeps the hum. The can still has ${left} night${left === 1 ? '' : 's'}.`;
  }
  if ((state.stash?.gas || 0) > 0) {
    state.stash.gas -= 1;
    state.flags.gasLeft = Math.max(0, CONFIG.ITEMS.gasNights - 1);
    return 'You tip in a gas can. Three nights of hum. The bulb stops negotiating.';
  }
  state.flags.sputterNight = state.day;
  return 'No gas. The generator takes the night off. So does the bulb.';
}

export function morningRadio(state) {
  if (!state) return '';
  if (generatorOn(state)) {
    state.flags.radioClear = false;
    return '';
  }
  if ((state.stash?.battery || 0) > 0) {
    state.stash.battery -= 1;
    state.flags.radioClear = true;
    return 'The generator is out. A battery keeps the morning broadcast clear.';
  }
  state.flags.radioClear = false;
  return '';
}

export function repairScorch(state) {
  if (!state?.flags?.scorch) return { ok: false, line: 'Nothing is scorched. Dale is still looking.' };
  if ((state.stats?.materials || 0) < 1) return { ok: false, line: 'A scorch mark wants 1 plank.' };
  changeStat('materials', -1);
  const where = state.flags.scorch;
  state.flags.scorch = '';
  return { ok: true, line: where === 'shaft' ? 'You sand the shaft. It looks like a shaft again.' : 'You sand the scorch. The room forgives you. Mostly.' };
}

export function crackBeer(state, when) {
  const key = state?.mode === 'survival' ? `s${state.survivalDay || 1}` : `d${state?.day || 1}`;
  if (!state) return { ok: false, line: 'Nobody is home.' };
  if (state.flags?.beerNight === key) return { ok: false, line: "Already shared. It's light beer. It does not get lighter." };
  if ((state.stash?.beer || 0) < 1) return { ok: false, line: 'No Pine Lake Light. The lake is still a lake.' };
  state.stash.beer -= 1;
  state.flags.beerNight = key;
  const line = "Everyone got a sip. It's light beer. It goes far.";
  const nightDone = when === 'night' || state.flags.upkeepDay === state.day || state.mode === 'survival';
  if (nightDone) changeStat('morale', CONFIG.ITEMS.beerMorale || 1);
  else state.flags.beerTonight = true;
  touchState();
  return { ok: true, line };
}

export function eatSnack(state) {
  if ((state?.stash?.snacks || 0) < 1) return { ok: false, line: 'No snack cakes. The shelf life continues without you.' };
  if ((state.stats?.health || 0) >= CONFIG.HEALTH_MAX) return { ok: false, line: 'You are already as held together as the day allows.' };
  state.stash.snacks -= 1;
  const got = changeStat('health', CONFIG.ITEMS.snacksHealth || 1);
  touchState();
  return { ok: !!got, line: got ? 'A snack cake. Health +1. The wrapper stays.' : 'The cake had nowhere to go.' };
}

export function itemBlurb(id) {
  return itemById(id)?.description || '';
}

export function wearingNow(state) {
  return wearingCoat(state);
}

/** Part 3 calls this on a St. Casimir's rummage trip after Day 6. About 1 in 20. */
export function rummageCoatRoll(state) {
  if (!state || state.flags?.coatEver || (state.stash?.coat || 0) > 0) return false;
  if ((state.day || 1) < (CONFIG.ITEMS.mackinawAfter || 6)) return false;
  return Math.random() < (CONFIG.ITEMS.mackinawChance || 0);
}

/** Part 3 map pin. Art is loaded. This does not place the tent. */
export function fireworksTentLoot() {
  return null;
}

// Part 3 hook: set state.flags.marketLine before the morning show. ensureMorning will read it once.
export function marketHookReady() {
  return true;
}
