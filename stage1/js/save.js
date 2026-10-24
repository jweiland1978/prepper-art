import { CONFIG } from './config.js?v=4';
import { Game } from './state.js?v=4';

const DEFAULT_SETTINGS = {
  music: 0.7,
  sfx: 0.85,
  voiceBlips: true,
  reduceEffects: false,
  textSpeed: 1,
  debugCoords: false,
};

function warn(message, error) {
  console.warn(`[PREPPER] ${message}`, error || '');
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(CONFIG.SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };
    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    const unit = (v, d) => (Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : d);
    merged.music = unit(merged.music, DEFAULT_SETTINGS.music);
    merged.sfx = unit(merged.sfx, DEFAULT_SETTINGS.sfx);
    merged.textSpeed = Number.isFinite(Number(merged.textSpeed)) && Number(merged.textSpeed) > 0 ? Number(merged.textSpeed) : DEFAULT_SETTINGS.textSpeed;
    merged.voiceBlips = merged.voiceBlips !== false;
    merged.reduceEffects = !!merged.reduceEffects;
    merged.debugCoords = !!merged.debugCoords;
    return merged;
  } catch (error) {
    warn('Settings could not be read.', error);
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(settings) {
  try {
    localStorage.setItem(CONFIG.SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    warn('Settings could not be written.', error);
    return false;
  }
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function normalizeSave(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.version !== CONFIG.SAVE_VERSION) return null;
  if (typeof data.name !== 'string' || !data.name) return null;
  if (!finiteNumber(data.day)) return null;
  if (!data.stats) return null;
  const keys = ['food', 'water', 'health', 'morale', 'materials', 'medicine'];
  for (const key of keys) {
    if (!finiteNumber(data.stats[key])) return null;
  }
  if (!Array.isArray(data.slots) || data.slots.length !== 8) return null;
  data.rumors = Array.isArray(data.rumors) ? data.rumors : [];
  data.seenEvents = Array.isArray(data.seenEvents) ? data.seenEvents : [];
  data.lastBroadcast = Array.isArray(data.lastBroadcast) ? data.lastBroadcast : [];
  data.memorial = Array.isArray(data.memorial) ? data.memorial : [];
  data.ownedWeapons = Array.isArray(data.ownedWeapons) ? data.ownedWeapons : [CONFIG.START.weapon];
  data.flags = data.flags && typeof data.flags === 'object' ? data.flags : {};
  data.weapon = typeof data.weapon === 'string' ? data.weapon : CONFIG.START.weapon;
  data.mode = data.mode || 'prep';
  data.phase = data.phase || 'calm';
  data.actionsLeft = finiteNumber(data.actionsLeft) ? data.actionsLeft : CONFIG.ACTIONS_PER_DAY;
  data.survivalDay = finiteNumber(data.survivalDay) ? data.survivalDay : 0;
  data.biscuitBank = finiteNumber(data.biscuitBank) ? data.biscuitBank : 0;
  data.lastScene = typeof data.lastScene === 'string' ? data.lastScene : 'Radio';
  return data;
}

export function peekSave() {
  try {
    const raw = localStorage.getItem(CONFIG.SAVE_KEY);
    if (!raw) return { empty: true };
    const parsed = JSON.parse(raw);
    const data = normalizeSave(parsed);
    if (!data) return { corrupt: true };
    return { ok: true, data };
  } catch (error) {
    warn('Save could not be read.', error);
    return { corrupt: true };
  }
}

export function writeSave(state) {
  if (!state) return false;
  try {
    const copy = JSON.parse(JSON.stringify(state));
    copy.version = CONFIG.SAVE_VERSION;
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(copy));
    Game.saveStatus = { ok: true, data: copy };
    return true;
  } catch (error) {
    warn('Could not write save.', error);
    return false;
  }
}

export function deleteSave() {
  try {
    localStorage.removeItem(CONFIG.SAVE_KEY);
  } catch (error) {
    warn('Could not delete save.', error);
  }
  Game.saveStatus = { empty: true };
}

export function bootSave() {
  Game.settings = loadSettings();
  Game.saveStatus = peekSave();
  return Game.settings;
}

export const Save = {
  boot: bootSave,
  loadSettings,
  writeSettings,
  peek: peekSave,
  write: writeSave,
  deleteSave,
};
