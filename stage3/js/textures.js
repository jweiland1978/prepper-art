import { ASSET_LIST } from './assets.js?v=7';

function canvas(width, height) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return element;
}

function add(scene, key, element) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, element);
}

export function buildProceduralTextures(scene) {
  const grain = canvas(128, 128);
  const grainCtx = grain.getContext('2d', { willReadFrequently: true });
  grainCtx.fillStyle = '#000';
  grainCtx.fillRect(0, 0, 128, 128);
  add(scene, 'grain', grain);
  scratchGrain(scene);

  const scan = canvas(8, 4);
  const scanCtx = scan.getContext('2d');
  scanCtx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  scanCtx.fillRect(0, 0, 8, 1);
  add(scene, 'scanlines', scan);

  const vignette = canvas(1280, 720);
  const vignetteCtx = vignette.getContext('2d');
  const gradient = vignetteCtx.createRadialGradient(640, 340, 180, 640, 360, 760);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.62, 'rgba(0, 0, 0, 0.18)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
  vignetteCtx.fillStyle = gradient;
  vignetteCtx.fillRect(0, 0, 1280, 720);
  add(scene, 'vignette', vignette);

  const fiber = canvas(128, 128);
  const fiberCtx = fiber.getContext('2d');
  const fiberData = fiberCtx.createImageData(128, 128);
  for (let i = 0; i < fiberData.data.length; i += 4) {
    const v = 80 + Math.random() * 80;
    fiberData.data[i] = v;
    fiberData.data[i + 1] = v * 0.8;
    fiberData.data[i + 2] = v * 0.5;
    fiberData.data[i + 3] = Math.random() < 0.35 ? 80 : 0;
  }
  fiberCtx.putImageData(fiberData, 0, 0);
  add(scene, 'fiber', fiber);

  const drop = canvas(2, 12);
  const dropCtx = drop.getContext('2d');
  dropCtx.fillStyle = 'rgba(210, 220, 230, 0.85)';
  dropCtx.fillRect(0, 0, 2, 12);
  add(scene, 'p-drop', drop);

  const ash = canvas(6, 6);
  const ashCtx = ash.getContext('2d');
  ashCtx.fillStyle = 'rgba(180, 176, 168, 0.9)';
  ashCtx.beginPath();
  ashCtx.arc(3, 3, 2.2, 0, Math.PI * 2);
  ashCtx.fill();
  add(scene, 'p-ash', ash);

  const splash = canvas(10, 4);
  const splashCtx = splash.getContext('2d');
  splashCtx.strokeStyle = 'rgba(200, 210, 220, 0.7)';
  splashCtx.strokeRect(0, 1, 10, 1);
  add(scene, 'p-splash', splash);
}

export function scratchGrain(scene) {
  const texture = scene.textures.get('grain');
  const source = texture?.getSourceImage?.();
  if (!source?.getContext) return;
  const ctx = source.getContext('2d');
  const image = ctx.createImageData(source.width, source.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = Math.random() < 0.38 ? 160 : 0;
  }
  ctx.putImageData(image, 0, 0);
  texture.refresh();
}

export function makeLogo(scene) {
  const width = 1000;
  const height = 230;
  const element = canvas(width, height);
  const ctx = element.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.font = '400 188px "Bebas Neue", "Oswald", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4efe4';
  ctx.fillText('PREPPER', width / 2, height / 2 + 8);
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let y = 0; y < height; y += 1) {
    const scratch = y % 23 === 0;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 8) continue;
      const n = Math.random();
      if (n < 0.12 || (scratch && n < 0.55)) data[i + 3] = 0;
      else if (n < 0.18) data[i + 3] = 80;
    }
  }
  ctx.putImageData(image, 0, 0);
  add(scene, 'logo-prepper', element);
}

function fallbackBackground(scene, key) {
  const element = canvas(1280, 720);
  const ctx = element.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
  gradient.addColorStop(0, '#0c1424');
  gradient.addColorStop(0.55, '#172033');
  gradient.addColorStop(1, '#4a2a1c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1280, 720);
  const vignette = ctx.createRadialGradient(640, 360, 160, 640, 360, 780);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 1280, 720);
  add(scene, key, element);
}

function fallbackPortrait(scene, asset) {
  const element = canvas(512, 512);
  const ctx = element.getContext('2d');
  ctx.fillStyle = '#141a24';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#2c261f';
  ctx.beginPath();
  ctx.arc(256, 300, 170, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d342c';
  ctx.beginPath();
  ctx.arc(256, 200, 72, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(256, 390, 120, 80, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#f4efe4';
  ctx.font = '600 120px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(asset.initial || '?', 256, 250);
  add(scene, asset.key, element);
}

export function ensureArt(scene) {
  ASSET_LIST.forEach((asset) => {
    if (scene.textures.exists(asset.key)) return;
    console.warn(`[PREPPER] Failed to load ${asset.key} from ${asset.url}. Drawing a fallback.`);
    if (asset.kind === 'portrait' || asset.kind === 'icon') fallbackPortrait(scene, asset);
    else fallbackBackground(scene, asset.key);
  });
}
