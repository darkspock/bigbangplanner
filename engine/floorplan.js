// ---------- Plan: scaled 2D floor plan for measuring ----------
// Drawn as SVG: walls cut 1 m above the floor, windows and glazing, doors with their swing (sliding doors with an arrow
// towards where they slide) and, in every room, its interior dimensions from wall face to wall face, measured on the
// model's geometry (not on the room polygon).
// The drawing works in units of 1/78.73 m (the engine multiplies metres by K before calling planSVG).
export const K = 78.73;

const r1 = v => Math.round(v * 10) / 10;

// Intervals [a, b] where the line y = v (or x = v if vertical) is inside the polygon
function scan(poly, v, vertical) {
  const xs = [];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    const [pa, pb, qa, qb] = vertical ? [p[1], p[0], q[1], q[0]] : [p[0], p[1], q[0], q[1]];
    if ((pb <= v && qb > v) || (qb <= v && pb > v)) xs.push(pa + (v - pb) * (qa - pa) / (qb - pb));
  });
  xs.sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
  return out;
}

// walls [{ x1, y1, x2, y2, low }] · windows, glass, glassDoors [[x1, y1, x2, y2]]
// doors [{ rect: [x1, y1, x2, y2], type: 'swing' | 'sliding', side: ±1, hingeAtEnd }] · rooms [{ name, poly, area, outdoor }]
// num(value, digits): number formatter for the current language
export function planSVG({ walls, windows, glass, glassDoors, doors, rooms, num }) {
  const rect = ([x1, y1, x2, y2]) => ({ x1: Math.min(x1, x2), y1: Math.min(y1, y2), x2: Math.max(x1, x2), y2: Math.max(y1, y2) });
  // What stops a dimension line: walls, windows, glass and door openings (it is measured up to the wall plane)
  const blockers = [...walls, ...[...windows, ...glass, ...glassDoors, ...doors.map(d => d.rect)].map(rect)];
  const inside = (x, y) => blockers.some(b => x > b.x1 && x < b.x2 && y > b.y1 && y < b.y2);
  // First obstacle from (x, y) in one direction: returns the coordinate of its face
  const hit = (x, y, axis, dir) => {
    let best = null;
    for (const b of blockers) {
      const [lo, hi, a0, a1, p] = axis === 'x' ? [b.y1, b.y2, b.x1, b.x2, x] : [b.x1, b.x2, b.y1, b.y2, y];
      const q = axis === 'x' ? y : x;
      if (q < lo || q > hi) continue;
      if (dir > 0 && a0 >= p - 0.01 && (best === null || a0 < best)) best = a0;
      if (dir < 0 && a1 <= p + 0.01 && (best === null || a1 > best)) best = a1;
    }
    return best;
  };

  const svg = [];
  const minX = Math.min(...walls.map(w => w.x1)), maxX = Math.max(...walls.map(w => w.x2));
  const minY = Math.min(...walls.map(w => w.y1)), maxY = Math.max(...walls.map(w => w.y2));

  // Rooms: soft background (outdoor areas in very light green)
  for (const r of rooms) {
    svg.push(`<polygon points="${r.poly.map(p => p.join(',')).join(' ')}" fill="${r.outdoor ? '#eef3ea' : '#fbfaf6'}" />`);
  }
  // Cut walls (low ones in a lighter grey)
  for (const w of walls) {
    svg.push(`<rect x="${r1(w.x1)}" y="${r1(w.y1)}" width="${r1(w.x2 - w.x1)}" height="${r1(w.y2 - w.y1)}" fill="${w.low ? '#8a8f86' : '#33352f'}" />`);
  }
  // Windows: opening outlined in the wall with the glass in the middle
  const glassLine = (b, cls) => {
    const { x1, y1, x2, y2 } = rect(b), along = x2 - x1 >= y2 - y1;
    return along ? `<line class="${cls}" x1="${x1}" y1="${(y1 + y2) / 2}" x2="${x2}" y2="${(y1 + y2) / 2}" />`
      : `<line class="${cls}" x1="${(x1 + x2) / 2}" y1="${y1}" x2="${(x1 + x2) / 2}" y2="${y2}" />`;
  };
  for (const w of windows) {
    const { x1, y1, x2, y2 } = rect(w);
    svg.push(`<rect class="win" x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" />`, glassLine(w, 'glass'));
  }
  for (const g of glass) svg.push(glassLine(g, 'glass'));
  for (const g of glassDoors) {
    const { x1, y1, x2, y2 } = rect(g);
    svg.push(`<rect class="win" x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" />`, glassLine(g, 'glass thick'));
  }
  // Doors: swing doors with the leaf open at 90° and its arc; sliding doors with the leaf and an arrow
  for (const { rect: [x1, y1, x2, y2], type, side, hingeAtEnd = false } of doors) {
    const alongZ = x2 - x1 < y2 - y1, mid = alongZ ? (x1 + x2) / 2 : (y1 + y2) / 2;
    const [s0, s1] = alongZ ? [y1, y2] : [x1, x2], L = s1 - s0;
    const P = (a, n) => (alongZ ? [mid + n, a] : [a, mid + n]);          // a: along the wall, n: across it
    svg.push(`<rect class="opening" x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" />`);
    if (type === 'sliding') {
      const [a0, b0] = P(s0, 0), [a1, b1] = P(s1, 0), [c0, d0] = P((s0 + s1) / 2, 0), [c1, d1] = P((s0 + s1) / 2 + side * L * 0.45, 0);
      svg.push(`<line class="leaf" x1="${a0}" y1="${b0}" x2="${a1}" y2="${b1}" />`,
        `<line class="arrow" x1="${c0}" y1="${d0}" x2="${c1}" y2="${d1}" marker-end="url(#arr)" />`);
    } else {
      const h = hingeAtEnd ? s1 : s0, toFree = hingeAtEnd ? -1 : 1;
      const H = P(h, 0), O = P(h, side * L), C = P(h + toFree * L, 0);
      const cross = (C[0] - H[0]) * (O[1] - H[1]) - (C[1] - H[1]) * (O[0] - H[0]);
      svg.push(`<line class="leaf" x1="${H[0]}" y1="${H[1]}" x2="${O[0]}" y2="${O[1]}" />`,
        `<path class="swing" d="M${C[0]} ${C[1]} A${L} ${L} 0 0 ${cross > 0 ? 1 : 0} ${O[0]} ${O[1]}" />`);
    }
  }
  // Interior dimensions: in each band of the room polygon, wall to wall (if there is no wall, up to the edge of the room
  // and marked «≈», because it opens onto another); repeated ones are dropped
  const dims = [], seen = [];
  const addDim = (axis, a, b, at, open) => {
    if (b - a < 15) return;
    if (seen.some(s => s.axis === axis && Math.abs(s.a - a) < 2 && Math.abs(s.b - b) < 2 && Math.abs(s.at - at) < 60)) return;
    seen.push({ axis, a, b, at });
    dims.push({ axis, a, b, at, open });
  };
  for (const r of rooms) {
    for (const vertical of [false, true]) {
      const ks = [...new Set(r.poly.map(p => (vertical ? p[0] : p[1])))].sort((a, b) => a - b);
      for (let i = 0; i + 1 < ks.length; i++) {
        if (ks[i + 1] - ks[i] < 12) continue;
        const v = ks[i] + 0.35 * (ks[i + 1] - ks[i]);                  // off-centre, where the name does not go
        for (const [lo, hi] of scan(r.poly, v, vertical)) {
          if (hi - lo < 12) continue;
          const m = (lo + hi) / 2, [x, y] = vertical ? [v, m] : [m, v];
          if (inside(x, y)) continue;
          const axis = vertical ? 'y' : 'x';
          let a = hit(x, y, axis, -1), b = hit(x, y, axis, 1), open = false;
          if (a === null || a < lo - 25) { a = lo; open = true; }
          if (b === null || b > hi + 25) { b = hi; open = true; }
          addDim(axis, a, b, v, open);
        }
      }
    }
  }
  // Names and areas, in the middle of each room's widest band (before the dimensions, which go on top)
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  for (const r of rooms) {
    const ys = [...new Set(r.poly.map(p => p[1]))].sort((a, b) => a - b);
    let best = null;
    for (let i = 0; i + 1 < ys.length; i++) {
      const y = (ys[i] + ys[i + 1]) / 2, h = ys[i + 1] - ys[i];
      for (const [lo, hi] of scan(r.poly, y, false)) if (!best || (hi - lo) * h > best.s) best = { s: (hi - lo) * h, x: (lo + hi) / 2, y };
    }
    if (!best) continue;
    svg.push(`<text class="room" x="${best.x}" y="${best.y - 1}">${esc(r.name)}</text>`,
      `<text class="area" x="${best.x}" y="${best.y + 8}">≈ ${num(r.area || 0, 1)} m²</text>`);
  }
  for (const d of dims) {
    const t = 3, label = (d.open ? '≈ ' : '') + num((d.b - d.a) / K, 2);
    if (d.axis === 'x') {
      svg.push(`<line class="dim" x1="${d.a}" y1="${d.at}" x2="${d.b}" y2="${d.at}" />`,
        `<line class="tick" x1="${d.a - t}" y1="${d.at + t}" x2="${d.a + t}" y2="${d.at - t}" />`,
        `<line class="tick" x1="${d.b - t}" y1="${d.at + t}" x2="${d.b + t}" y2="${d.at - t}" />`,
        `<text class="dimt" x="${(d.a + d.b) / 2}" y="${d.at - 2.5}">${label}</text>`);
    } else {
      const cx = d.at, cy = (d.a + d.b) / 2;
      svg.push(`<line class="dim" x1="${d.at}" y1="${d.a}" x2="${d.at}" y2="${d.b}" />`,
        `<line class="tick" x1="${d.at - t}" y1="${d.a + t}" x2="${d.at + t}" y2="${d.a - t}" />`,
        `<line class="tick" x1="${d.at - t}" y1="${d.b + t}" x2="${d.at + t}" y2="${d.b - t}" />`,
        `<text class="dimt" x="${cx - 2.5}" y="${cy}" transform="rotate(-90 ${cx - 2.5} ${cy})">${label}</text>`);
    }
  }
  // 1 m scale bar
  const sx = minX, sy = maxY + 22;
  svg.push(`<line class="scale" x1="${sx}" y1="${sy}" x2="${sx + K}" y2="${sy}" />`,
    `<line class="tick" x1="${sx}" y1="${sy - 4}" x2="${sx}" y2="${sy + 4}" />`, `<line class="tick" x1="${sx + K}" y1="${sy - 4}" x2="${sx + K}" y2="${sy + 4}" />`,
    `<text class="dimt" x="${sx + K / 2}" y="${sy - 4}">1 m</text>`);

  const pad = 30, vb = [minX - pad, minY - pad, maxX - minX + 2 * pad, maxY - minY + 2 * pad + 30];
  const defs = `<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="#c2410c" /></marker>
    <style>
      .win { fill: #fff; stroke: #33352f; stroke-width: 0.6; }
      .glass { stroke: #2b7bd6; stroke-width: 0.9; } .glass.thick { stroke-width: 1.4; }
      .opening { fill: #fff; }
      .leaf { stroke: #c2410c; stroke-width: 1.4; } .swing { fill: none; stroke: #c2410c; stroke-width: 0.6; stroke-dasharray: 3 2; }
      .arrow { stroke: #c2410c; stroke-width: 0.9; }
      .dim { stroke: #555; stroke-width: 0.45; } .tick { stroke: #555; stroke-width: 0.6; } .scale { stroke: #222; stroke-width: 1.2; }
      .dimt { font: 600 6.6px system-ui, sans-serif; fill: #1d4ed8; text-anchor: middle; paint-order: stroke; stroke: #fff; stroke-width: 2.4px; }
      .room { font: 700 8px system-ui, sans-serif; fill: #222; text-anchor: middle; paint-order: stroke; stroke: #fbfaf6; stroke-width: 3px; }
      .area { font: 400 6.5px system-ui, sans-serif; fill: #555; text-anchor: middle; paint-order: stroke; stroke: #fbfaf6; stroke-width: 3px; }
    </style></defs>`;
  return { markup: defs + svg.join(''), viewBox: vb };
}

// Zoom with the wheel or by pinching and pan by dragging, by changing the SVG viewBox
export function panZoom(svg, vb0) {
  vb0 = [...vb0]; let vb = [...vb0];
  const set = () => svg.setAttribute('viewBox', vb.map(v => v.toFixed(2)).join(' '));
  const toPlan = (cx, cy) => {
    const r = svg.getBoundingClientRect(), s = Math.max(vb[2] / r.width, vb[3] / r.height);   // preserveAspectRatio: meet
    const ox = (r.width - vb[2] / s) / 2, oy = (r.height - vb[3] / s) / 2;
    return [vb[0] + (cx - r.left - ox) * s, vb[1] + (cy - r.top - oy) * s, s];
  };
  const zoom = (f, cx, cy) => {
    const [px, py] = toPlan(cx, cy);
    const w = Math.min(Math.max(vb[2] * f, 60), vb0[2] * 3), k = w / vb[2];
    vb = [px - (px - vb[0]) * k, py - (py - vb[1]) * k, vb[2] * k, vb[3] * k]; set();
  };
  svg.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
  const pts = new Map(); let pinch = 0;
  svg.addEventListener('pointerdown', e => { svg.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); });
  svg.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch) zoom(pinch / d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      pinch = d; return;
    }
    const s = toPlan(0, 0)[2];
    vb[0] -= (e.clientX - prev[0]) * s; vb[1] -= (e.clientY - prev[1]) * s; set();
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  return { reset(v) { if (v) vb0 = [...v]; vb = [...vb0]; set(); }, zoom };
}
