class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    this.load.setCORS('anonymous');
    this.missing = [];

    const bar = this.add.graphics();
    this.add.text(640, 310, 'Loading', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffb000'
    }).setOrigin(0.5);

    this.load.on('progress', (p) => {
      bar.clear();
      bar.fillStyle(0x222222, 1);
      bar.fillRect(390, 360, 500, 28);
      bar.fillStyle(0xffb000, 1);
      bar.fillRect(394, 364, 492 * p, 20);
    });

    this.load.on('loaderror', (file) => {
      const path = String(file.url || file.src || '');
      const name = path.split('/').pop().split('?')[0] || file.key;
      this.missing.push({ key: file.key, name: name });
    });

    this.load.image('bg-title', 'https://jweiland1978.github.io/prepper-art/bg-title.jpg');
    this.load.image('portrait-biscuit', 'https://jweiland1978.github.io/prepper-art/portrait-biscuit.jpg');
  }

  create() {
    this.registry.set('missing', this.missing);
    this.scene.start('Title');
  }
}

class Title extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const bgName = this.failedName('bg-title', 'bg-title.jpg');
    if (!bgName) {
      const bg = this.add.image(640, 360, 'bg-title');
      bg.setScale(Math.max(1280 / bg.width, 720 / bg.height));
    } else {
      this.add.text(640, 360, bgName, {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ff0000'
      }).setOrigin(0.5);
    }

    const title = this.add.text(640, 100, 'PREPPER', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '108px',
      color: '#ffb000'
    }).setOrigin(0.5).setDepth(10);
    title.setShadow(0, 0, '#ffb000', 28, false, true);

    this.prompt = this.add.text(640, 560, 'Press to start', {
      fontFamily: 'Georgia, serif',
      fontSize: '36px',
      color: '#ffb000'
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: this.prompt,
      alpha: 0.25,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.portraitParts = this.makePortrait(this.failedName('portrait-biscuit', 'portrait-biscuit.jpg'));
    this.showing = false;
    this.hiss = null;

    this.add.text(640, 694, 'Made with AI (Grok Build and Grok Imagine). Design: Jeff (BlueWater78)', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#dddddd'
    }).setOrigin(0.5).setDepth(11).setShadow(0, 1, '#000000', 4, true, true);

    this.input.on('pointerdown', () => this.onPress());
    this.events.on('shutdown', () => this.stopHiss());
  }

  failedName(key, fallback) {
    const missing = this.registry.get('missing') || [];
    const row = missing.find((item) => item.key === key);
    if (row) return row.name;
    if (!this.textures.exists(key)) return fallback;
    return null;
  }

  makePortrait(failedName) {
    const parts = [];
    const frame = this.add.graphics().setDepth(5);
    frame.fillStyle(0x000000, 0.6);
    frame.fillRect(445, 185, 390, 455);
    frame.lineStyle(4, 0xffb000, 1);
    frame.strokeRect(445, 185, 390, 455);
    parts.push(frame);

    if (!failedName) {
      const pic = this.add.image(640, 385, 'portrait-biscuit').setDepth(6);
      if (pic.width > 0 && pic.height > 0) {
        pic.setScale(Math.min(350 / pic.width, 360 / pic.height));
      }
      parts.push(pic);
    } else {
      parts.push(this.add.text(640, 385, failedName, {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#ff0000'
      }).setOrigin(0.5).setDepth(6));
    }

    parts.push(this.add.text(640, 600, 'Biscuit. Good boy. Cannot die.', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#ffb000'
    }).setOrigin(0.5).setDepth(7).setShadow(0, 1, '#000000', 4, true, true));

    parts.forEach((obj) => obj.setVisible(false));
    return parts;
  }

  onPress() {
    this.showing = !this.showing;
    this.portraitParts.forEach((obj) => obj.setVisible(this.showing));
    this.prompt.setVisible(!this.showing);
    if (this.showing) this.startHiss();
    else this.stopHiss();
  }

  startHiss() {
    if (this.hiss) return;
    const ctx = this.sound && this.sound.context;
    if (!ctx) return;

    const length = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 900;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 4200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.08);

    src.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);

    const node = { src: src, gain: gain, ctx: ctx, alive: true };
    this.hiss = node;
    const run = () => {
      if (!node.alive) return;
      try { src.start(); } catch (e) { /* already started or closed */ }
    };
    if (ctx.state === 'suspended') ctx.resume().then(run);
    else run();
  }

  stopHiss() {
    const node = this.hiss;
    if (!node) return;
    this.hiss = null;
    node.alive = false;
    const t = node.ctx.currentTime;
    try {
      node.gain.gain.cancelScheduledValues(t);
      node.gain.gain.setValueAtTime(node.gain.gain.value, t);
      node.gain.gain.linearRampToValueAtTime(0, t + 0.05);
      node.src.stop(t + 0.06);
    } catch (e) { /* already stopped */ }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [Preload, Title]
});
