// ---------- Materials ----------
// Everything is procedural (textures drawn on a canvas): the kit downloads no textures and carries no licences.
// Floor and wall textures repeat in real metres (see metricBox and the floors in engine.js).
import * as THREE from 'three';

const cache = new Map();
let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function canvasTexture(w, h, draw, { repeat = 1, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / repeat, 1 / repeat); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

// Wooden floor: 20 × 120 cm planks in a staggered pattern, each with its own tone and grain; the drawing covers 2.4 × 1.2 m
function planks(color) {
  const t = canvasTexture(1024, 512, (g, W, H) => {
    const pw = W / 2, ph = H / 6;
    for (let row = 0; row < 6; row++) for (let x = -((row % 3) / 3) * pw; x < W; x += pw) {
      g.fillStyle = shade(color, 0.86 + random() * 0.26); g.fillRect(x, row * ph, pw, ph);
      g.strokeStyle = 'rgba(60,35,15,0.10)'; g.lineWidth = 1;
      for (let k = 0; k < 9; k++) {                                   // grain
        const y = row * ph + random() * ph; g.beginPath(); g.moveTo(x, y);
        g.bezierCurveTo(x + pw * 0.3, y + (random() - 0.5) * 8, x + pw * 0.7, y + (random() - 0.5) * 8, x + pw, y + (random() - 0.5) * 6); g.stroke();
      }
      g.fillStyle = 'rgba(40,25,12,0.55)'; g.fillRect(x, row * ph, 2, ph); g.fillRect(x, row * ph, pw, 2);   // joint
    }
  });
  t.repeat.set(1 / 2.4, 1 / 1.2);
  return t;
}
// Square tiles with grout, `size` metres each; every tile with a slight change of tone
function tiles(color, size = 0.6, grout = '#bfbab0') {
  const n = 4;
  return canvasTexture(512, 512, (g, W) => {
    const s = W / n;
    g.fillStyle = grout; g.fillRect(0, 0, W, W);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = shade(color, 0.94 + random() * 0.1); g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); }
  }, { repeat: size * n });
}
// Soft noise (carpet, concrete, plaster)
function noise(color, strength = 0.08, size = 1) {
  return canvasTexture(256, 256, (g, W) => {
    g.fillStyle = color; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${random() < 0.5 ? '0,0,0' : '255,255,255'},${random() * strength})`; g.fillRect(random() * W, random() * W, 2, 2); }
  }, { repeat: size });
}
// Face brick (25 × 6.5 cm with mortar joints)
function brick(color = '#a4553b') {
  return canvasTexture(512, 512, (g, W) => {
    g.fillStyle = '#cfc6b8'; g.fillRect(0, 0, W, W);
    const bw = W / 4, bh = W / 15.4;
    for (let r = 0; r < 16; r++) for (let x = (r % 2) * -bw / 2; x < W; x += bw) {
      g.fillStyle = shade(color, 0.8 + random() * 0.35); g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
    }
  }, { repeat: 1.0 });
}
// Wood grain for furniture (repeats every metre)
function grain(color) {
  return canvasTexture(512, 512, (g, W) => {
    g.fillStyle = color; g.fillRect(0, 0, W, W);
    for (let k = 0; k < 60; k++) {
      const y = random() * W; g.strokeStyle = `rgba(50,30,10,${0.04 + random() * 0.08})`; g.lineWidth = 1 + random() * 2;
      g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + (random() - 0.5) * 20, W * 0.7, y + (random() - 0.5) * 20, W, y); g.stroke();
    }
  });
}

const std = o => new THREE.MeshStandardMaterial(o);
const key = (...a) => a.join('|');
function memo(k, create) { if (!cache.has(k)) cache.set(k, create()); return cache.get(k); }

// Room floor. type: wood | tile | carpet | concrete | terrazzo
export function floorMaterial(type = 'wood', color) {
  return memo(key('floor', type, color), () => {
    if (type === 'tile') return std({ map: tiles(color || '#d9d4c8', 0.45), roughness: 0.35 });
    if (type === 'carpet') return std({ map: noise(color || '#8a8173', 0.12, 0.5), roughness: 1 });
    if (type === 'concrete') return std({ map: noise(color || '#a7a59f', 0.07, 2), roughness: 0.8 });
    if (type === 'terrazzo') return std({ map: tiles(color || '#e6e0d4', 0.4, '#d9d2c4'), roughness: 0.4 });
    return std({ map: planks(color || '#b58656'), roughness: 0.55 });
  });
}
// Wall finish. type: paint | brick | tile
export function wallMaterial(type = 'paint', color) {
  return memo(key('wall', type, color), () => {
    if (type === 'brick') return std({ map: brick(color), roughness: 0.95 });
    if (type === 'tile') return std({ map: tiles(color || '#f2f1ec', 0.2, '#ffffff'), roughness: 0.25 });
    return std({ color: color || '#f3f1ea', roughness: 0.95 });
  });
}
// Furniture material: plain colour with a finish
//   matte, satin, gloss, metal, steel (brushed), fabric, wood, glass, mirror, light
export function mat(color = '#cccccc', finish = 'satin') {
  return memo(key('mat', color, finish), () => {
    switch (finish) {
      case 'matte': return std({ color, roughness: 0.9 });
      case 'gloss': return std({ color, roughness: 0.15 });
      case 'metal': return std({ color, roughness: 0.35, metalness: 0.9 });
      case 'steel': return std({ color, roughness: 0.42, metalness: 0.65 });
      case 'fabric': return std({ map: noise(color, 0.07, 0.25), roughness: 1 });
      case 'wood': return std({ map: grain(color), roughness: 0.6 });
      case 'glass': return new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
      case 'mirror': return std({ color: '#dde5ea', roughness: 0.06, metalness: 0.85, envMapIntensity: 2.2 });
      case 'light': return std({ color, emissive: color, emissiveIntensity: 1.2 });
      default: return std({ color, roughness: 0.5 });
    }
  });
}

// Box with texture coordinates in metres (each face uses the two dimensions of its plane), so textures do not stretch
export function metricBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];      // +x, −x, +y, −y, +z, −z
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i; uv.setXY(k, uv.getX(k) * faces[f][0], uv.getY(k) * faces[f][1]);
  }
  return g;
}

// Texture drawn by the pieces themselves (whiteboards, paintings, screens)
export function drawnTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  return { texture, canvas: c };
}
