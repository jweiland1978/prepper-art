const Phaser = globalThis.Phaser;

if (!Phaser) {
  throw new Error('Phaser 3 failed to load from jsDelivr.');
}

export default Phaser;
