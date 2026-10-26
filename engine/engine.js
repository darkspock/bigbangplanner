// ---------- Engine ----------
// Reads a house (houses/<name>/house.js, see docs/FORMAT.md) and builds the scene: walls with their openings, floors,
// rooms, doors and windows, furniture from the piece library (engine/pieces.js) and the panel tools: views, wall
// height, measuring, single-room view, first-person walk and a 2D plan with dimensions.
// House coordinates: metres in plan, x towards the east and y towards the south (as on a drawing); in 3D, y is height.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { floorMaterial, wallMaterial, mat, metricBox, drawnTexture } from './materials.js';
import { PIECES, DEFAULTS } from './pieces.js';
import { createWalk } from './walk.js';
import { planSVG, panZoom, K as KP } from './floorplan.js';
import { LANG, t, tr, num, translatePage, languageUrl } from './i18n.js';

const HEADING = { south: 0, east: Math.PI / 2, north: Math.PI, west: -Math.PI / 2 };
const DIR = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const $ = id => document.getElementById(id);

// Plan geometry
const rectOf = w => (Array.isArray(w) ? w : w.rect).slice(0, 4);
const normalize = ([x1, y1, x2, y2]) => [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
const area = poly => Math.abs(poly.reduce((s, [x, y], i) => { const [u, v] = poly[(i + 1) % poly.length]; return s + x * v - u * y; }, 0)) / 2;
function inPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// Point for the label: the middle of the polygon's largest horizontal band
function labelPoint(poly) {
  const ys = [...new Set(poly.map(p => p[1]))].sort((a, b) => a - b);
  let best = null;
  for (let i = 0; i + 1 < ys.length; i++) {
    const y = (ys[i] + ys[i + 1]) / 2, xs = [];
    poly.forEach((p, k) => { const q = poly[(k + 1) % poly.length]; if ((p[1] <= y && q[1] > y) || (q[1] <= y && p[1] > y)) xs.push(p[0] + (y - p[1]) * (q[0] - p[0]) / (q[1] - p[1])); });
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const s = (xs[k + 1] - xs[k]) * (ys[i + 1] - ys[i]); if (!best || s > best.s) best = { s, x: (xs[k] + xs[k + 1]) / 2, y }; }
  }
  return best ? [best.x, best.y] : poly[0];
}

export function start(house) {
  const H = house.ceilingHeight ?? 2.6, DOOR_HEIGHT = house.doorHeight ?? 2.03;
  const rooms = (house.rooms || []).map(r => ({ ...r, name: tr(r.name), text: tr(r.text), area: area(r.polygon) }));
  const levelAt = (x, y) => (rooms.find(r => inPolygon(x, y, r.polygon))?.level || 0);

  // ---------- Page texts ----------
  translatePage();
  const title = tr(house.name) || t('appName');
  document.title = title;
  $('title').textContent = title;
  $('subtitle').textContent = tr(house.description) || '';
  $('credits').textContent = [t('credits'), tr(house.credits)].filter(Boolean).join(' ');
  // Language flags: the current one is marked; clicking the other reloads the page in that language
  for (const b of document.querySelectorAll('#langs [data-lang]')) {
    b.setAttribute('aria-pressed', String(b.dataset.lang === LANG));
    b.onclick = () => { if (b.dataset.lang !== LANG) location.href = languageUrl(b.dataset.lang); };
  }

  // ---------- Scene ----------
  const app = $('app');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  app.appendChild(renderer.domElement);
  const labelRenderer = new CSS2DRenderer();
  Object.assign(labelRenderer.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
  app.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  scene.background = new THREE.Color(dark ? '#1b1e1c' : '#e9ebe6');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 400);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.maxPolarAngle = 1.48; controls.screenSpacePanning = true;
  controls.listenToKeyEvents(window); controls.keyPanSpeed = 14;          // arrows pan the view (controls are disabled while walking)

  // ---------- Walls and openings ----------
  const houseGroup = new THREE.Group(); scene.add(houseGroup);
  const cuttable = [];                                    // wall pieces that get trimmed by the wall-height slider
  function block(x1, z1, x2, z2, y0, y1, material, group = houseGroup) {
    if (x2 - x1 < 0.001 || z2 - z1 < 0.001 || y1 - y0 < 0.001) return null;
    const m = new THREE.Mesh(metricBox(x2 - x1, y1 - y0, z2 - z1), material);
    m.position.set((x1 + x2) / 2, (y0 + y1) / 2, (z1 + z2) / 2);
    m.castShadow = m.receiveShadow = true;
    m.userData.range = [y0, y1]; m.userData.rect = [x1, z1, x2, z2];
    group.add(m); cuttable.push(m);
    return m;
  }
  // Openings: doors and windows cut the walls they overlap
  const openings = [
    ...(house.doors || []).map(d => ({ r: normalize(d.opening), top: d.height ?? DOOR_HEIGHT, bottom: 0, door: d })),
    ...(house.windows || []).map(w => ({ r: normalize(w.opening), top: (w.sill ?? 0.9) + (w.height ?? 1.25), bottom: w.sill ?? 0.9, window: w })),
  ];
  const overlaps = (a, b) => a[0] < b[2] - 0.001 && a[2] > b[0] + 0.001 && a[1] < b[3] - 0.001 && a[3] > b[1] + 0.001;
  for (const wall of house.walls || []) {
    const [x1, y1, x2, y2] = normalize(rectOf(wall)), height = wall.height ?? H, base = wall.base ?? 0;
    const material = wallMaterial(wall.finish, wall.color), alongX = x2 - x1 >= y2 - y1;
    const [a1, a2] = alongX ? [x1, x2] : [y1, y2];
    const cuts = openings.filter(o => overlaps(o.r, [x1, y1, x2, y2]))
      .map(o => ({ o, a: Math.max(a1, alongX ? o.r[0] : o.r[1]), b: Math.min(a2, alongX ? o.r[2] : o.r[3]) })).sort((p, q) => p.a - q.a);
    const piece = (a, b, ya, yb) => (alongX ? block(a, y1, b, y2, ya, yb, material) : block(x1, a, x2, b, ya, yb, material));
    let from = a1;
    for (const { o, a, b } of cuts) {
      if (a > from) piece(from, a, base, base + height);
      if (o.top < height) piece(a, b, base + o.top, base + height);                       // lintel
      if (o.bottom > 0) piece(a, b, base, base + o.bottom);                                // sill wall
      o.wall = alongX ? { alongX, p1: y1, p2: y2 } : { alongX, p1: x1, p2: x2 };
      from = Math.max(from, b);
    }
    if (a2 > from) piece(from, a2, base, base + height);
  }
  for (const m of cuttable) m.userData.isWall = true;

  // Windows: glass in the middle of the wall, white frame, inner sill and outer drip sill
  const glass = mat('#cfe8ff', 'glass'), frame = mat('#f2f2ef', 'satin'), innerSill = mat('#ece7dc', 'gloss'), outerSill = mat('#b9b4aa', 'matte');
  for (const o of openings.filter(o => o.window)) {
    const [x1, y1, x2, y2] = o.r, w = o.wall || { alongX: x2 - x1 >= y2 - y1, p1: x2 - x1 >= y2 - y1 ? y1 : x1, p2: x2 - x1 >= y2 - y1 ? y2 : x2 };
    const c = (w.p1 + w.p2) / 2, y0 = o.bottom, yTop = o.top, f = 0.05;
    const box = (a, b, za, zb, ya, yb, m) => (w.alongX ? block(a, za, b, zb, ya, yb, m) : block(za, a, zb, b, ya, yb, m));
    const [a, b] = w.alongX ? [x1, x2] : [y1, y2];
    const pane = box(a, b, c - 0.01, c + 0.01, y0, yTop, glass); if (pane) { pane.castShadow = false; pane.userData.isWall = false; }
    for (const [pa, pb, ya, yb] of [[a, a + f, y0, yTop], [b - f, b, y0, yTop], [a, b, y0, y0 + f], [a, b, yTop - f, yTop], [(a + b) / 2 - 0.02, (a + b) / 2 + 0.02, y0, yTop]]) {
      const m = box(pa, pb, c - 0.035, c + 0.035, ya, yb, frame); if (m) m.userData.isWall = false;
    }
    if (y0 > 0) {
      const indoors = n => rooms.some(r => !r.outdoor && (w.alongX ? inPolygon((a + b) / 2, n, r.polygon) : inPolygon(n, (a + b) / 2, r.polygon)));
      for (const [side, face] of [[-1, w.p1], [1, w.p2]]) {
        const inside = indoors(face + side * 0.15), out = inside ? 0.04 : 0.05;
        const n0 = side < 0 ? face - out : c, n1 = side < 0 ? c : face + out;
        const m = box(a - 0.03, b + 0.03, n0, n1, y0 - (inside ? 0.025 : 0.04), y0, inside ? innerSill : outerSill);
        if (m) m.userData.isWall = false;
      }
    }
  }

  // ---------- Doors ----------
  const interactives = new Map();                         // 3D object → action when clicked
  const animations = [];
  const doorGroup = new THREE.Group(); scene.add(doorGroup);
  for (const o of openings.filter(o => o.door)) {
    const d = o.door, [x1, y1, x2, y2] = o.r, alongX = x2 - x1 >= y2 - y1;
    const w = o.wall || { alongX, p1: alongX ? y1 : x1, p2: alongX ? y2 : x2 };
    const c = (w.p1 + w.p2) / 2, [a1, a2] = alongX ? [x1, x2] : [y1, y2], L = a2 - a1;
    const leafMat = mat(d.color || '#f5f3ee', 'satin'), height = o.top;
    const toWorld = (a, n) => (alongX ? [a, n] : [n, a]);                                    // (along, across) → (x, z)
    // architraves on both faces
    for (const s of [-1, 1]) {
      const n0 = s > 0 ? w.p2 : w.p1 - 0.012, n1 = s > 0 ? w.p2 + 0.012 : w.p1;
      const trim = (a, b, ya, yb) => { const [xa, za] = toWorld(a, n0), [xb, zb] = toWorld(b, n1); return block(Math.min(xa, xb), Math.min(za, zb), Math.max(xa, xb), Math.max(za, zb), ya, yb, leafMat, doorGroup); };
      trim(a1 - 0.07, a1, 0, height + 0.07); trim(a2, a2 + 0.07, 0, height + 0.07); trim(a1 - 0.07, a2 + 0.07, height, height + 0.07);
    }
    if (d.type === 'opening') continue;
    const pivot = new THREE.Group(); doorGroup.add(pivot);
    const handleMat = mat('#a9adb1', 'metal');
    const add = (geo, m, x, y, z) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; pivot.add(mesh); return mesh; };
    let leaf, animate;
    if (d.type === 'sliding') {
      const [cx, cz] = toWorld((a1 + a2) / 2, c); pivot.position.set(cx, 0, cz);
      pivot.rotation.y = alongX ? 0 : Math.PI / 2;
      leaf = add(new THREE.BoxGeometry(L - 0.02, height - 0.01, 0.035), leafMat, 0, height / 2, 0);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.02, 0.16, 0.01), handleMat, L / 2 - 0.08, 1.0, s * 0.02);
      const [dx, dz] = DIR[d.opensTo] || [1, 0], dir = alongX ? dx : dz;
      const base = pivot.position.clone();
      animate = e => pivot.position.set(base.x + (alongX ? dir * e * (L - 0.06) : 0), 0, base.z + (alongX ? 0 : dir * e * (L - 0.06)));
    } else {
      const hingeAtEnd = alongX ? d.hinges === 'east' : d.hinges === 'south';
      const aH = hingeAtEnd ? a2 : a1, sense = hingeAtEnd ? -1 : 1;
      const [hx, hz] = toWorld(aH, c); pivot.position.set(hx, 0, hz);
      const along = alongX ? [sense, 0] : [0, sense], n = DIR[d.opensTo] || [0, 1];
      const th0 = Math.atan2(-along[1], along[0]);
      let dth = Math.atan2(-n[1], n[0]) - th0; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
      pivot.rotation.y = th0;
      leaf = add(new THREE.BoxGeometry(L - 0.01, height - 0.01, 0.04), leafMat, (L - 0.01) / 2, height / 2, 0);
      for (const s of [-1, 1]) {                                                              // lever handle with rose, on both faces
        add(new THREE.CylinderGeometry(0.026, 0.026, 0.01, 24), handleMat, L - 0.075, 1.0, s * 0.025).rotation.x = Math.PI / 2;
        add(new THREE.CylinderGeometry(0.009, 0.009, 0.045, 12), handleMat, L - 0.075, 1.0, s * 0.045).rotation.x = Math.PI / 2;
        add(new THREE.BoxGeometry(0.13, 0.016, 0.02), handleMat, L - 0.13, 1.0, s * 0.066);
        add(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 20), handleMat, L - 0.075, 0.86, s * 0.024).rotation.x = Math.PI / 2;   // keyhole
      }
      animate = e => (pivot.rotation.y = th0 + dth * e);
    }
    pivot.userData.rect = [x1, y1, x2, y2];
    const state = { t: d.open ? 1 : 0, target: d.open ? 1 : 0 }; animate(state.t);
    interactives.set(leaf, () => (state.target = 1 - state.target));
    animations.push(dt => {
      if (state.t === state.target) return;
      state.t = state.target > state.t ? Math.min(1, state.t + dt * 1.2) : Math.max(0, state.t - dt * 1.2);
      animate(state.t * state.t * (3 - 2 * state.t));
    });
    if (d.label) label(pivot, tr(d.label), L / 2, height + 0.3, 'piece');
  }

  // ---------- Floors and rooms ----------
  const floors = [], skirtings = [];
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: dark ? '#2a2e2b' : '#d7dbd3', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
  for (const r of rooms) {
    const shape = new THREE.Shape(r.polygon.map(([x, y]) => new THREE.Vector2(x, -y)));
    const geo = new THREE.ShapeGeometry(shape); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, floorMaterial(r.floor, r.floorColor));
    m.position.y = (r.level || 0) + 0.002; m.receiveShadow = true; m.userData.room = r;
    scene.add(m); floors.push(m);
    const [lx, ly] = labelPoint(r.polygon), anchor = new THREE.Object3D();
    anchor.position.set(lx, (r.level || 0) + 0.15, ly); scene.add(anchor);
    r.label = label(anchor, r.name, 0, 0);
  }
  // 7 cm skirting board around every indoor room, only where there is a wall and no door
  const skirtingMat = mat('#f4f2ec', 'satin'), wallRects = (house.walls || []).map(w => normalize(rectOf(w)));
  const gapRects = [...(house.doors || []).map(d => d.opening), ...(house.windows || []).filter(w => (w.sill ?? 0.9) === 0).map(w => w.opening)].map(normalize);   // not across doors or French windows
  const insideAny = (x, y, rs) => rs.some(r => x > r[0] - 0.001 && x < r[2] + 0.001 && y > r[1] - 0.001 && y < r[3] + 0.001);
  for (const r of rooms) {
    if (r.outdoor) continue;
    const P = r.polygon, base = r.level || 0;
    P.forEach((pa, i) => {
      const pb = P[(i + 1) % P.length], dx = pb[0] - pa[0], dy = pb[1] - pa[1], L = Math.hypot(dx, dy);
      if (L < 0.05 || (Math.abs(dx) > 0.001 && Math.abs(dy) > 0.001)) return;              // straight sides only (east-west or north-south)
      const ux = dx / L, uy = dy / L, mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2;
      const s = inPolygon(mx - uy * 0.05, my + ux * 0.05, P) ? -1 : 1, nx = -uy * s, ny = ux * s;   // outward normal
      let from = null;
      const close = t1 => {
        if (from === null || t1 - from < 0.08) { from = null; return; }
        const [x1, y1] = [pa[0] + ux * from, pa[1] + uy * from], [x2, y2] = [pa[0] + ux * t1, pa[1] + uy * t1];
        const xs = [x1, x2, x1 - nx * 0.012, x2 - nx * 0.012], ys = [y1, y2, y1 - ny * 0.012, y2 - ny * 0.012];
        const m = new THREE.Mesh(metricBox(Math.max(...xs) - Math.min(...xs) || 0.012, 0.07, Math.max(...ys) - Math.min(...ys) || 0.012), skirtingMat);
        m.position.set((Math.min(...xs) + Math.max(...xs)) / 2, base + 0.035, (Math.min(...ys) + Math.max(...ys)) / 2);
        m.receiveShadow = true; m.userData.room = r; scene.add(m); skirtings.push(m); from = null;
      };
      for (let t = 0; t <= L + 1e-6; t += 0.025) {
        const qx = pa[0] + ux * t + nx * 0.03, qy = pa[1] + uy * t + ny * 0.03;
        const ok = insideAny(qx, qy, wallRects) && !insideAny(qx, qy, gapRects);
        if (ok && from === null) from = t; else if (!ok) close(t);
      }
      close(L);
    });
  }
  function label(parent, text, x, y, cls = '') {
    const div = document.createElement('div'); div.className = 'lbl ' + cls; div.textContent = text;
    const o = new CSS2DObject(div); o.position.set(x, y, 0); parent.add(o); return o;
  }

  // ---------- Furniture ----------
  const furnitureGroup = new THREE.Group(); scene.add(furnitureGroup);
  const withInfo = new Map();                             // object → the item's card (name and text)
  // Water sound (filtered noise). It plays while any tap is open; audio starts with the first click.
  const audio = { ctx: null, gain: null, open: 0 };
  const waterSound = () => ({
    start() {
      if (!audio.ctx) {
        const ac = new (window.AudioContext || window.webkitAudioContext)(), n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), data = buf.getChannelData(0);
        for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.5;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
        const gain = ac.createGain(); gain.gain.value = 0;
        src.connect(bp).connect(lp).connect(gain).connect(ac.destination); src.start();
        Object.assign(audio, { ctx: ac, gain });
      }
      audio.ctx.resume?.(); audio.open++;
      audio.gain.gain.setTargetAtTime(0.07, audio.ctx.currentTime, 0.12);
    },
    stop() {
      audio.open = Math.max(0, audio.open - 1);
      if (!audio.open && audio.gain) audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.15);
    },
  });
  const ctx = {
    THREE, mat, wall: wallMaterial, drawnTexture, tr, t, lang: LANG, waterSound,
    box(g, x1, y1, z1, x2, y2, z2, m, { shadow = true } = {}) {
      const o = new THREE.Mesh(metricBox(Math.max(x2 - x1, 0.001), Math.max(y2 - y1, 0.001), Math.max(z2 - z1, 0.001)), m);
      o.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2); o.castShadow = shadow; o.receiveShadow = true; g.add(o); return o;
    },
    rounded(g, x1, y1, z1, x2, y2, z2, r, m) {
      const w = x2 - x1, h = y2 - y1, d = z2 - z1;
      const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01)), m);
      o.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2); o.castShadow = o.receiveShadow = true; g.add(o); return o;
    },
    cylinder(g, rTop, rBottom, h, x, y, z, m, segments = 16) {
      const o = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), m);
      o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o;
    },
    interactive(o, fn) { interactives.set(o, fn); },
    animate(fn) { animations.push(fn); },
    light(g, x, y, z, color, intensity, range) {
      const l = new THREE.PointLight(color, intensity * 3, range, 2); l.position.set(x, y, z); g.add(l); return l;
    },
  };
  const pieces = { ...PIECES, ...(house.pieces || {}) };
  for (const item of house.furniture || []) {
    const draw = pieces[item.type];
    if (!draw) { console.warn(t('unknownPiece')(item.type)); continue; }
    const p = { ...(DEFAULTS[item.type] || {}), ...item };
    const g = new THREE.Group();
    draw(p, g, ctx);
    g.position.set(p.x, levelAt(p.x, p.y) + (p.elevation || 0), p.y);
    g.rotation.y = typeof p.facing === 'number' ? p.facing * Math.PI / 180 : (HEADING[p.facing] ?? 0);   // degrees: 0 south, 90 east, 180 north, 270 west
    g.userData.item = p;
    furnitureGroup.add(g);
    if (p.label) label(g, tr(p.label), p.labelX || 0, (p.height || 1) + 0.25, 'piece');
    if (p.name || p.text) g.traverse(o => { if (o.isMesh && !interactives.has(o)) withInfo.set(o, p); });
  }

  // ---------- Light ----------
  const bounds = new THREE.Box3();
  for (const m of cuttable) bounds.expandByObject(m);
  for (const r of rooms) for (const [x, y] of r.polygon) bounds.expandByPoint(new THREE.Vector3(x, 0, y));
  const center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3()), R = Math.max(size.x, size.z);
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9b2a6', 0.9));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.4);
  const [sx, sz] = house.sun || [-0.6, 0.8];
  sun.position.set(center.x + sx * R, R * 1.2, center.z + sz * R); sun.target.position.copy(center);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 0.5, far: R * 4 });
  scene.add(sun, sun.target);

  // ---------- Camera and views ----------
  let flight = null;
  function flyTo(pos, lookAt) {
    flight = { t0: performance.now(), p0: camera.position.clone(), q0: controls.target.clone(), p1: pos, q1: lookAt };
  }
  // Distance at which a width × depth area (with a margin) fits on screen, whatever the window's aspect ratio
  const fitDistance = (width, depth) => {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.max(depth / 2 / tan, width / 2 / (tan * camera.aspect)) * 1.12;
  };
  const fullView = () => {
    const d = fitDistance(Math.hypot(size.x, size.z) * 0.92, Math.hypot(size.x, size.z) * 0.62);
    flyTo(new THREE.Vector3(center.x + d * 0.38, d * 0.72, center.z + d * 0.58), center.clone());
  };
  const topView = () => flyTo(new THREE.Vector3(center.x, fitDistance(size.x, size.z) + H, center.z + 0.01), center.clone());
  camera.position.set(center.x + R * 0.9, R * 1.3, center.z + R * 1.3); controls.target.copy(center);
  fullView();

  // ---------- Visibility: wall height, furniture, names and single room ----------
  let cut = H + 0.4, single = null;
  const options = { furniture: true, names: true };
  const nearSingle = r => {
    const [x1, y1, x2, y2] = r, xs = single.polygon.map(p => p[0]), ys = single.polygon.map(p => p[1]), m = 0.3;
    return x1 < Math.max(...xs) + m && x2 > Math.min(...xs) - m && y1 < Math.max(...ys) + m && y2 > Math.min(...ys) - m;
  };
  // In single-room view, walls between the camera and the room are lowered to 1 m so you can see inside
  const blocksView = m => {
    if (!single) return false;
    const [x1, z1, x2, z2] = m.userData.rect, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, [rx, rz] = single.center;
    if (inPolygon(cx, cz, single.polygon)) return false;
    return (cx - rx) * (camera.position.x - rx) + (cz - rz) * (camera.position.z - rz) > 0;
  };
  function refresh() {
    for (const m of cuttable) {
      const [y0, y1] = m.userData.range, top = Math.min(y1, cut, blocksView(m) ? 1.0 : Infinity);
      let vis = top > y0 + 0.001;
      if (vis) { m.scale.y = (top - y0) / (y1 - y0); m.position.y = y0 + (top - y0) / 2; }
      if (single && m.parent === houseGroup) vis = vis && nearSingle(m.userData.rect);
      m.visible = vis;
    }
    for (const pivot of doorGroup.children) if (pivot.userData.rect) pivot.visible = !single || nearSingle(pivot.userData.rect);
    for (const g of furnitureGroup.children) {
      const p = g.userData.item;
      g.visible = options.furniture && (!p.elevation || cut > p.elevation + 0.1) && (!single || inPolygon(p.x, p.y, single.polygon));
    }
    for (const m of floors) m.visible = !single || m.userData.room === single;
    for (const m of skirtings) m.visible = !single || m.userData.room === single;
    for (const r of rooms) r.label.visible = options.names && (!single || r === single);
    document.body.classList.toggle('hideNames', !options.names);
  }
  const cutEl = $('cut');
  cutEl.max = String(H + 0.4); cutEl.value = String(H + 0.4);
  const showCut = () => ($('cutValue').textContent = '· ' + (cut > H ? t('wallsFull') : num(cut) + ' m'));
  cutEl.oninput = () => { cut = parseFloat(cutEl.value); showCut(); refresh(); };
  $('optFurniture').onchange = e => { options.furniture = e.target.checked; refresh(); };
  $('optNames').onchange = e => { options.names = e.target.checked; refresh(); };
  showCut(); refresh();

  // ---------- Card and single room ----------
  function card(title, text) { $('info').hidden = false; $('infoTitle').textContent = title; $('infoText').textContent = text || ''; }
  const roomCard = r => card(`${r.name} · ≈ ${num(r.area, 1)} m²`, r.text);
  function showSingle(r) {
    single = r; single.center = labelPoint(r.polygon); refresh(); roomCard(r);
    $('roomChipName').textContent = r.name; $('roomChip').hidden = false;
    const xs = r.polygon.map(p => p[0]), ys = r.polygon.map(p => p[1]);
    const c = new THREE.Vector3((Math.min(...xs) + Math.max(...xs)) / 2, (r.level || 0) + 0.8, (Math.min(...ys) + Math.max(...ys)) / 2);
    const sx = Math.max(...xs) - Math.min(...xs), sz = Math.max(...ys) - Math.min(...ys);
    const d = Math.max(3.5, fitDistance(Math.hypot(sx, sz) * 1.1, Math.hypot(sx, sz) * 0.8));
    flyTo(new THREE.Vector3(c.x + d * 0.4, c.y + d * 0.72, c.z + d * 0.56), c);
  }
  function exitSingle() { if (!single) return; single = null; $('roomChip').hidden = true; refresh(); fullView(); }
  $('roomChipExit').onclick = exitSingle;

  // ---------- Picking with the mouse ----------
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const aim = (cx, cy) => {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(pointer, camera);
  };
  const visible = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  // The nearest usable thing (doors, wardrobes, TV…) that is not hidden behind something else
  function usable(r = ray) {
    const hits = r.intersectObjects([houseGroup, doorGroup, furnitureGroup], true).filter(h => visible(h.object) && h.object.material?.visible !== false);
    for (const h of hits) {
      for (let o = h.object; o; o = o.parent) if (interactives.has(o)) return { d: h.distance, fn: interactives.get(o), object: o };
      if (!h.object.material?.transparent) return null;
    }
    return null;
  }
  const roomUnderPointer = () => { const h = ray.intersectObjects(floors.filter(visible))[0]; return h ? h.object.userData.room : null; };

  let down = null;
  renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; longPress.begin(e); });
  renderer.domElement.addEventListener('pointerup', e => {
    longPress.cancel();
    if (longPress.fired || walk.active || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    aim(e.clientX, e.clientY);
    if (measure.on) { measureClick(); return; }
    const u = usable(); if (u) { u.fn(); return; }
    const info = ray.intersectObjects(furnitureGroup.children, true).find(h => visible(h.object));
    if (info && withInfo.has(info.object)) { const q = withInfo.get(info.object); card(tr(q.name) || q.type, tr(q.text)); return; }
    const room = roomUnderPointer(); if (room) roomCard(room);
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (walk.active || e.buttons) return;
    aim(e.clientX, e.clientY); renderer.domElement.style.cursor = usable() ? 'pointer' : '';
  });
  renderer.domElement.addEventListener('dblclick', e => {
    aim(e.clientX, e.clientY);
    const room = roomUnderPointer();
    if (room && room !== single) showSingle(room); else if (!room) exitSingle();
  });
  // Touch: press and hold for 0.5 s with one finger = single-room view
  const longPress = {
    timer: 0, fired: false, x: 0, y: 0,
    begin(e) {
      this.fired = false; clearTimeout(this.timer);
      if (e.pointerType !== 'touch') return;
      this.x = e.clientX; this.y = e.clientY;
      this.timer = setTimeout(() => { aim(this.x, this.y); const room = roomUnderPointer(); if (room) { this.fired = true; navigator.vibrate?.(30); showSingle(room); } }, 500);
    },
    cancel() { clearTimeout(this.timer); },
  };
  renderer.domElement.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - longPress.x, e.clientY - longPress.y) > 10) clearTimeout(longPress.timer); });

  // ---------- Measure ----------
  const measure = { on: false, a: null, done: false, group: new THREE.Group() };
  scene.add(measure.group);
  function setMeasure(on) {
    measure.on = on; measure.a = null; measure.group.clear();
    $('vMeasure').setAttribute('aria-pressed', String(on)); $('measureHelp').hidden = !on;
  }
  function measureClick() {
    const h = ray.intersectObjects([houseGroup, doorGroup, furnitureGroup, ...floors], true).find(h => visible(h.object));
    if (!h) return;
    const p = h.point.clone();
    if (!measure.a || measure.done) { measure.group.clear(); measure.a = p; measure.done = false; }
    else {
      const a = measure.a, d = a.distanceTo(p), dh = Math.hypot(p.x - a.x, p.z - a.z), dv = Math.abs(p.y - a.y);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, p]), new THREE.LineBasicMaterial({ color: '#d62828', depthTest: false }));
      line.renderOrder = 10; measure.group.add(line);
      const mid = new THREE.Object3D(); mid.position.copy(a).lerp(p, 0.5); measure.group.add(mid);
      label(mid, `${num(d)} m` + (dv > 0.05 && dh > 0.05 ? t('measurePlanHeight')(num(dh), num(dv)) : ''), 0, 0, 'piece');
      measure.done = true;
    }
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: '#d62828', depthTest: false }));
    dot.position.copy(p); dot.renderOrder = 11; measure.group.add(dot);
  }

  // ---------- Walk ----------
  const back = { pos: new THREE.Vector3(), target: new THREE.Vector3(), cut };
  const walk = createWalk({
    camera, floors: [...floors, ground], solids: () => [houseGroup, doorGroup, furnitureGroup], pick: r => usable(r),
    helpText: t('walkHelp'), helpTextDrag: t('walkHelpDrag'),
    onChange: on => {
      document.body.classList.toggle('walking', on); controls.enabled = !on;
      if (!on) { cut = back.cut; cutEl.value = String(cut); showCut(); refresh(); camera.position.copy(back.pos); controls.target.copy(back.target); }
    },
  });
  function startWalk() {
    if (measure.on) setMeasure(false);
    const room = single; exitSingle();
    back.pos.copy(camera.position); back.target.copy(controls.target); back.cut = cut;
    cut = H + 0.4; refresh(); flight = null;
    let from = house.walk?.start, lookAt = house.walk?.lookAt;
    if (room) { from = labelPoint(room.polygon); lookAt = [from[0], from[1] - 1]; }
    from = from || [center.x, center.z]; lookAt = lookAt || [from[0], from[1] - 1];
    walk.enter(new THREE.Vector3(from[0], 0, from[1]), new THREE.Vector3(lookAt[0], 0, lookAt[1]));
  }

  // ---------- 2D plan ----------
  const planEl = $('plan'), planSvg = $('planSvg');
  let pz = null;
  function openPlan() {
    exitSingle(); if (measure.on) setMeasure(false);
    const k = v => v * KP, kr = r => r.map(k), walls = [];
    for (const m of cuttable) {
      if (!m.userData.isWall || m.parent !== houseGroup) continue;
      const [y0, y1] = m.userData.range;
      if (y0 > 1.0 || y1 < 1.0) continue;
      const [x1, z1, x2, z2] = m.userData.rect;
      walls.push({ x1: k(x1), y1: k(z1), x2: k(x2), y2: k(z2), low: y1 < H - 0.5 });
    }
    const doors = [];
    for (const d of house.doors || []) {
      if (d.type === 'opening') continue;
      const r = normalize(d.opening), alongX = r[2] - r[0] >= r[3] - r[1];
      if (d.type === 'sliding') doors.push({ rect: kr(r), type: 'sliding', side: (DIR[d.opensTo] || [1, 0])[alongX ? 0 : 1] || 1 });
      else doors.push({ rect: kr(r), type: 'swing', side: (DIR[d.opensTo] || [0, 1])[alongX ? 1 : 0] || 1, hingeAtEnd: alongX ? d.hinges === 'east' : d.hinges === 'south' });
    }
    const { markup, viewBox } = planSVG({
      walls, windows: (house.windows || []).filter(w => (w.sill ?? 0.9) > 0).map(w => kr(normalize(w.opening))),
      glass: [], glassDoors: (house.windows || []).filter(w => (w.sill ?? 0.9) === 0).map(w => kr(normalize(w.opening))),
      doors, rooms: rooms.map(r => ({ name: r.name, poly: r.polygon.map(([x, y]) => [k(x), k(y)]), area: r.area, outdoor: r.outdoor })), num,
    });
    planSvg.innerHTML = markup;
    if (pz) pz.reset(viewBox); else { pz = panZoom(planSvg, viewBox); pz.reset(); }
    planEl.hidden = false; document.body.classList.add('inPlan');
  }
  function closePlan() { planEl.hidden = true; document.body.classList.remove('inPlan'); }

  // ---------- Panel ----------
  $('vFull').onclick = () => { exitSingle(); fullView(); };
  $('vTop').onclick = () => { exitSingle(); topView(); };
  $('vWalk').onclick = startWalk;
  $('vMeasure').onclick = () => setMeasure(!measure.on);
  $('vPlan').onclick = openPlan;
  $('planClose').onclick = closePlan;
  $('planPrint').onclick = () => print();
  $('planFit').onclick = () => pz?.reset();
  $('collapse').onclick = () => { const p = $('panel'); p.classList.toggle('collapsed'); $('collapse').textContent = t(p.classList.contains('collapsed') ? 'show' : 'hide'); };
  // Embedded in another page (?embed): the host page owns the language, and on a narrow frame the panel starts folded
  if (new URLSearchParams(location.search).has('embed')) {
    document.body.classList.add('embedded');
    if (innerWidth < 700) $('collapse').click();
  }
  // Help: the «?» button in the panel or the ? key
  const helpDialog = $('helpDialog');
  $('help').onclick = () => helpDialog.showModal();
  $('helpClose').onclick = () => helpDialog.close();
  helpDialog.addEventListener('click', e => { if (e.target === helpDialog) helpDialog.close(); });   // click outside the dialog
  addEventListener('keydown', e => {
    if (e.key === '?' && !walk.active && !helpDialog.open && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) helpDialog.showModal();
  });
  addEventListener('keydown', e => {
    if (e.code !== 'Escape' || walk.active || helpDialog.open) return;
    if (!planEl.hidden) closePlan(); else if (measure.on) setMeasure(false); else exitSingle();
  });

  // ---------- Loop ----------
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h); labelRenderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();
  let before = performance.now();
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - before) / 1000, 0.05); before = now;
    if (walk.active) walk.tick(dt);
    else if (flight) {
      const tt = Math.min((now - flight.t0) / 900, 1), k = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
      camera.position.lerpVectors(flight.p0, flight.p1, k); controls.target.lerpVectors(flight.q0, flight.q1, k);
      if (tt === 1) flight = null;
    }
    for (const f of animations) f(dt, now / 1000);
    if (!walk.active) controls.update();
    if (single) refresh();
    renderer.render(scene, camera); labelRenderer.render(scene, camera);
  });

  // For debugging from the console
  window.__house = {
    scene, camera, controls, house, rooms, showSingle, exitSingle, openPlan, startWalk, interactives,
    setCamera(pos, lookAt) { flight = null; camera.position.set(...pos); controls.target.set(...lookAt); controls.update(); },
    render(dt = 0.05, steps = 1) { for (let i = 0; i < steps; i++) for (const f of animations) f(dt, performance.now() / 1000); controls.update(); renderer.render(scene, camera); labelRenderer.render(scene, camera); },
  };
}
