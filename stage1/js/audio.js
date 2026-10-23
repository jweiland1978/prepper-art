import { CONFIG } from './config.js';
import { bus } from './state.js';

const CHORDS = [
  [110, 130.81, 164.81, 196],
  [87.31, 110, 130.81, 164.81],
  [73.42, 110, 146.83, 220],
  [82.41, 123.47, 164.81, 196],
];
const ROOTS = [55, 43.65, 36.71, 41.2];
const JINGLE = [523.25, 659.25, 783.99, 1046.5, 1318.51];

function noiseBuffer(ctx, seconds) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function crusherCurve(amount) {
  const bits = Math.max(3, Math.round(12 - amount * 9));
  const steps = 2 ** bits;
  const curve = new Float32Array(2048);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  return curve;
}

function wearFor(day) {
  if (day >= 30) return 1;
  return Math.max(0, (day - 1) / 28);
}

class AudioManager {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.volumes = { music: 0.7, sfx: 0.85, voiceBlips: true };
    this.variant = null;
    this.musicId = 0;
    this.step = 0;
    this.nextTime = 0;
    this.nodes = [];
  }

  applySettings(settings) {
    if (!settings) return;
    this.volumes = settings;
    if (!this.musicGain) return;
    this.musicGain.gain.value = settings.music;
    this.sfxGain.gain.value = settings.sfx;
    this.voiceGain.gain.value = settings.voiceBlips ? 1 : 0;
  }

  unlock() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return this;
    try {
      if (!this.ctx) this.build(new AudioCtx());
      if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
        const resumed = this.ctx.resume();
        if (resumed?.catch) resumed.catch(() => {});
      }
    } catch (error) {
      console.warn('[PREPPER] Audio unlock failed.', error);
      if (!this.musicGain) this.ctx = null;
    }
    if (!this.unlocked) {
      this.unlocked = true;
      bus.emit('audio-unlocked');
    }
    return this;
  }

  build(ctx) {
    this.ctx = ctx;
    this.noise = noiseBuffer(ctx, 2);
    this.master = ctx.createGain();
    this.master.gain.value = 0.85;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.knee.value = 18;
    this.comp.ratio.value = 4;
    this.comp.attack.value = 0.01;
    this.comp.release.value = 0.18;
    this.master.connect(this.comp);
    this.comp.connect(ctx.destination);

    this.musicGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.voiceGain = ctx.createGain();
    this.bedGain = ctx.createGain();
    this.pulseGain = ctx.createGain();
    this.pulseGain.gain.value = 1;
    this.musicGain.connect(this.master);
    this.bedGain.connect(this.pulseGain);
    this.pulseGain.connect(this.musicGain);
    this.sfxGain.connect(this.master);
    this.voiceGain.connect(this.sfxGain);

    this.wobble = ctx.createOscillator();
    this.wobble.frequency.value = 0.16;
    this.wobbleDepth = ctx.createGain();
    this.wobbleDepth.gain.value = 8;
    this.wobble.connect(this.wobbleDepth);
    this.wobble.start();

    this.applySettings(this.volumes);
  }

  tone({ time, freq, dur, type, gain, dest, detune = 0, attack = 0.01, wobble = false, slideTo = null }) {
    if (!this.ctx || gain <= 0) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(Math.max(20, freq), time);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), time + dur);
    osc.detune.setValueAtTime(detune, time);
    if (wobble) this.wobbleDepth.connect(osc.detune);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), time + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(dur, attack + 0.02));
    osc.connect(amp);
    amp.connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.03);
    osc.onended = () => {
      try { osc.disconnect(); amp.disconnect(); } catch (error) { /* already gone */ }
    };
  }

  noiseHit(time, dur, gain, freq, q, dest) {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), time + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(dest || this.sfxGain);
    src.start(time);
    src.stop(time + dur + 0.02);
  }

  click() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq: 740, dur: 0.045, type: 'square', gain: 0.07, dest: this.sfxGain, attack: 0.004 });
  }

  rustle() {
    this.unlock();
    if (!this.ctx) return;
    this.noiseHit(this.ctx.currentTime, 0.16, 0.12, 1400, 0.6);
  }

  blip() {
    if (!this.ctx || !this.volumes.voiceBlips) return;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq: 1480, dur: 0.028, type: 'square', gain: 0.035, dest: this.voiceGain, attack: 0.002 });
  }

  loot() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq: 420, slideTo: 880, dur: 0.09, type: 'triangle', gain: 0.1, dest: this.sfxGain, attack: 0.005 });
    this.tone({ time: t + 0.07, freq: 660, slideTo: 1180, dur: 0.08, type: 'sine', gain: 0.06, dest: this.sfxGain, attack: 0.004 });
  }

  dig() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq: 110, slideTo: 42, dur: 0.22, type: 'sine', gain: 0.28, dest: this.sfxGain, attack: 0.005 });
    this.noiseHit(t, 0.18, 0.16, 240, 0.7);
  }

  hammer() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq: 210, slideTo: 70, dur: 0.12, type: 'triangle', gain: 0.18, dest: this.sfxGain, attack: 0.003 });
    this.noiseHit(t, 0.05, 0.14, 1800, 0.8);
  }

  bark() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 0.13, 0.24].forEach((offset, index) => {
      this.noiseHit(t + offset, 0.07, 0.16 - index * 0.03, 900, 3);
      this.tone({
        time: t + offset, freq: 380 - index * 30, dur: 0.06, type: 'square',
        gain: 0.05, dest: this.sfxGain, attack: 0.003,
      });
    });
  }

  whine() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq: 520, slideTo: 760, dur: 0.35, type: 'sine', gain: 0.06, dest: this.sfxGain, attack: 0.02 });
  }

  groan() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const amp = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const depth = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(92, t);
    osc.frequency.linearRampToValueAtTime(138, t + 0.32);
    osc.frequency.linearRampToValueAtTime(100, t + 0.55);
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    lfo.frequency.value = 5.5;
    depth.gain.value = 14;
    lfo.connect(depth);
    depth.connect(osc.detune);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.07, t + 0.08);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);
    osc.connect(filter);
    filter.connect(amp);
    amp.connect(this.sfxGain);
    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 0.6);
    osc.stop(t + 0.6);
  }

  cassette() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq: 180, dur: 0.03, type: 'square', gain: 0.1, dest: this.sfxGain, attack: 0.002 });
    this.noiseHit(t + 0.02, 0.18, 0.08, 320, 1.2);
  }

  startMusic(variant) {
    this.unlock();
    if (!this.ctx) return;
    if (this.variant === variant && this.musicTimer) return;
    this.stopScheduler();
    const now = this.ctx.currentTime;
    this.bedGain.gain.cancelScheduledValues(now);
    this.bedGain.gain.setValueAtTime(0.0001, now);
    this.bedGain.gain.linearRampToValueAtTime(1, now + 0.5);
    this.setTremolo(variant === 'tense');
    this.variant = variant;
    this.step = 0;
    this.nextTime = now + 0.08;
    this.musicId += 1;
    const id = this.musicId;
    const tick = () => {
      if (id !== this.musicId || !this.ctx) return;
      const horizon = this.ctx.currentTime + 0.22;
      const beat = 60 / CONFIG.AUDIO_BPM;
      while (this.nextTime < horizon) {
        this.scheduleBeat(this.nextTime, this.step, variant);
        this.step += 1;
        this.nextTime += beat;
      }
      this.musicTimer = window.setTimeout(tick, 70);
    };
    tick();
  }

  setTremolo(on) {
    if (!this.pulseGain) return;
    if (this.trem) {
      try { this.trem.stop(); this.trem.disconnect(); } catch (error) { /* already stopped */ }
      this.trem = null;
    }
    this.pulseGain.gain.value = 1;
    if (!on || !this.ctx) return;
    this.pulseGain.gain.value = 0.78;
    this.trem = this.ctx.createOscillator();
    this.trem.frequency.value = 3.1;
    const depth = this.ctx.createGain();
    depth.gain.value = 0.22;
    this.trem.connect(depth);
    depth.connect(this.pulseGain.gain);
    this.trem.start();
  }

  scheduleBeat(time, step, variant) {
    const tense = variant === 'tense';
    const drop = tense ? 0.82 : 1;
    const chordIndex = Math.floor((step % 16) / 4);
    const beatInBar = step % 4;
    const root = ROOTS[chordIndex] * drop;
    const walk = [root, root * 1.2, root * 1.5, root * 1.33][beatInBar];
    this.tone({
      time, freq: walk, dur: 0.42, type: 'triangle', gain: tense ? 0.16 : 0.13,
      dest: this.bedGain, attack: 0.02, wobble: true,
    });
    this.noiseHit(time, 0.05, tense ? 0.025 : 0.035, 6200, 0.7, this.bedGain);
    if (beatInBar % 2 === 1) this.noiseHit(time + 0.28, 0.04, 0.02, 7000, 0.5, this.bedGain);
    if (beatInBar === 0) {
      CHORDS[chordIndex].forEach((freq, index) => {
        this.tone({
          time, freq: freq * drop, dur: 2.15, type: 'sine',
          gain: 0.028, dest: this.bedGain, attack: 0.35, detune: index * 5 - 6, wobble: true,
        });
        this.tone({
          time, freq: freq * drop, dur: 2.15, type: 'triangle',
          gain: 0.012, dest: this.bedGain, attack: 0.4, detune: 8, wobble: true,
        });
      });
    }
    if (tense && step % 2 === 0) {
      this.tone({ time, freq: 130, slideTo: 46, dur: 0.16, type: 'sine', gain: 0.22, dest: this.bedGain, attack: 0.004 });
      this.tone({ time: time + 0.18, freq: 100, slideTo: 40, dur: 0.14, type: 'sine', gain: 0.14, dest: this.bedGain, attack: 0.004 });
    }
  }

  stopScheduler() {
    this.musicId += 1;
    if (this.musicTimer) window.clearTimeout(this.musicTimer);
    this.musicTimer = null;
    this.variant = null;
    this.setTremolo(false);
  }

  stopMusic() {
    if (!this.ctx || !this.bedGain) {
      this.musicId += 1;
      this.variant = null;
      if (this.musicTimer) window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
      return;
    }
    const now = this.ctx.currentTime;
    this.bedGain.gain.cancelScheduledValues(now);
    this.bedGain.gain.setValueAtTime(Math.max(0.0001, this.bedGain.gain.value), now);
    this.bedGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    this.stopScheduler();
  }

  startStatic(level = 0.04) {
    this.unlock();
    if (!this.ctx) return;
    if (!this.staticSrc) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2600;
      filter.Q.value = 0.55;
      this.staticGain = this.ctx.createGain();
      src.connect(filter);
      filter.connect(this.staticGain);
      this.staticGain.connect(this.sfxGain);
      src.start();
      this.staticSrc = src;
      this.queueCrackle();
    }
    this.staticGain.gain.value = level;
  }

  queueCrackle() {
    const pop = () => {
      if (!this.staticSrc || !this.ctx) return;
      if (Math.random() < 0.7) this.noiseHit(this.ctx.currentTime, 0.02, 0.05 + Math.random() * 0.06, 1800, 0.4);
      this.crackleTimer = window.setTimeout(pop, 90 + Math.random() * 480);
    };
    pop();
  }

  stopStatic() {
    if (this.crackleTimer) window.clearTimeout(this.crackleTimer);
    this.crackleTimer = null;
    if (this.staticSrc) {
      try { this.staticSrc.stop(); } catch (error) { /* already stopped */ }
      this.staticSrc = null;
    }
  }

  staticBurst(seconds = 0.35) {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseHit(t, seconds, 0.2, 2200, 0.4);
    this.noiseHit(t + 0.04, 0.05, 0.12, 900, 0.5);
  }

  playJingle(day = 1) {
    this.unlock();
    this.stopJingle();
    if (!this.ctx) return Promise.resolve();
    const amount = wearFor(day);
    const ctx = this.ctx;
    const start = ctx.currentTime + 0.05;
    const step = 0.18;
    const busGain = ctx.createGain();
    busGain.gain.value = 1;
    this.jingleBus = busGain;
    let output = busGain;
    if (amount > 0.08) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = crusherCurve(amount);
      busGain.connect(shaper);
      output = shaper;
    }
    output.connect(this.musicGain);

    let flutterDepth = null;
    if (amount > 0.02) {
      const flutter = ctx.createOscillator();
      flutterDepth = ctx.createGain();
      flutter.frequency.value = 2.5 + amount * 8;
      flutterDepth.gain.value = amount * 42;
      flutter.connect(flutterDepth);
      flutter.start();
      this.jingleFlutter = flutter;
    }
    if (amount > 0) this.noiseHit(start, step * 5, 0.02 + amount * 0.1, 3000, 0.4, busGain);

    const cut = day >= 30 ? start + step * 2 + step * 0.45 : null;
    JINGLE.forEach((freq, index) => {
      const time = start + index * step;
      if (cut && time >= cut) return;
      if (index > 0 && Math.random() < amount * 0.42) return;
      const dur = index === JINGLE.length - 1 ? 0.5 : 0.16;
      const detune = (Math.random() * 2 - 1) * amount * 48;
      [0, 1].forEach((layer) => {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = layer === 0 ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime(detune + layer * 6, time);
        if (flutterDepth) flutterDepth.connect(osc.detune);
        const gain = layer === 0 ? 0.07 : 0.05;
        amp.gain.setValueAtTime(0.0001, time);
        amp.gain.exponentialRampToValueAtTime(gain, time + 0.012);
        amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        osc.connect(amp);
        amp.connect(busGain);
        osc.start(time);
        osc.stop(time + dur + 0.02);
      });
      if (index === JINGLE.length - 1 && !cut) {
        this.tone({ time, freq: freq * 2.01, dur: 0.42, type: 'sine', gain: 0.05, dest: busGain, attack: 0.005 });
      }
    });

    if (cut) {
      busGain.gain.setValueAtTime(1, start);
      busGain.gain.setValueAtTime(1, cut);
      busGain.gain.exponentialRampToValueAtTime(0.0001, cut + 0.09);
    }

    const endAt = cut ? cut + 0.12 : start + step * 4 + 0.62;
    return new Promise((resolve) => {
      this.jingleResolve = resolve;
      this.jingleTimer = window.setTimeout(() => {
        this.jingleTimer = null;
        if (this.jingleFlutter) {
          try { this.jingleFlutter.stop(); } catch (error) { /* already stopped */ }
          this.jingleFlutter = null;
        }
        if (this.jingleBus) {
          try { this.jingleBus.disconnect(); } catch (error) { /* already stopped */ }
          this.jingleBus = null;
        }
        if (this.jingleResolve) {
          this.jingleResolve = null;
          resolve();
        }
      }, Math.max(0, (endAt - ctx.currentTime) * 1000));
    });
  }

  stopJingle() {
    if (this.jingleTimer) window.clearTimeout(this.jingleTimer);
    this.jingleTimer = null;
    if (this.jingleFlutter) {
      try { this.jingleFlutter.stop(); } catch (error) { /* already stopped */ }
      this.jingleFlutter = null;
    }
    if (this.jingleBus) {
      try { this.jingleBus.disconnect(); } catch (error) { /* already stopped */ }
      this.jingleBus = null;
    }
    if (this.jingleResolve) {
      const resolve = this.jingleResolve;
      this.jingleResolve = null;
      resolve();
    }
  }

  startLoop(kind) {
    this.unlock();
    if (!this.ctx || this.loops?.[kind]) return;
    this.loops = this.loops || {};
    if (kind === 'rain') {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 700;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 4200;
      const amp = this.ctx.createGain();
      amp.gain.value = 0.07;
      src.connect(hp);
      hp.connect(lp);
      lp.connect(amp);
      amp.connect(this.sfxGain);
      src.start();
      this.loops.rain = src;
      return;
    }
    if (kind === 'generator') {
      const amp = this.ctx.createGain();
      amp.gain.value = 0.045;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 58;
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 116;
      osc.connect(amp);
      osc2.connect(amp);
      amp.connect(this.sfxGain);
      osc.start();
      osc2.start();
      this.loops.generator = { osc, osc2, amp };
      return;
    }
    if (kind === 'sirens') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      const amp = this.ctx.createGain();
      amp.gain.value = 0.025;
      osc.connect(filter);
      filter.connect(amp);
      amp.connect(this.sfxGain);
      osc.start();
      const sweep = () => {
        if (!this.loops?.sirens) return;
        const now = this.ctx.currentTime;
        osc.frequency.cancelScheduledValues(now);
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.linearRampToValueAtTime(760, now + 0.75);
        osc.frequency.linearRampToValueAtTime(480, now + 1.5);
        this.sirenTimer = window.setTimeout(sweep, 1500);
      };
      this.loops.sirens = osc;
      sweep();
    }
  }

  stopLoop(kind) {
    const node = this.loops?.[kind];
    if (!node) return;
    if (kind === 'sirens' && this.sirenTimer) window.clearTimeout(this.sirenTimer);
    try {
      if (node.stop) node.stop();
      if (node.osc) {
        node.osc.stop();
        node.osc2.stop();
      }
    } catch (error) { /* already stopped */ }
    delete this.loops[kind];
  }

  startRain() { this.startLoop('rain'); }
  stopRain() { this.stopLoop('rain'); }
  startGenerator() { this.startLoop('generator'); }
  stopGenerator() { this.stopLoop('generator'); }
  startSirens() { this.startLoop('sirens'); }
  stopSirens() { this.stopLoop('sirens'); }
}

export const Audio = new AudioManager();
