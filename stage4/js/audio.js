import { CONFIG } from './config.js?v=5';
import { bus } from './state.js?v=5';

const CHORDS = [
  [110, 130.81, 164.81, 196],
  [87.31, 110, 130.81, 164.81],
  [73.42, 110, 146.83, 220],
  [82.41, 123.47, 164.81, 196],
];
const ROOTS = [55, 43.65, 36.71, 41.2];
const JINGLE = [523.25, 659.25, 783.99, 1046.5, 1318.51];
const SPONSOR_NOTES = [262, 330, 392, 466, 523];
const VOICE_PITCH = { larry: 180, kowalski: 240, dale: 150, tina: 280, kevin: 330 };

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
    // Part C: true while the page is hidden, backgrounded, or the rotate prompt is up.
    this.hidden = false;
  }

  /** Part C: no sound may start (or wake the context) while the page can't be seen. */
  isHidden() {
    if (this.hidden) return true;
    try { return typeof document !== 'undefined' && document.visibilityState === 'hidden'; } catch (error) { return false; }
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
    // Never build or resume the context from a hidden page: a radio jingle or a line
    // burst fired by a timer must not wake audio in a background tab.
    if (this.isHidden()) return this;
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
    if (!this.ctx || gain <= 0 || this.isHidden()) return;
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
      if (wobble) {
        try { this.wobbleDepth.disconnect(osc.detune); } catch (error) { /* already gone */ }
      }
      try { osc.disconnect(); amp.disconnect(); } catch (error) { /* already gone */ }
    };
  }

  noiseHit(time, dur, gain, freq, q, dest) {
    if (!this.ctx || this.isHidden()) return;
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
    if (!this.ctx || this.isHidden()) return;
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
    this.noiseHit(time, 0.05, tense ? 0.010 : 0.012, 6200, 0.7, this.bedGain); // softer hi-hat (was 0.025/0.035)
    if (beatInBar % 2 === 1) this.noiseHit(time + 0.28, 0.04, 0.007, 7000, 0.5, this.bedGain); // was 0.02
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
    // Idempotent: only one static bed can ever exist. A second call just retunes it.
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
      this.staticFilter = filter;
      this.queueCrackle();
    }
    this.staticGain.gain.value = level;
  }

  queueCrackle() {
    if (this.crackleTimer) window.clearTimeout(this.crackleTimer);
    const pop = () => {
      if (!this.staticSrc || !this.ctx) return;
      // Don't pile up pops on a suspended (hidden/paused) context; they'd all fire on resume.
      if (this.ctx.state === 'running' && Math.random() < 0.7) {
        this.noiseHit(this.ctx.currentTime, 0.02, 0.05 + Math.random() * 0.06, 1800, 0.4);
      }
      this.crackleTimer = window.setTimeout(pop, 90 + Math.random() * 480);
    };
    pop();
  }

  stopStatic() {
    if (this.crackleTimer) window.clearTimeout(this.crackleTimer);
    this.crackleTimer = null;
    const src = this.staticSrc;
    const filter = this.staticFilter;
    const gain = this.staticGain;
    this.staticSrc = null;
    this.staticFilter = null;
    this.staticGain = null;
    // Silence first, then stop and pull every node out of the graph, so the bed
    // goes quiet even if stop() is deferred (e.g. a suspended iOS context).
    try {
      if (gain && this.ctx) {
        gain.gain.cancelScheduledValues(this.ctx.currentTime);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } catch (error) { /* context gone */ }
    try { src?.stop(); } catch (error) { /* already stopped */ }
    [src, filter, gain].forEach((node) => {
      try { node?.disconnect(); } catch (error) { /* already gone */ }
    });
  }

  /** Page hidden, app backgrounded, or rotate overlay up: park all audio. */
  setHidden(hidden) {
    this.hidden = !!hidden;
    if (!this.ctx) return;
    try {
      if (hidden) {
        if (this.ctx.state === 'running') {
          const p = this.ctx.suspend();
          if (p?.catch) p.catch(() => {});
        }
      } else if (this.unlocked && this.ctx.state !== 'running' && this.ctx.state !== 'closed') {
        const p = this.ctx.resume();
        if (p?.catch) p.catch(() => {});
      }
    } catch (error) { /* ignore */ }
  }

  staticBurst(seconds = 0.35, volume = 0.2) {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseHit(t, seconds, volume, 2200, 0.4);
    this.noiseHit(t + 0.04, 0.05, volume * 0.6, 900, 0.5);
  }

  playJingle(day = 1) {
    this.unlock();
    this.stopJingle();
    if (!this.ctx) return Promise.resolve();
    if (this.isHidden()) {
      // Hidden page: keep the radio's timing, make no sound.
      return new Promise((resolve) => {
        this.jingleResolve = resolve;
        this.jingleTimer = window.setTimeout(() => {
          this.jingleTimer = null;
          if (this.jingleResolve) { this.jingleResolve = null; resolve(); }
        }, 900);
      });
    }
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
      amp.gain.value = 0.03; // quieter map rain (was 0.07)
      src.connect(hp);
      hp.connect(lp);
      lp.connect(amp);
      amp.connect(this.sfxGain);
      src.start();
      this.loops.rain = { src, nodes: [hp, lp], amp };
      return;
    }
    if (kind === 'snow') {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1800;
      const amp = this.ctx.createGain();
      amp.gain.value = 0.035;
      src.connect(hp);
      hp.connect(amp);
      amp.connect(this.sfxGain);
      src.start();
      this.loops.snow = { src, nodes: [hp], amp };
      return;
    }
    if (kind === 'murmur') {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      const amp = this.ctx.createGain();
      amp.gain.value = 0.03;
      src.connect(lp);
      lp.connect(amp);
      amp.connect(this.sfxGain);
      src.start();
      this.loops.murmur = { src, nodes: [lp], amp };
      return;
    }
    if (kind === 'jukebox') {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 196;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 480;
      const amp = this.ctx.createGain();
      amp.gain.value = 0.028;
      osc.connect(lp);
      lp.connect(amp);
      amp.connect(this.sfxGain);
      osc.start();
      this.loops.jukebox = { src: osc, nodes: [lp], amp };
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
      this.loops.generator = { src: osc, src2: osc2, nodes: [], amp };
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
      this.loops.sirens = { src: osc, nodes: [filter], amp };
      sweep();
    }
  }

  stopLoop(kind) {
    const node = this.loops?.[kind];
    if (!node) return;
    if (kind === 'sirens' && this.sirenTimer) {
      window.clearTimeout(this.sirenTimer);
      this.sirenTimer = null;
    }
    delete this.loops[kind];
    // Same as stopStatic: silence, stop, then pull every node out of the graph.
    try {
      if (node.amp && this.ctx) {
        node.amp.gain.cancelScheduledValues(this.ctx.currentTime);
        node.amp.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } catch (error) { /* context gone */ }
    [node.src, node.src2].forEach((src) => {
      try { src?.stop(); } catch (error) { /* already stopped */ }
    });
    [node.src, node.src2, ...(node.nodes || []), node.amp].forEach((part) => {
      try { part?.disconnect(); } catch (error) { /* already gone */ }
    });
  }

  playWhistle() {
    this.unlock();
    if (!this.ctx) return;
    const time = this.ctx.currentTime;
    this.tone({ time, freq: 720, slideTo: 1680, dur: 0.34, type: 'sine', gain: 0.07, dest: this.sfxGain, attack: 0.01 });
    this.noiseHit(time + 0.32, 0.1, 0.16, 1600, 0.7);
  }

  playFanfare() {
    this.unlock();
    if (!this.ctx) return;
    const time = this.ctx.currentTime;
    this.noiseHit(time, 0.16, 0.18, 2200, 0.55);
    this.noiseHit(time + 0.1, 0.2, 0.14, 380, 0.4);
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      this.tone({
        time: time + 0.26 + index * 0.13,
        freq,
        dur: 0.24,
        type: 'triangle',
        gain: 0.11,
        dest: this.sfxGain,
        attack: 0.008,
      });
    });
  }

  /** Stage 4 achievement chime: soft tones only, no noise. Never wakes a suspended context. */
  achChime() {
    if (!this.ctx || this.ctx.state !== 'running' || !this.sfxGain) return;
    const time = this.ctx.currentTime;
    [659.25, 987.77].forEach((freq, index) => {
      this.tone({ time: time + index * 0.14, freq, dur: 0.3, type: 'sine', gain: 0.06, dest: this.sfxGain, attack: 0.01 });
    });
  }

  startRain() { this.startLoop('rain'); }
  stopRain() { this.stopLoop('rain'); }
  startGenerator() { this.startLoop('generator'); }
  stopGenerator() { this.stopLoop('generator'); }
  startSirens() { this.startLoop('sirens'); }
  stopSirens() { this.stopLoop('sirens'); }
  startSnow() { this.startLoop('snow'); }
  stopSnow() { this.stopLoop('snow'); }
  startMurmur() { this.startLoop('murmur'); }
  stopMurmur() { this.stopLoop('murmur'); }
  startJukebox() { this.startLoop('jukebox'); }
  stopJukebox() { this.stopLoop('jukebox'); }

  /** Cheesy lumber jingle. Separate from the 88.3 ident, a little worse each day. */
  playSponsor(day = 1) {
    this.unlock();
    this.stopSponsor();
    if (!this.ctx) return Promise.resolve();
    const amount = wearFor(day);
    const start = this.ctx.currentTime + 0.04;
    const step = 0.17;
    SPONSOR_NOTES.forEach((freq, index) => {
      const wobble = 1 + (index % 2 ? 1 : -1) * (0.015 + amount * 0.06);
      this.tone({
        time: start + index * step,
        freq: freq * wobble,
        dur: 0.2,
        type: 'square',
        gain: 0.055,
        dest: this.sfxGain,
        attack: 0.01,
      });
    });
    if (amount > 0.15) this.noiseHit(start, step * 5, amount * 0.06, 1600, 0.45);
    return new Promise((resolve) => {
      this.sponsorResolve = resolve;
      this.sponsorTimer = window.setTimeout(() => {
        this.sponsorTimer = null;
        if (this.sponsorResolve === resolve) this.sponsorResolve = null;
        resolve();
      }, (step * SPONSOR_NOTES.length + 0.2) * 1000);
    });
  }

  stopSponsor() {
    if (this.sponsorTimer) window.clearTimeout(this.sponsorTimer);
    this.sponsorTimer = null;
    // Like stopJingle: settle the pending promise so a skipped ad can't hang the radio.
    if (this.sponsorResolve) {
      const resolve = this.sponsorResolve;
      this.sponsorResolve = null;
      resolve();
    }
  }

  playRocket(mayhem) {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseHit(t, 0.28, 0.05, 5200, 0.22);
    this.tone({ time: t + 0.2, freq: 680, slideTo: 1720, dur: 0.3, type: 'sine', gain: 0.06, dest: this.sfxGain, attack: 0.01 });
    this.noiseHit(t + 0.5, 0.07, 0.18, 1500, 0.7);
    this.noiseHit(t + 0.56, 0.18, 0.07, 3000, 0.35);
    if (mayhem === 'bunker') {
      this.tone({ time: t + 0.58, freq: 62, slideTo: 34, dur: 0.3, type: 'sine', gain: 0.22, dest: this.sfxGain, attack: 0.004 });
    }
    if (mayhem === 'biscuit') {
      this.tone({ time: t + 0.64, freq: 520, slideTo: 760, dur: 0.32, type: 'sine', gain: 0.05, dest: this.sfxGain, attack: 0.02 });
    }
  }

  crackCan() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq: 190, slideTo: 80, dur: 0.045, type: 'square', gain: 0.08, dest: this.sfxGain, attack: 0.002 });
    this.noiseHit(t + 0.03, 0.32, 0.09, 3600, 0.3);
  }

  kaChunk() {
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq: 130, slideTo: 64, dur: 0.08, type: 'square', gain: 0.1, dest: this.sfxGain, attack: 0.002 });
    this.tone({ time: t + 0.09, freq: 240, dur: 0.05, type: 'triangle', gain: 0.06, dest: this.sfxGain, attack: 0.002 });
  }

  voice(id) {
    this.unlock();
    if (!this.ctx || !this.volumes.voiceBlips) return;
    const freq = VOICE_PITCH[id] || 220;
    const t = this.ctx.currentTime;
    this.tone({ time: t, freq, dur: 0.07, type: 'triangle', gain: 0.05, dest: this.voiceGain, attack: 0.008 });
    this.tone({ time: t + 0.06, freq: freq * 1.1, dur: 0.05, type: 'triangle', gain: 0.03, dest: this.voiceGain, attack: 0.006 });
  }
}

export const Audio = new AudioManager();
