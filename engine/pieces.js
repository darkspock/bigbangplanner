// ---------- Piece library ----------
// Each piece is a function (p, g, c): it draws the item inside group g, centred on the origin, standing on y = 0 and with
// its front facing +z (south). The engine places the group at (p.x, p.y), turns it to p.facing and raises it p.elevation.
//   p: the item's data in house.js (sizes in metres: width along x, depth along z, height along y; colours as '#rrggbb')
//   c: engine utilities: c.box, c.rounded, c.cylinder, c.mat, c.wall, c.drawnTexture, c.interactive, c.animate,
//      c.light, c.waterSound, c.tr, c.t, c.THREE (see docs/FORMAT.md)
// DEFAULTS gives each piece's default values (whatever house.js does not set).
import * as THREE from 'three';

export const DEFAULTS = {
  box: { width: 1, depth: 0.5, height: 0.8 },
  rug: { width: 2, depth: 1.4, color: '#b9a88f' },
  sofa: { width: 2.1, depth: 0.95, height: 0.85, seats: 3, color: '#8b7d6b' },
  armchair: { width: 0.9, depth: 0.9, height: 0.85, color: '#8b7d6b' },
  table: { width: 1.4, depth: 0.8, height: 0.75, color: '#a07850' },
  coffeeTable: { width: 1.1, depth: 0.55, height: 0.42, color: '#a07850' },
  chair: { width: 0.45, depth: 0.5, height: 0.9, color: '#3b3b3b' },
  stool: { width: 0.38, depth: 0.38, height: 0.75, color: '#3b3b3b' },
  desk: { width: 1.4, depth: 0.7, height: 0.75, color: '#a07850', screens: 1 },
  bookshelf: { width: 0.9, depth: 0.3, height: 1.9, shelves: 5, color: '#f0eee8', books: true },
  bed: { width: 1.35, depth: 2.0, color: '#d8d2c4', headboard: '#7a6a58' },
  nightstand: { width: 0.45, depth: 0.4, height: 0.52, color: '#a07850', lamp: true },
  wardrobe: { width: 1.6, depth: 0.6, height: 2.2, doors: 2, color: '#efece6' },
  counter: { width: 1.8, depth: 0.62, height: 0.9, color: '#e9e4da', topColor: '#3a3a38' },
  wallCabinet: { width: 1.2, depth: 0.35, height: 0.7, elevation: 1.45, color: '#e9e4da' },
  fridge: { width: 0.7, depth: 0.68, height: 1.85, color: '#d9dadb' },
  bar: { width: 1.8, depth: 0.55, height: 1.05, color: '#e9e4da', topColor: '#3a3a38' },
  sideboard: { width: 1.6, depth: 0.45, height: 0.5, color: '#a07850' },
  tv: { width: 1.2, depth: 0.08, mount: 'stand' },
  whiteboard: { width: 1.5, depth: 0.5, height: 1.0 },
  toilet: { width: 0.38, depth: 0.65 },
  washbasin: { width: 0.6, depth: 0.46, height: 0.85 },
  mirror: { width: 0.6, depth: 0.02, height: 0.8, elevation: 1.15 },
  shower: { width: 0.9, depth: 0.9 },
  bathtub: { width: 1.6, depth: 0.7 },
  plant: { width: 0.45, depth: 0.45, height: 1.0 },
  lamp: { width: 0.4, depth: 0.4, height: 1.6, color: '#f3ead8' },
  painting: { width: 0.8, depth: 0.03, height: 0.6, elevation: 1.2 },
  stairs: { width: 1.0, depth: 2.2, height: 1.4, steps: 8, color: '#bdb6a8' },
};

// Seeded pseudo-random generator (books and clothes always come out the same in the same place)
const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

export const PIECES = {
  box(p, g, c) {
    c.box(g, -p.width / 2, 0, -p.depth / 2, p.width / 2, p.height, p.depth / 2, c.mat(p.color || '#cccccc', p.finish));
  },

  rug(p, g, c) {
    c.box(g, -p.width / 2, 0, -p.depth / 2, p.width / 2, 0.012, p.depth / 2, c.mat(p.color, 'fabric'), { shadow: false });
  },

  sofa(p, g, c) {
    const { width: W, depth: D, height: Hb } = p, n = p.seats, a = n > 1 ? 0.16 : 0.14, fabric = c.mat(p.color, 'fabric');
    const leg = c.mat('#2b2622', 'satin');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.box(g, sx * (W / 2 - 0.08) - 0.025, 0, sz * (D / 2 - 0.08) - 0.025, sx * (W / 2 - 0.08) + 0.025, 0.08, sz * (D / 2 - 0.08) + 0.025, leg);
    c.box(g, -W / 2, 0.08, -D / 2, W / 2, 0.32, D / 2, fabric);                                    // frame
    c.rounded(g, -W / 2, 0.08, -D / 2, W / 2, Hb, -D / 2 + 0.2, 0.05, fabric);                     // back
    for (const s of [-1, 1]) c.rounded(g, s > 0 ? W / 2 - a : -W / 2, 0.08, -D / 2, s > 0 ? W / 2 : -W / 2 + a, 0.62, D / 2, 0.05, fabric);   // arms
    const w = (W - 2 * a) / n;
    for (let i = 0; i < n; i++) {
      const x0 = -W / 2 + a + i * w;
      c.rounded(g, x0 + 0.005, 0.32, -D / 2 + 0.2, x0 + w - 0.005, 0.46, D / 2 - 0.01, 0.05, fabric);           // seat cushion
      c.rounded(g, x0 + 0.01, 0.46, -D / 2 + 0.2, x0 + w - 0.01, Hb - 0.04, -D / 2 + 0.36, 0.06, fabric);       // back cushion
    }
    if (p.cushions !== false && n > 1) {                                                        // two loose cushions in the corners
      const colors = p.cushionColors || ['#c9a227', '#2e5a6b'];
      for (const s of [-1, 1]) {
        const cushion = c.rounded(g, -0.21, -0.21, -0.06, 0.21, 0.21, 0.06, 0.06, c.mat(colors[s > 0 ? 1 : 0], 'fabric'));
        cushion.position.set(s * (W / 2 - a - 0.26), 0.66, -D / 2 + 0.43); cushion.rotation.set(-0.35, s * 0.25, s * -0.12);
      }
    }
  },
  armchair(p, g, c) { PIECES.sofa({ ...p, seats: 1 }, g, c); },

  table(p, g, c) {
    const { width: W, depth: D, height: H } = p, m = c.mat(p.color, 'wood'), legs = c.mat(p.legColor || p.color, p.legColor ? 'satin' : 'wood');
    c.box(g, -W / 2, H - 0.04, -D / 2, W / 2, H, D / 2, m);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (W / 2 - 0.07), z = sz * (D / 2 - 0.07);
      c.box(g, x - 0.025, 0, z - 0.025, x + 0.025, H - 0.04, z + 0.025, legs);
    }
  },
  coffeeTable(p, g, c) { PIECES.table(p, g, c); },

  chair(p, g, c) {
    const m = c.mat(p.color, 'satin'), W = p.width, D = p.depth;
    c.box(g, -W / 2, 0.42, -D / 2 + 0.03, W / 2, 0.46, D / 2, m);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (W / 2 - 0.03), z = sz * (D / 2 - 0.04);
      c.box(g, x - 0.015, 0, z - 0.015, x + 0.015, 0.42, z + 0.015, m);
    }
    c.box(g, -W / 2, 0.46, -D / 2 + 0.01, W / 2, p.height, -D / 2 + 0.04, m);                     // backrest
  },
  stool(p, g, c) {
    const m = c.mat(p.color, 'satin'), H = p.height;
    c.cylinder(g, 0.18, 0.18, 0.05, 0, H - 0.025, 0, m, 24);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4, x = Math.cos(a) * 0.12, z = Math.sin(a) * 0.12;
      c.cylinder(g, 0.012, 0.015, H - 0.05, x, (H - 0.05) / 2, z, c.mat('#2b2b2b', 'metal'));
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 6, 24), c.mat('#2b2b2b', 'metal'));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.28; g.add(ring);
  },

  // Desk: clicking a screen or the tower switches the computer on (scrolling code on screen and a green light)
  desk(p, g, c) {
    PIECES.table(p, g, c);
    const H = p.height, D = p.depth, n = p.screens, black = c.mat('#1c1c1e', 'satin');
    const on = screenMaterial(c), off = c.mat('#0b0c0e', 'gloss'), keys = keyboardMaterial(c);
    const ledOn = c.mat('#3dff7f', 'light'), ledOff = c.mat('#1d2b22', 'satin');
    const computer = new THREE.Group(); g.add(computer);
    const screens = [], leds = [];
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 0.6;
      c.box(computer, x - 0.1, H, -D / 2 + 0.08, x + 0.1, H + 0.012, -D / 2 + 0.24, black);              // foot
      c.box(computer, x - 0.02, H, -D / 2 + 0.12, x + 0.02, H + 0.2, -D / 2 + 0.15, black);
      c.box(computer, x - 0.28, H + 0.12, -D / 2 + 0.15, x + 0.28, H + 0.45, -D / 2 + 0.18, black);      // monitor
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.3), off); screen.position.set(x, H + 0.285, -D / 2 + 0.1815); computer.add(screen); screens.push(screen);
      leds.push(c.box(computer, x + 0.24, H + 0.125, -D / 2 + 0.18, x + 0.25, H + 0.13, -D / 2 + 0.182, ledOff, { shadow: false }));
    }
    c.box(g, -0.22, H, 0.02, 0.22, H + 0.018, 0.17, c.mat('#d9d9d6', 'satin'));                 // keyboard
    const keyTop = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14), keys); keyTop.rotation.x = -Math.PI / 2; keyTop.position.set(0, H + 0.0185, 0.095); g.add(keyTop);
    c.box(g, 0.3, H, 0.06, 0.36, H + 0.03, 0.15, c.mat('#d9d9d6', 'satin'));                    // mouse
    if (p.tower) {
      c.box(computer, p.width / 2 - 0.28, 0, -D / 2 + 0.1, p.width / 2 - 0.08, 0.45, -D / 2 + 0.55, black);
      leds.push(c.box(computer, p.width / 2 - 0.19, 0.4, -D / 2 + 0.55, p.width / 2 - 0.17, 0.41, -D / 2 + 0.552, ledOff, { shadow: false }));
    }
    let isOn = !!p.on;
    const apply = () => { for (const s of screens) s.material = isOn ? on : off; for (const l of leds) l.material = isOn ? ledOn : ledOff; };
    apply();
    c.interactive(computer, () => { isOn = !isOn; apply(); });
    if (!screenScrolling) { screenScrolling = true; c.animate(dt => (on.map.offset.y += dt * 0.035)); }   // the code keeps scrolling up
  },

  bookshelf(p, g, c) {
    const { width: W, depth: D, height: H } = p, m = c.mat(p.color, p.finish || 'satin'), t = 0.02;
    c.box(g, -W / 2, 0, -D / 2, -W / 2 + t, H, D / 2, m); c.box(g, W / 2 - t, 0, -D / 2, W / 2, H, D / 2, m);
    c.box(g, -W / 2, 0, -D / 2, W / 2, H, -D / 2 + 0.01, m);
    const n = p.shelves, gap = (H - t) / n, random = seeded(Math.round((p.x || 1) * 997 + (p.y || 1) * 613) || 7);
    const colors = ['#7b2d26', '#1f4e79', '#2e6b3f', '#c9a227', '#5a3d6b', '#d4cfc4', '#a0522d', '#263238'];
    for (let i = 0; i <= n; i++) {
      const y = i * gap;
      c.box(g, -W / 2 + t, y, -D / 2, W / 2 - t, y + t, D / 2, m);
      if (!p.books || i === n) continue;
      for (let x = -W / 2 + t + 0.01; x < W / 2 - t - 0.05;) {
        if (random() < 0.12) { x += 0.06 + random() * 0.1; continue; }                          // gap between books
        const bw = 0.02 + random() * 0.035, bh = gap * (0.55 + random() * 0.35);
        c.box(g, x, y + t, -D / 2 + 0.02, x + bw, y + t + bh, D / 2 - 0.03 - random() * 0.04, c.mat(colors[Math.floor(random() * colors.length)], 'satin'), { shadow: false });
        x += bw + 0.002;
      }
    }
  },

  bed(p, g, c) {
    const { width: W, depth: L } = p, frame = c.mat(p.headboard, 'wood'), white = c.mat('#f6f4ef', 'fabric');
    c.box(g, -W / 2, 0.1, -L / 2, W / 2, 0.3, L / 2, frame);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.box(g, sx * (W / 2 - 0.05) - 0.025, 0, sz * (L / 2 - 0.05) - 0.025, sx * (W / 2 - 0.05) + 0.025, 0.1, sz * (L / 2 - 0.05) + 0.025, frame);
    c.rounded(g, -W / 2 + 0.02, 0.3, -L / 2 + 0.02, W / 2 - 0.02, 0.52, L / 2 - 0.02, 0.05, white);   // mattress
    c.rounded(g, -W / 2 - 0.03, 0.36, -L / 2 + 0.5, W / 2 + 0.03, 0.56, L / 2 + 0.03, 0.03, c.mat(p.color, 'fabric'));   // bedspread
    const n = W > 1.2 ? 2 : 1, pw = (W - 0.2) / n;
    for (let i = 0; i < n; i++) {
      const x0 = -W / 2 + 0.1 + i * pw;
      c.rounded(g, x0 + 0.02, 0.52, -L / 2 + 0.08, x0 + pw - 0.02, 0.66, -L / 2 + 0.45, 0.06, white);   // pillow
    }
    c.box(g, -W / 2 - 0.04, 0, -L / 2 - 0.07, W / 2 + 0.04, 1.05, -L / 2, frame);               // headboard
    c.rounded(g, -W / 2 - 0.035, 0.55, -L / 2 + 0.48, W / 2 + 0.035, 0.6, -L / 2 + 0.7, 0.02, white);   // folded sheet
    if (p.throw !== false) c.rounded(g, -W / 2 - 0.05, 0.4, L / 2 - 0.62, W / 2 + 0.05, 0.6, L / 2 - 0.2, 0.025, c.mat(p.throwColor || '#c9b48a', 'fabric'));   // throw at the foot
  },

  nightstand(p, g, c) {
    const { width: W, depth: D, height: H } = p, m = c.mat(p.color, 'wood');
    c.box(g, -W / 2, 0, -D / 2, W / 2, H, D / 2 - 0.02, m);
    drawer(g, c, -W / 2, W / 2, H * 0.55, H, D / 2, m, 0.1, D - 0.08, 'knob');                    // drawer that slides out when clicked
    if (p.lamp) PIECES.lamp({ ...p, height: 0.42, width: 0.24, color: '#f3ead8', onTable: true }, g, c, H);
  },

  // Floor lamp (or table lamp, with `onTable`): clicking it switches it on or off
  lamp(p, g, c, base = 0) {
    const H = p.height, r = p.width / 2, metal = c.mat('#4a4a48', 'metal');
    c.cylinder(g, r * 0.5, r * 0.55, 0.03, 0, base + 0.015, 0, metal, 24);
    c.cylinder(g, 0.012, 0.012, H - 0.25, 0, base + (H - 0.25) / 2, 0, metal);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r, 0.28, 32, 1, true),
      new THREE.MeshStandardMaterial({ color: p.color, side: THREE.DoubleSide, roughness: 0.9, emissive: p.color, emissiveIntensity: 0 }));
    shade.position.y = base + H - 0.14; g.add(shade);
    const light = c.light(g, 0, base + H - 0.2, 0, '#ffd7a0', p.onTable ? 3 : 6, p.onTable ? 3 : 5);
    const set = on => { light.visible = on; shade.material.emissiveIntensity = on ? 0.9 : 0; };
    let on = p.on ?? !p.onTable; set(on);
    c.interactive(shade, () => set(on = !on));
  },

  wardrobe(p, g, c) {
    const { width: W, depth: D, height: H } = p, m = c.mat(p.color, p.finish || 'satin'), t = 0.02;
    c.box(g, -W / 2, 0, -D / 2, -W / 2 + t, H, D / 2 - t, m); c.box(g, W / 2 - t, 0, -D / 2, W / 2, H, D / 2 - t, m);
    c.box(g, -W / 2, H - t, -D / 2, W / 2, H, D / 2 - t, m); c.box(g, -W / 2, 0, -D / 2, W / 2, 0.08, D / 2 - t, m);
    c.box(g, -W / 2, 0, -D / 2, W / 2, H, -D / 2 + 0.01, m);
    c.box(g, -W / 2 + t, H - 0.35, -D / 2, W / 2 - t, H - 0.33, D / 2 - t, m);                   // top shelf
    c.cylinder(g, 0.012, 0.012, W - 2 * t, 0, H - 0.45, 0, c.mat('#9a9a98', 'metal')).rotation.z = Math.PI / 2;   // rail
    const random = seeded(Math.round(W * 1000) + 3), clothes = ['#2f3e5c', '#7b2d26', '#c9c3b5', '#3a5a40', '#1c1c1c', '#b88a3c'];
    for (let x = -W / 2 + 0.08; x < W / 2 - 0.08; x += 0.05 + random() * 0.04) {              // hanging clothes
      const len = 0.6 + random() * 0.5;
      c.box(g, x, H - 0.47 - len, -0.22, x + 0.025, H - 0.47, 0.22, c.mat(clothes[Math.floor(random() * clothes.length)], 'fabric'), { shadow: false });
    }
    const n = p.doors, dw = (W - 0.004 * (n + 1)) / n, leaves = [];
    const state = { t: 0, target: 0 };
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0, x0 = -W / 2 + 0.004 + i * (dw + 0.004);
      const pivot = new THREE.Group(); pivot.position.set(left ? x0 : x0 + dw, 0, D / 2 - t); g.add(pivot);
      const leaf = c.box(pivot, left ? 0 : -dw, 0.005, 0, left ? dw : 0, H - 0.005, t, m);
      const hx = left ? dw - 0.05 : -0.05;
      c.box(pivot, hx, H * 0.45, t, hx + 0.02, H * 0.45 + 0.3, t + 0.025, c.mat('#b08d57', 'metal'));   // handle
      leaves.push({ pivot, s: left ? -1 : 1 });
      c.interactive(leaf, () => (state.target = 1 - state.target));
    }
    c.animate(dt => {
      if (state.t === state.target) return;
      state.t = state.target > state.t ? Math.min(1, state.t + dt * 1.5) : Math.max(0, state.t - dt * 1.5);
      const e = state.t * state.t * (3 - 2 * state.t);
      for (const l of leaves) l.pivot.rotation.y = l.s * e * 1.75;
    });
  },

  // Kitchen base units with worktop. sink, hob and drawers: position of their centre, in metres from the centre of the
  // unit along its width. The sink sits in a cut-out of the worktop, with a sunken steel bowl and a tap; under the hob
  // goes the oven (oven: false removes it); `drawers` puts a three-drawer unit in that module.
  // backsplash: height of the tiled panel against the wall (0 removes it).
  counter(p, g, c) {
    const { width: W, depth: D, height: H } = p, front = c.mat(p.color, 'satin'), top = c.mat(p.topColor, 'gloss');
    const zf = D / 2 - 0.02;                                                                    // face of the fronts
    c.box(g, -W / 2, 0, -D / 2, W / 2, 0.1, zf - 0.06, c.mat('#2b2b2b'));                       // recessed plinth
    const n = Math.max(1, Math.round(W / 0.6)), w = W / n, moduleAt = x => Math.min(n - 1, Math.max(0, Math.floor((x + W / 2) / w)));
    const kinds = Array(n).fill('door');
    if (p.sink !== undefined) kinds[moduleAt(p.sink)] = 'sink';
    if (p.hob !== undefined && p.oven !== false) kinds[moduleAt(p.hob)] = 'oven';
    if (p.drawers !== undefined) kinds[moduleAt(p.drawers)] = 'drawers';
    // carcasses by module: under the sink the carcass stops below the bowl, which stays hollow
    const xs0 = p.sink !== undefined ? p.sink - 0.26 : Infinity, xs1 = p.sink !== undefined ? p.sink + 0.26 : -Infinity;
    for (const [a, b, topY] of [[-W / 2, Math.min(xs0, W / 2), H - 0.04], [Math.max(xs0, -W / 2), Math.min(xs1, W / 2), H - 0.215], [Math.max(xs1, -W / 2), W / 2, H - 0.04]]) {
      if (b - a > 0.001) c.box(g, a, 0.1, -D / 2, b, topY, zf - 0.019, front);
    }
    kinds.forEach((kind, i) => baseModule(g, c, kind, -W / 2 + i * w, -W / 2 + (i + 1) * w, 0.1, H - 0.04, zf, front));
    const cutouts = p.sink !== undefined ? [{ x: p.sink, z: 0.03, w: 0.5, d: 0.4, r: 0.03 }] : [];
    slab(g, c, -W / 2, -D / 2, W / 2, D / 2 + 0.02, H, 0.04, cutouts, top);
    if (p.sink !== undefined) {
      const x = p.sink;
      sinkBowl(g, c, x, 0.03, 0.5, 0.4, H, 0.2, c.mat('#8f969c', 'steel'));
      tap(g, c, x, H, -D / 2 + 0.07, 1, 0.24, 0, 0.195);
    }
    if (p.hob !== undefined) {
      const x = p.hob, glass = c.box(g, x - 0.3, H, -0.25, x + 0.3, H + 0.006, 0.25, c.mat('#111214', 'gloss'));
      const zones = [], offRing = c.mat('#55585c', 'satin'), red = c.mat('#ff4a1c', 'light');
      for (const [dx, dz, r] of [[-0.14, -0.1, 0.09], [0.14, -0.1, 0.07], [-0.14, 0.12, 0.07], [0.14, 0.12, 0.09]]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.004, 4, 32), offRing);
        ring.rotation.x = Math.PI / 2; ring.position.set(x + dx, H + 0.007, dz); g.add(ring);
        const glow = new THREE.Mesh(new THREE.CircleGeometry(r * 0.92, 32), red); glow.rotation.x = -Math.PI / 2; glow.position.set(x + dx, H + 0.0065, dz);
        glow.visible = false; g.add(glow); zones.push([ring, glow]);
      }
      let hot = false;                                                                          // clicking the glass makes the zones glow red
      c.interactive(glass, () => { hot = !hot; for (const [ring, glow] of zones) { glow.visible = hot; ring.material = hot ? red : offRing; } });
      for (let i = 0; i < 4; i++) c.box(g, x - 0.09 + i * 0.06, H + 0.006, 0.215, x - 0.07 + i * 0.06, H + 0.0065, 0.235, c.mat('#8a8d91'), { shadow: false });   // touch controls
    }
    const splash = p.backsplash ?? 0.55;
    if (splash > 0) c.box(g, -W / 2, H, -D / 2, W / 2, H + splash, -D / 2 + 0.008, c.wall('tile', p.backsplashColor || '#f4f2ec'));
  },
  wallCabinet(p, g, c) {
    const { width: W, depth: D, height: H } = p, m = c.mat(p.color, 'satin');
    c.box(g, -W / 2, 0, -D / 2, W / 2, H, D / 2 - 0.02, m);
    doorRow(g, c, W, 0, H, D / 2 - 0.02, 0.6, 'bottom');
  },
  sideboard(p, g, c) {
    const { width: W, depth: D, height: H } = p, m = c.mat(p.color, 'wood');
    c.box(g, -W / 2, 0.08, -D / 2, W / 2, H, D / 2, m);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.box(g, sx * (W / 2 - 0.05) - 0.02, 0, sz * (D / 2 - 0.05) - 0.02, sx * (W / 2 - 0.05) + 0.02, 0.08, sz * (D / 2 - 0.05) + 0.02, c.mat('#2b2622'));
    doorRow(g, c, W, 0.08, H, D / 2, W / Math.max(2, Math.round(W / 0.5)));
  },
  bar(p, g, c) {
    const { width: W, depth: D, height: H } = p;
    c.box(g, -W / 2, 0, -D / 2, W / 2, H - 0.04, D / 2 - 0.28, c.mat(p.color, 'satin'));
    c.box(g, -W / 2, H - 0.04, -D / 2, W / 2, H, D / 2, c.mat(p.topColor, 'gloss'));
  },

  // Fridge: clicking it opens the door and switches the light inside on
  fridge(p, g, c) {
    const { width: W, depth: D, height: H } = p, m = c.mat(p.color, 'metal');
    c.box(g, -W / 2, 0, -D / 2, W / 2, H, D / 2 - 0.05, m);
    const inside = c.box(g, -W / 2 + 0.04, 0.08, -D / 2 + 0.05, W / 2 - 0.04, H - 0.06, D / 2 - 0.049, c.mat('#f7f7f2', 'light'));
    inside.material = inside.material.clone(); inside.material.emissiveIntensity = 0;
    for (const y of [0.5, 0.85, 1.2, 1.5]) c.box(g, -W / 2 + 0.05, y, -D / 2 + 0.06, W / 2 - 0.05, y + 0.01, D / 2 - 0.06, c.mat('#ffffff', 'glass'), { shadow: false });
    const pivot = new THREE.Group(); pivot.position.set(W / 2, 0, D / 2 - 0.05); g.add(pivot);
    const door = c.box(pivot, -W, 0.01, 0, 0, H - 0.01, 0.05, m);
    c.box(pivot, -W, 0.62, 0.05, 0, 0.625, 0.052, c.mat('#8a8c8e'));                                // freezer line
    c.box(pivot, -W + 0.04, 0.9, 0.05, -W + 0.06, 1.4, 0.08, c.mat('#8a8c8e', 'metal'));             // handle
    const state = { t: 0, target: 0 };
    c.interactive(door, () => (state.target = 1 - state.target));
    c.animate(dt => {
      if (state.t === state.target) return;
      state.t = state.target > state.t ? Math.min(1, state.t + dt * 1.6) : Math.max(0, state.t - dt * 1.6);
      pivot.rotation.y = state.t * state.t * (3 - 2 * state.t) * 1.9;
      inside.material.emissiveIntensity = state.t > 0.05 ? 0.9 : 0;
    });
  },

  // TV: clicking it switches it on (a channel of stars and a planet drawn live)
  tv(p, g, c) {
    const W = p.width, Hs = W * 9 / 16, black = c.mat('#141416', 'satin'), y0 = p.mount === 'wall' ? 0 : 0.08;
    if (p.mount !== 'wall') {
      c.box(g, -0.18, 0, -0.08, 0.18, 0.012, 0.08, black);
      c.box(g, -0.03, 0, -0.03, 0.03, y0 + 0.05, 0.0, black);
    }
    c.box(g, -W / 2 - 0.012, y0, -0.03, W / 2 + 0.012, y0 + Hs + 0.024, 0, black);
    const { texture, canvas } = c.drawnTexture(512, 288, () => {});
    const off = c.mat('#0b0c0e', 'gloss'), on = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, Hs), off);
    screen.position.set(0, y0 + 0.012 + Hs / 2, 0.001); g.add(screen);
    const gx = canvas.getContext('2d'), random = seeded(42), stars = [...Array(160)].map(() => [random() * 512, random() * 288, random() * 1.5 + 0.3]);
    let isOn = false, t = 0;
    c.interactive(screen, () => { isOn = !isOn; screen.material = isOn ? on : off; });
    c.animate(dt => {
      if (!isOn) return;
      t += dt;
      gx.fillStyle = '#05060f'; gx.fillRect(0, 0, 512, 288);
      for (const s of stars) { s[0] = (s[0] - s[2] * dt * 40 + 512) % 512; gx.fillStyle = `rgba(255,255,255,${0.4 + s[2] / 3})`; gx.fillRect(s[0], s[1], s[2] * 1.5, s[2] * 1.5); }
      const px = 256 + Math.sin(t * 0.2) * 120;
      const gr = gx.createRadialGradient(px - 20, 130, 5, px, 150, 70); gr.addColorStop(0, '#f2c27b'); gr.addColorStop(1, '#7a3b1c');
      gx.fillStyle = gr; gx.beginPath(); gx.arc(px, 150, 60, 0, Math.PI * 2); gx.fill();
      gx.strokeStyle = 'rgba(240,220,180,0.6)'; gx.lineWidth = 4; gx.beginPath(); gx.ellipse(px, 150, 100, 18, -0.25, 0, Math.PI * 2); gx.stroke();
      texture.needsUpdate = true;
    });
  },

  // Whiteboard on wheels (or hung, with `wall`); `lines`: what is written, one string per line (may be { en, es })
  whiteboard(p, g, c) {
    const W = p.width, Hb = p.height, alu = c.mat('#b9bcbf', 'metal'), y0 = p.wall ? 0 : 0.85;
    const lines = c.tr(p.lines) || ['E = mc²', 'iħ ∂ψ/∂t = Ĥψ', '∇·E = ρ/ε₀', 'F = G·m₁m₂/r²'];
    const { texture } = c.drawnTexture(1024, Math.round(1024 * Hb / W), (gx, w, h) => {
      gx.fillStyle = '#fbfbf8'; gx.fillRect(0, 0, w, h);
      const fs = Math.min(64, (h - 40) / (lines.length + 0.5));
      gx.font = `${fs}px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive`;
      lines.forEach((l, i) => { gx.fillStyle = i % 3 === 2 ? '#b3261e' : i % 2 ? '#1d3f8f' : '#1b1b1b'; gx.fillText(l, 40, 30 + fs * (i + 1)); });
    });
    c.box(g, -W / 2 - 0.02, y0, -0.015, W / 2 + 0.02, y0 + Hb + 0.04, 0.015, alu);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(W, Hb), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35 }));
    board.position.set(0, y0 + 0.02 + Hb / 2, 0.016); g.add(board);
    if (!p.wall) for (const s of [-1, 1]) {
      c.box(g, s * (W / 2 + 0.02) - 0.02, 0.06, -0.02, s * (W / 2 + 0.02) + 0.02, y0 + Hb + 0.04, 0.02, alu);
      c.box(g, s * (W / 2 + 0.02) - 0.03, 0.04, -0.25, s * (W / 2 + 0.02) + 0.03, 0.08, 0.25, alu);
      for (const z of [-0.22, 0.22]) c.cylinder(g, 0.03, 0.03, 0.03, s * (W / 2 + 0.02), 0.03, z, c.mat('#222'), 12).rotation.z = Math.PI / 2;
    }
  },

  // Floor-standing toilet: turned bowl, seat, lid (clicking the toilet lowers or raises it) and cistern with flush button
  toilet(p, g, c) {
    const white = c.mat('#fbfbf9', 'gloss'), D = p.depth;
    c.rounded(g, -0.19, 0.38, -D / 2, 0.19, 0.8, -D / 2 + 0.17, 0.02, white);                    // cistern
    c.cylinder(g, 0.035, 0.035, 0.008, 0, 0.804, -D / 2 + 0.085, c.mat('#c4c8cc', 'metal'), 24); // flush button
    const profile = [[0, 0], [0.12, 0], [0.125, 0.04], [0.105, 0.17], [0.15, 0.3], [0.19, 0.39], [0.195, 0.41], [0.17, 0.41], [0.12, 0.36], [0, 0.34]];
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 40), white);
    bowl.scale.z = 1.3; bowl.position.z = 0.03; bowl.castShadow = bowl.receiveShadow = true; g.add(bowl);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), c.mat('#bcd3dc', 'gloss'));
    water.rotation.x = -Math.PI / 2; water.scale.y = 1.3; water.position.set(0, 0.345, 0.03); g.add(water);
    const seat = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.024, 10, 40), white);
    seat.rotation.x = Math.PI / 2; seat.scale.set(1, 1.3, 0.5); seat.position.set(0, 0.425, 0.03); g.add(seat);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.452, -D / 2 + 0.19); g.add(hinge);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.018, 40), white);
    lid.scale.set(1, 1, 1.25); lid.position.set(0, 0.009, 0.03 - (-D / 2 + 0.19)); lid.castShadow = true; hinge.add(lid);
    toggle(c, g, e => (hinge.rotation.x = -(Math.PI / 2 - 0.12) * (1 - e)), 2.5);
  },
  // Washbasin: porcelain top with a sunken oval bowl, drain and tap; on a two-drawer cabinet (or a pedestal, cabinet: false)
  washbasin(p, g, c) {
    const { width: W, depth: D, height: H } = p, white = c.mat('#fbfbf9', 'gloss');
    if (p.cabinet !== false) {
      const m = c.mat(p.color || '#a07850', 'wood');
      c.box(g, -W / 2, 0.15, -D / 2, W / 2, H - 0.12, D / 2 - 0.039, m);
      baseModule(g, c, 'drawers2', -W / 2, W / 2, 0.15, H - 0.12, D / 2 - 0.02, m);
    } else c.cylinder(g, 0.08, 0.1, H - 0.12, 0, (H - 0.12) / 2, -0.05, white);
    const bw = Math.min(W - 0.14, 0.46), bd = Math.min(D - 0.14, 0.32), zb = 0.03;
    slab(g, c, -W / 2, -D / 2, W / 2, D / 2, H, 0.12, [{ x: 0, z: zb, w: bw, d: bd, ellipse: true }], white);
    const profile = [...Array(12)].map((_, i) => { const a = (i / 11) * Math.PI / 2; return new THREE.Vector2(Math.sin(a), -Math.cos(a)); });
    const basin = new THREE.Mesh(new THREE.LatheGeometry(profile, 40), white.clone()); basin.material.side = THREE.DoubleSide;
    basin.scale.set(bw / 2, 0.11, bd / 2); basin.position.set(0, H - 0.001, zb); basin.receiveShadow = true; g.add(basin);
    c.cylinder(g, 0.018, 0.018, 0.004, 0, H - 0.108, zb, c.mat('#9a9ea2', 'metal'), 20);          // drain
    tap(g, c, 0, H, -D / 2 + 0.05, 0.62, 0.13, 0, 0.1);
  },
  mirror(p, g, c) {
    c.box(g, -p.width / 2, 0, -0.02, p.width / 2, p.height, 0, c.mat('#c9c5bd', 'satin'));
    c.box(g, -p.width / 2 + 0.02, 0.02, 0, p.width / 2 - 0.02, p.height - 0.02, 0.002, c.mat('#ffffff', 'mirror'));
  },
  shower(p, g, c) {
    const { width: W, depth: D } = p;
    c.box(g, -W / 2, 0, -D / 2, W / 2, 0.05, D / 2, c.mat('#fbfbf9', 'gloss'));
    c.box(g, -W / 2, 0.05, D / 2 - 0.01, W / 2 - 0.55, 2.0, D / 2, c.mat('#dff0ff', 'glass'), { shadow: false });   // fixed screen; the entrance is on the other side
    const steel = c.mat('#c4c8cc', 'metal');
    c.cylinder(g, 0.012, 0.012, 1.2, W / 2 - 0.2, 1.4, -D / 2 + 0.05, steel);
    c.cylinder(g, 0.1, 0.1, 0.015, W / 2 - 0.2, 2.0, -D / 2 + 0.17, steel, 24);
  },
  bathtub(p, g, c) {
    const { width: W, depth: D } = p, b = c.mat('#fbfbf9', 'gloss'), t = 0.07, H = 0.56;
    c.box(g, -W / 2, 0, -D / 2, W / 2, 0.1, D / 2, b);
    c.rounded(g, -W / 2, 0, -D / 2, -W / 2 + t, H, D / 2, 0.02, b); c.rounded(g, W / 2 - t, 0, -D / 2, W / 2, H, D / 2, 0.02, b);
    c.rounded(g, -W / 2, 0, -D / 2, W / 2, H, -D / 2 + t, 0.02, b); c.rounded(g, -W / 2, 0, D / 2 - t, W / 2, H, D / 2, 0.02, b);
    c.box(g, -W / 2 + t, 0.1, -D / 2 + t, W / 2 - t, 0.32, D / 2 - t, c.mat('#cfe4ee', 'gloss'));   // water
    tap(g, c, -W / 2 + 0.035, H, 0, 0.75, 0.16, Math.PI / 2, H - 0.32);
  },
  plant(p, g, c) {
    const H = p.height;
    c.cylinder(g, p.width * 0.35, p.width * 0.28, 0.32, 0, 0.16, 0, c.mat('#b8694a', 'matte'), 24);
    const leaf = c.mat('#4f7a3a', 'matte'), random = seeded(Math.round(H * 100) + 11);
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(p.width * (0.22 + random() * 0.12), 1), leaf);
      s.position.set((random() - 0.5) * p.width * 0.6, 0.35 + (H - 0.45) * (0.3 + random() * 0.7), (random() - 0.5) * p.width * 0.6);
      s.castShadow = true; g.add(s);
    }
  },

  // Painting: `image` (path or URL) or `drawing` ('periodic-table', 'atom'); otherwise a canvas of the given colour
  painting(p, g, c) {
    const { width: W, height: H } = p;
    c.box(g, -W / 2 - 0.025, 0, -0.03, W / 2 + 0.025, H + 0.05, 0, c.mat(p.frame || '#1e1e1e', 'satin'));
    let m;
    if (p.image) { const t = new THREE.TextureLoader().load(p.image); t.colorSpace = THREE.SRGBColorSpace; m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }); }
    else if (DRAWINGS[p.drawing]) m = new THREE.MeshStandardMaterial({ map: c.drawnTexture(1024, Math.round(1024 * H / W), (gx, w, h) => DRAWINGS[p.drawing](gx, w, h, c)).texture, roughness: 0.6 });
    else m = c.mat(p.color || '#d9cdb5', 'matte');
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(W, H), m);
    canvas.position.set(0, 0.025 + H / 2, 0.001); g.add(canvas);
  },

  // Straight flight of stairs: rises from the front (+z) towards the back (−z)
  stairs(p, g, c) {
    const { width: W, depth: D, height: H, steps: n } = p, m = c.mat(p.color, 'satin'), h = H / n, d = D / n;
    for (let i = 0; i < n; i++) c.box(g, -W / 2, 0, D / 2 - (i + 1) * d, W / 2, (i + 1) * h, D / 2 - i * d, m);
  },
};

// Shared desk textures: a screen with code and a keyboard
let screenMat = null, keyboardMat = null, screenScrolling = false, waterMat = null;
function screenMaterial(c) {
  if (screenMat) return screenMat;
  const random = seeded(5), colors = ['#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#89ddff', '#eeffff'];
  const { texture } = c.drawnTexture(512, 290, (gx, w, h) => {
    gx.fillStyle = '#1e2030'; gx.fillRect(0, 0, w, h);
    gx.fillStyle = '#2a2d42'; gx.fillRect(0, 0, w, 18); gx.fillRect(0, 18, 34, h);
    for (let y = 30, indent = 0; y < h - 8; y += 13) {
      if (random() < 0.12) { indent = Math.max(0, indent - 1); continue; }
      let x = 44 + indent * 18;
      for (let k = 0; k < 1 + Math.floor(random() * 5) && x < w - 20; k++) { const l = 14 + random() * 60; gx.fillStyle = colors[Math.floor(random() * colors.length)]; gx.fillRect(x, y, l, 6); x += l + 7; }
      if (random() < 0.25) indent = Math.min(4, indent + 1);
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;                                         // so the code can scroll up
  screenMat = new THREE.MeshStandardMaterial({ map: texture, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: 0.55, roughness: 0.25 });
  return screenMat;
}
function keyboardMaterial(c) {
  if (keyboardMat) return keyboardMat;
  const { texture } = c.drawnTexture(420, 140, (gx, w, h) => {
    gx.fillStyle = '#cfcfcc'; gx.fillRect(0, 0, w, h);
    gx.fillStyle = '#f4f4f2';
    for (let r = 0; r < 5; r++) for (let k = 0; k < 14; k++) gx.fillRect(6 + k * 29 + (r % 2) * 6, 6 + r * 26, 24, 21);
  });
  keyboardMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 });
  return keyboardMat;
}

// Horizontal slab (worktops) with cut-outs: rectangles with rounded corners or ellipses.
//   cutouts: [{ x, z, w, d, r, ellipse }] (centre and size of each hole); the top face sits at height yTop
function slab(g, c, x1, z1, x2, z2, yTop, thickness, cutouts, material) {
  const shape = new THREE.Shape([new THREE.Vector2(x1, z1), new THREE.Vector2(x2, z1), new THREE.Vector2(x2, z2), new THREE.Vector2(x1, z2)]);
  for (const h of cutouts) {
    const path = new THREE.Path();
    if (h.ellipse) path.absellipse(h.x, h.z, h.w / 2, h.d / 2, 0, Math.PI * 2, true);
    else {
      const [a, b, e, f, r] = [h.x - h.w / 2, h.z - h.d / 2, h.x + h.w / 2, h.z + h.d / 2, h.r || 0.02];
      path.moveTo(a + r, b); path.lineTo(e - r, b); path.quadraticCurveTo(e, b, e, b + r); path.lineTo(e, f - r); path.quadraticCurveTo(e, f, e - r, f);
      path.lineTo(a + r, f); path.quadraticCurveTo(a, f, a, f - r); path.lineTo(a, b + r); path.quadraticCurveTo(a, b, a + r, b);
    }
    shape.holes.push(path);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 28 });
  geo.rotateX(Math.PI / 2);                                    // the shape goes to the floor plane and the thickness points down
  const m = new THREE.Mesh(geo, material); m.position.y = yTop; m.castShadow = m.receiveShadow = true; g.add(m);
  return m;
}
// Sink bowl under a cut-out: bottom, four walls and drain
function sinkBowl(g, c, x, z, w, d, yTop, depth, m) {
  const t = 0.006, y0 = yTop - depth;
  c.box(g, x - w / 2, y0, z - d / 2, x + w / 2, y0 + t, z + d / 2, m);
  c.box(g, x - w / 2, y0, z - d / 2, x - w / 2 + t, yTop - 0.001, z + d / 2, m); c.box(g, x + w / 2 - t, y0, z - d / 2, x + w / 2, yTop - 0.001, z + d / 2, m);
  c.box(g, x - w / 2, y0, z - d / 2, x + w / 2, yTop - 0.001, z - d / 2 + t, m); c.box(g, x - w / 2, y0, z + d / 2 - t, x + w / 2, yTop - 0.001, z + d / 2, m);
  c.cylinder(g, 0.04, 0.04, 0.004, x, y0 + t + 0.001, z, c.mat('#6d7275', 'metal'), 24);
  const grid = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.003, 4, 20), c.mat('#3a3d40', 'metal'));
  grid.rotation.x = Math.PI / 2; grid.position.set(x, y0 + t + 0.004, z); g.add(grid);
}
// Single-lever tap with a curved spout: k scales it, reach is how far the spout comes out, turn orients it (the spout
// points to +z) and drop is how far the water falls from the top to where it lands. Clicking it opens it: water,
// ripples and the sound of running water.
function tap(g, c, x, y, z, k = 1, reach = 0.22, turn = 0, drop = 0.2) {
  const group = new THREE.Group(); group.position.set(x, y, z); group.rotation.y = turn; g.add(group);
  const chrome = c.mat('#d7dadd', 'metal'), h = 0.3 * k;
  c.cylinder(group, 0.026 * k, 0.03 * k, 0.03 * k, 0, 0.015 * k, 0, chrome, 24);
  c.cylinder(group, 0.016 * k, 0.018 * k, h, 0, h / 2, 0, chrome, 20);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, h - 0.01, 0), new THREE.Vector3(0, h + 0.12 * k, reach * 0.45), new THREE.Vector3(0, h - 0.02 * k, reach));
  const spout = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.011 * k, 12), chrome); spout.castShadow = true; group.add(spout);
  c.cylinder(group, 0.014 * k, 0.012 * k, 0.03 * k, 0, h - 0.035 * k, reach, chrome, 16);           // aerator
  const axle = new THREE.Group(); axle.position.set(0, h * 0.55, 0); group.add(axle);
  c.box(axle, -0.008 * k, 0, -0.11 * k, 0.008 * k, 0.016 * k, 0, chrome).rotation.x = 0.35;        // lever
  const yA = h - 0.05 * k, length = yA + drop;
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006 * k, 0.009 * k, length, 14, 1, true), waterMaterial(c));
  stream.position.set(0, yA - length / 2, reach); stream.visible = false; group.add(stream);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.012, 0.018, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false }));
  ripple.rotation.x = -Math.PI / 2; ripple.position.set(0, -drop + 0.004, reach); ripple.visible = false; group.add(ripple);
  const sound = c.waterSound?.(); let open = false, t = 0;
  c.interactive(group, () => {
    open = !open; stream.visible = ripple.visible = open; axle.rotation.y = open ? 0.6 : 0;
    if (sound) open ? sound.start() : sound.stop();
  });
  c.animate(dt => {
    if (!open) return;
    t += dt; stream.material.map.offset.y += dt * 3;
    const f = (t * 2.5) % 1; ripple.scale.setScalar(1 + f * 3); ripple.material.opacity = 0.55 * (1 - f);
  });
}
// Water of the stream: white streaks moving over a translucent cylinder
function waterMaterial(c) {
  if (waterMat) return waterMat;
  const random = seeded(17), { texture } = c.drawnTexture(32, 256, (gx, w, h) => {
    for (let i = 0; i < 45; i++) { gx.fillStyle = `rgba(255,255,255,${0.35 + random() * 0.5})`; gx.fillRect(random() * w, random() * h, 2 + random() * 4, 12 + random() * 60); }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 1.5);
  waterMat = new THREE.MeshStandardMaterial({ color: '#d4ecff', map: texture, transparent: true, opacity: 0.72, roughness: 0.08, emissive: '#8fc4ff', emissiveIntensity: 0.25, depthWrite: false, side: THREE.DoubleSide });
  return waterMat;
}
// Switches between two states when `obj` is clicked: apply(e) gets the eased progress (0 to 1) on every frame
function toggle(c, obj, apply, speed = 2, initial = 0) {
  const state = { t: initial, target: initial }; apply(initial);
  c.interactive(obj, () => (state.target = 1 - state.target));
  c.animate(dt => {
    if (state.t === state.target) return;
    state.t = state.target > state.t ? Math.min(1, state.t + dt * speed) : Math.max(0, state.t - dt * speed);
    apply(state.t * state.t * (3 - 2 * state.t));
  });
  return state;
}
// Door or drawer front (with a 2.5 mm gap) and bar handle
const GAP = 0.0025;
function frontPanel(G, c, a, b, ya, yb, z, m) { return c.box(G, a + GAP, ya + GAP, z - 0.019, b - GAP, yb - GAP, z, m); }
function barHandle(G, c, cx, y, z, length) {
  const steel = c.mat('#9a9a98', 'metal');
  c.box(G, cx - length / 2, y, z + 0.014, cx + length / 2, y + 0.012, z + 0.026, steel, { shadow: false });
  for (const s of [-1, 1]) c.box(G, cx + s * (length / 2 - 0.012) - 0.005, y, z, cx + s * (length / 2 - 0.012) + 0.005, y + 0.012, z + 0.014, steel, { shadow: false });
}
// Drawer that slides out when clicked: front, handle (bar or knob) and a box with sides, bottom and back
function drawer(g, c, x0, x1, ya, yb, z, front, handleLength, depth, handle = 'bar') {
  const group = new THREE.Group(); g.add(group);
  frontPanel(group, c, x0, x1, ya, yb, z, front);
  if (handle === 'knob') c.box(group, (x0 + x1) / 2 - 0.05, (ya + yb) / 2, z, (x0 + x1) / 2 + 0.05, (ya + yb) / 2 + 0.015, z + 0.02, c.mat('#b08d57', 'metal'));
  else barHandle(group, c, (x0 + x1) / 2, yb - 0.06, z, handleLength);
  const m = c.mat('#ece8e0', 'satin'), zb = z - 0.019, a = x0 + 0.03, b = x1 - 0.03, ytop = Math.max(ya + 0.06, yb - 0.04);
  c.box(group, a, ya + 0.02, zb - depth, a + 0.012, ytop, zb, m, { shadow: false }); c.box(group, b - 0.012, ya + 0.02, zb - depth, b, ytop, zb, m, { shadow: false });
  c.box(group, a, ya + 0.02, zb - depth, b, ya + 0.032, zb, m, { shadow: false }); c.box(group, a, ya + 0.02, zb - depth, b, ytop, zb - depth + 0.012, m, { shadow: false });
  toggle(c, group, e => (group.position.z = e * depth * 0.7), 2.2);
}
// One base-unit module: door, two doors (sink), three-drawer unit (or two, 'drawers2') or oven.
// The drawers slide out when clicked and the oven switches on (orange light inside).
function baseModule(g, c, kind, x0, x1, y0, y1, z, front) {
  const w = x1 - x0, cx = (x0 + x1) / 2, handleLength = Math.min(0.32, w - 0.14), steel = c.mat('#9a9a98', 'metal');
  if (kind === 'drawers' || kind === 'drawers2') {
    const cuts = kind === 'drawers' ? [y0, y0 + (y1 - y0) * 0.4, y0 + (y1 - y0) * 0.72, y1] : [y0, (y0 + y1) / 2, y1];
    for (let i = 0; i + 1 < cuts.length; i++) drawer(g, c, x0, x1, cuts[i], cuts[i + 1], z, front, handleLength, 0.46);
  } else if (kind === 'oven') {
    const oven = new THREE.Group(); g.add(oven);
    frontPanel(oven, c, x0, x1, y1 - 0.12, y1, z, c.mat('#2c2e31', 'metal'));                        // control panel
    for (const dx of [-0.12, 0.12]) c.cylinder(oven, 0.018, 0.018, 0.02, cx + dx, y1 - 0.06, z + 0.01, steel, 16).rotation.x = Math.PI / 2;
    c.box(oven, cx - 0.05, y1 - 0.08, z, cx + 0.05, y1 - 0.04, z + 0.002, c.mat('#0e2a3a', 'light'), { shadow: false });   // clock
    frontPanel(oven, c, x0, x1, y0 + 0.1, y1 - 0.12, z, c.mat('#141517', 'gloss'));                 // black glass door
    const offGlass = c.mat('#26292d', 'gloss'), onGlass = new THREE.MeshStandardMaterial({ color: '#2a1206', emissive: '#ff8a2a', emissiveIntensity: 0.65, roughness: 0.15 });
    const ovenWindow = c.box(oven, x0 + 0.06, y0 + 0.2, z, x1 - 0.06, y1 - 0.26, z + 0.001, offGlass, { shadow: false });
    barHandle(oven, c, cx, y1 - 0.17, z, w - 0.12);
    const light = c.light(oven, cx, (y0 + y1) / 2, z + 0.2, '#ffb066', 0.6, 1.2); light.visible = false;
    let on = false;
    c.interactive(oven, () => { on = !on; ovenWindow.material = on ? onGlass : offGlass; light.visible = on; });
    drawer(g, c, x0, x1, y0, y0 + 0.1, z, front, handleLength, 0.4);                                 // drawer under the oven
  } else if (kind === 'sink' && w > 0.7) {
    frontPanel(g, c, x0, cx, y0, y1, z, front); frontPanel(g, c, cx, x1, y0, y1, z, front);
    for (const x of [cx - 0.05, cx + 0.05]) c.box(g, x - 0.006, y1 - 0.2, z + 0.014, x + 0.006, y1 - 0.06, z + 0.026, steel, { shadow: false });
  } else {
    frontPanel(g, c, x0, x1, y0, y1, z, front); barHandle(g, c, cx, y1 - 0.08, z, handleLength);
  }
}

// Row of doors on a cabinet: vertical gaps and one handle per door (at the top, or at the bottom for wall units)
function doorRow(g, c, W, y0, y1, z, moduleWidth = 0.6, handle = 'top') {
  const n = Math.max(1, Math.round(W / moduleWidth)), w = W / n, gap = c.mat('#2a2a28'), steel = c.mat('#9a9a98', 'metal');
  for (let i = 0; i < n; i++) {
    const x0 = -W / 2 + i * w;
    if (i) c.box(g, x0 - 0.0015, y0 + 0.005, z, x0 + 0.0015, y1 - 0.005, z + 0.002, gap, { shadow: false });
    const hy = handle === 'bottom' ? y0 + 0.06 : y1 - 0.08;
    c.box(g, x0 + w / 2 - 0.08, hy, z, x0 + w / 2 + 0.08, hy + 0.012, z + 0.025, steel, { shadow: false });
  }
}

// Drawings for paintings, made on the spot (no third-party images)
const DRAWINGS = {
  'periodic-table'(gx, w, h, c) {
    gx.fillStyle = '#f4efe2'; gx.fillRect(0, 0, w, h);
    const rows = [
      ['H', ...Array(16).fill(null), 'He'],
      ['Li', 'Be', ...Array(10).fill(null), 'B', 'C', 'N', 'O', 'F', 'Ne'],
      ['Na', 'Mg', ...Array(10).fill(null), 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
      'K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr'.split(' '),
      'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe'.split(' '),
      'Cs Ba La Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn'.split(' '),
      'Fr Ra Ac Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' '),
    ];
    const cw = (w - 40) / 18, ch = (h - 90) / 7;
    gx.fillStyle = '#1b1b1b'; gx.font = `bold ${ch * 0.42}px system-ui`; gx.textAlign = 'center';
    gx.fillText(c.t('periodicTable'), w / 2, 50);
    let z = 0;
    rows.forEach((row, r) => row.forEach((s, col) => {
      if (!s) return;
      z = s === 'La' ? 57 : s === 'Hf' ? 72 : s === 'Ac' ? 89 : s === 'Rf' ? 104 : z + 1;
      const x = 20 + col * cw, y = 70 + r * ch;
      gx.fillStyle = col < 2 ? '#f2b8a0' : col < 12 ? '#f6d98b' : col === 17 ? '#b8d4f0' : '#bfe0b0';
      if (s === 'H') gx.fillStyle = '#e8e8e8';
      gx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
      gx.fillStyle = '#1b1b1b'; gx.font = `bold ${ch * 0.38}px system-ui`; gx.fillText(s, x + cw / 2, y + ch * 0.68);
      gx.font = `${ch * 0.2}px system-ui`; gx.fillText(String(z), x + cw / 2, y + ch * 0.28);
    }));
  },
  atom(gx, w, h) {
    gx.fillStyle = '#10213d'; gx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.38;
    gx.strokeStyle = '#7fd3ff'; gx.lineWidth = w * 0.006;
    for (let i = 0; i < 3; i++) { gx.beginPath(); gx.ellipse(cx, cy, r, r * 0.32, i * Math.PI / 3, 0, Math.PI * 2); gx.stroke(); }
    gx.fillStyle = '#ff9f43'; gx.beginPath(); gx.arc(cx, cy, r * 0.12, 0, Math.PI * 2); gx.fill();
    gx.fillStyle = '#e8f7ff';
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3, t = 0.9 + i;
      const x = cx + Math.cos(t) * r * Math.cos(a) - Math.sin(t) * r * 0.32 * Math.sin(a);
      const y = cy + Math.cos(t) * r * Math.sin(a) + Math.sin(t) * r * 0.32 * Math.cos(a);
      gx.beginPath(); gx.arc(x, y, r * 0.05, 0, Math.PI * 2); gx.fill();
    }
  },
};
