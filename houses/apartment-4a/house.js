// ---------- Example house: apartment 4A ----------
// Fan homage inspired by Sheldon and Leonard's apartment in the TV series The Big Bang Theory. The layout and the
// measurements are approximate and made up for the example: they do not reproduce any official plans of the set.
// Full format in docs/FORMAT.md. Measurements in metres; x grows towards the east and y towards the south, as on a drawing.
// Texts are bilingual ({ en, es }); a plain string is fine too if the house only needs one language.
//
//   y=0    ┌──────────────── 4th-floor landing (elevator, door 4B) ────────────────┐
//   y=1.85 ├── living room (desks by the west window, sofa, whiteboards) ─┬ kitchen ┤
//   y=5.0  │                                                              ├ hall ┬ bathroom
//   y=6.6  └──────────────┬ Sheldon's bedroom ┤        ├ Leonard's bedroom
//   y=11                  └───────────────────┴────────┴───────────────────┘

export default {
  name: { en: 'Apartment 4A', es: 'Apartamento 4A' },
  description: {
    en: 'Example house: a homage inspired by The Big Bang Theory (approximate measurements)',
    es: 'Casa de ejemplo: homenaje inspirado en la serie The Big Bang Theory (medidas aproximadas)',
  },
  credits: {
    en: 'Fan example inspired by The Big Bang Theory, a trademark and work of its owners; layout and measurements are made up.',
    es: 'Ejemplo de fan inspirado en The Big Bang Theory, marca y obra de sus titulares; distribución y medidas inventadas.',
  },
  ceilingHeight: 2.7,
  sun: [-0.7, 0.6],                                    // where the sun comes from: west and a little south
  walk: { start: [5.85, 0.9], lookAt: [5.85, 3] },     // the walk starts on the landing, facing door 4A

  // Walls: rectangles [x1, y1, x2, y2]. Outer walls 25 cm, partitions 10 cm. Doors and windows cut them on their own.
  walls: [
    [0, -0.25, 10.25, 0], [0, -0.25, 0.25, 1.6], [10, -0.25, 10.25, 1.6],   // landing
    [0, 1.6, 10.25, 1.85],                         // landing ↔ apartment (with door 4A)
    [0, 1.85, 0.25, 6.85],                         // west front of the living room (large window)
    [0, 6.6, 3.5, 6.85],                           // south front of the living room
    [3.25, 6.6, 3.5, 11.25],                       // west front of Sheldon's bedroom
    [3.25, 11, 10.25, 11.25],                      // south front
    [10, 1.85, 10.25, 11],                         // east front
    [3.5, 6.6, 6.75, 6.7],                         // living room ↔ Sheldon's bedroom
    [6.75, 6.6, 6.85, 11],                         // Sheldon's bedroom ↔ hall
    [7.75, 5, 7.85, 11],                           // hall ↔ bathroom and Leonard's bedroom
    [7.85, 5, 10, 5.1],                            // kitchen ↔ bathroom
    [7.85, 7.4, 10, 7.5],                          // bathroom ↔ Leonard's bedroom
  ],

  // Doors: the opening covers the whole thickness of the wall. opensTo: where the leaf swings; hinges: which end of the opening
  doors: [
    { opening: [5.4, 1.6, 6.3, 1.85], type: 'swing', opensTo: 'south', hinges: 'east', color: '#6b4a33', label: '4A' },
    { opening: [5.4, -0.25, 6.3, 0], type: 'swing', opensTo: 'north', hinges: 'west', color: '#6b4a33', label: '4B' },
    { opening: [6.75, 7.4, 6.85, 8.2], type: 'swing', opensTo: 'west', hinges: 'south' },      // Sheldon's bedroom
    { opening: [7.75, 5.55, 7.85, 6.3], type: 'swing', opensTo: 'east', hinges: 'north' },     // bathroom
    { opening: [7.75, 8, 7.85, 8.8], type: 'swing', opensTo: 'east', hinges: 'south' },        // Leonard's bedroom
  ],
  windows: [
    { opening: [0, 2.4, 0.25, 5.4], sill: 0.55, height: 1.75 },     // living room window, behind the desks
    { opening: [10, 2.7, 10.25, 3.8], sill: 1.05, height: 1.05 },   // kitchen
    { opening: [10, 5.75, 10.25, 6.45], sill: 1.5, height: 0.6 },   // bathroom
    { opening: [3.25, 8.2, 3.5, 9.6], sill: 0.9, height: 1.3 },     // Sheldon
    { opening: [8.3, 11, 9.5, 11.25], sill: 0.9, height: 1.3 },     // Leonard
  ],

  // Rooms: interior polygon (wall face to wall face), floor and card text
  rooms: [
    { id: 'landing', name: { en: 'Landing (4th floor)', es: 'Rellano (4.º piso)' }, polygon: [[0.25, 0], [10, 0], [10, 1.6], [0.25, 1.6]], floor: 'terrazzo',
      text: { en: 'Landing shared with 4B, across the hall. The elevator has been broken for so long that everyone takes the stairs.',
              es: 'Rellano compartido con el 4B, enfrente. El ascensor lleva tanto tiempo estropeado que todo el mundo sube por la escalera.' } },
    { id: 'living', name: { en: 'Living room', es: 'Salón' }, polygon: [[0.25, 1.85], [6.75, 1.85], [6.75, 6.6], [0.25, 6.6]], floor: 'wood', floorColor: '#9b6b43',
      text: { en: 'Living room open to the kitchen: sofa facing the TV, two desks by the window, whiteboards full of equations and a bookshelf by the entrance.',
              es: 'Salón abierto a la cocina: sofá frente a la tele, dos escritorios junto al ventanal, pizarras llenas de ecuaciones y una estantería junto a la entrada.' } },
    { id: 'kitchen', name: { en: 'Kitchen', es: 'Cocina' }, polygon: [[6.75, 1.85], [10, 1.85], [10, 5], [6.75, 5]], floor: 'tile', floorColor: '#d8d0c0',
      text: { en: 'L-shaped kitchen with a breakfast bar towards the living room and three stools. Click the fridge to open it.',
              es: 'Cocina en L con barra de desayuno hacia el salón y tres taburetes. Pulsa la nevera para abrirla.' } },
    { id: 'hall', name: { en: 'Hall', es: 'Pasillo' }, polygon: [[6.75, 5], [7.75, 5], [7.75, 11], [6.85, 11], [6.85, 6.6], [6.75, 6.6]], floor: 'wood', floorColor: '#9b6b43',
      text: { en: 'Hall to the bedrooms and the bathroom, with a wardrobe at the end.',
              es: 'Pasillo a los dormitorios y al baño, con un armario al fondo.' } },
    { id: 'bathroom', name: { en: 'Bathroom', es: 'Baño' }, polygon: [[7.85, 5.1], [10, 5.1], [10, 7.4], [7.85, 7.4]], floor: 'tile', floorColor: '#e6e6e2',
      text: { en: 'Bathroom with a bathtub, a toilet under the window and a washbasin with a mirror.',
              es: 'Baño con bañera, inodoro bajo la ventana y lavabo con espejo.' } },
    { id: 'sheldon', name: { en: "Sheldon's bedroom", es: 'Dormitorio de Sheldon' }, polygon: [[3.5, 6.7], [6.75, 6.7], [6.75, 11], [3.5, 11]], floor: 'wood', floorColor: '#9b6b43',
      text: { en: 'A bedroom tidy to the millimetre: bed with an atom above it, wardrobe and a bookshelf by the window.',
              es: 'Dormitorio ordenado al milímetro: cama con un átomo encima, armario y estantería junto a la ventana.' } },
    { id: 'leonard', name: { en: "Leonard's bedroom", es: 'Dormitorio de Leonard' }, polygon: [[7.85, 7.5], [10, 7.5], [10, 11], [7.85, 11]], floor: 'wood', floorColor: '#9b6b43',
      text: { en: 'Bedroom with a double bed, a nightstand and a wardrobe.',
              es: 'Dormitorio con cama de matrimonio, mesilla y armario.' } },
  ],

  // Furniture: a type from engine/pieces.js (or from `pieces`, below), centre (x, y), where its front faces and its sizes
  furniture: [
    // Living room
    { type: 'rug', x: 3.3, y: 4.75, width: 2.8, depth: 2.0, color: '#8f7656' },
    { type: 'sofa', x: 3.3, y: 3.95, facing: 'south', width: 2.2, color: '#6a4a3a', label: { en: "Sheldon's spot", es: 'El sitio de Sheldon' }, labelX: -0.72,
      name: { en: 'Sofa', es: 'Sofá' },
      text: { en: 'The cushion on the left end, seen from the TV, is Sheldon\'s spot: the (0, 0, 0, 0) point of his coordinate system.',
              es: 'El cojín del extremo izquierdo, visto desde la tele, es el sitio de Sheldon: el punto (0, 0, 0, 0) de su sistema de coordenadas.' } },
    { type: 'armchair', x: 5.25, y: 4.85, facing: 'west', color: '#5a5048' },
    { type: 'coffeeTable', x: 3.3, y: 5.05, width: 1.1, depth: 0.55, color: '#5b3d26' },
    { type: 'sideboard', x: 3.3, y: 6.37, facing: 'north', width: 1.8, color: '#4a3426' },
    { type: 'tv', x: 3.3, y: 6.42, facing: 'north', elevation: 0.5, width: 1.25, name: { en: 'TV', es: 'Tele' },
      text: { en: 'Click the screen to switch it on.', es: 'Pulsa la pantalla para encenderla.' } },
    { type: 'desk', x: 0.6, y: 2.95, facing: 'east', width: 1.3, color: '#6b4a33', screens: 2, tower: true, name: { en: "Leonard's desk", es: 'Escritorio de Leonard' } },
    { type: 'desk', x: 0.6, y: 4.6, facing: 'east', width: 1.3, color: '#6b4a33', screens: 1, name: { en: "Sheldon's desk", es: 'Escritorio de Sheldon' } },
    { type: 'chair', x: 1.25, y: 2.95, facing: 'west' },
    { type: 'chair', x: 1.25, y: 4.6, facing: 'west' },
    { type: 'whiteboard', x: 2.2, y: 2.15, facing: 'south', lines: ['E = mc²', 'iħ ∂ψ/∂t = Ĥψ', 'S = k·ln W', 'Δx·Δp ≥ ħ/2'] },
    { type: 'whiteboard', x: 3.85, y: 2.15, facing: 'south',
      lines: { en: ['∮ B·dl = μ₀I', 'L = ∫ (T − V) dt', 'G_μν + Λg_μν = 8πG T_μν', 'strings or loops?'],
               es: ['∮ B·dl = μ₀I', 'L = ∫ (T − V) dt', 'G_μν + Λg_μν = 8πG T_μν', '¿cuerdas o lazos?'] } },
    { type: 'bookshelf', x: 4.9, y: 2.0, facing: 'south', width: 0.8, height: 2.0, color: '#4a3426', finish: 'wood' },
    { type: 'lamp', x: 0.6, y: 6.2 },
    { type: 'painting', x: 1.6, y: 6.57, facing: 'north', width: 1.2, height: 0.75, drawing: 'periodic-table', name: { en: 'Periodic table', es: 'Tabla periódica' } },
    { type: 'plant', x: 6.35, y: 6.25, height: 1.2 },
    // Kitchen
    { type: 'counter', x: 8.425, y: 2.16, facing: 'south', width: 3.15, sink: 0.6, hob: -0.75, color: '#efe9dd', topColor: '#4a4844' },
    { type: 'counter', x: 9.69, y: 3.335, facing: 'west', width: 1.73, color: '#efe9dd', topColor: '#4a4844' },
    { type: 'wallCabinet', x: 8.0, y: 2.025, facing: 'south', width: 2.0, color: '#efe9dd' },
    { type: 'fridge', x: 9.66, y: 4.6, facing: 'west', name: { en: 'Fridge', es: 'Nevera' } },
    { type: 'bar', x: 7.25, y: 3.55, facing: 'west', width: 1.9, color: '#efe9dd', topColor: '#4a4844' },
    { type: 'stool', x: 6.75, y: 2.95 }, { type: 'stool', x: 6.75, y: 3.55 }, { type: 'stool', x: 6.75, y: 4.15 },
    // Bathroom
    { type: 'washbasin', x: 8.95, y: 5.33, facing: 'south', color: '#d9d3c7' },
    { type: 'mirror', x: 8.95, y: 5.12, facing: 'south' },
    { type: 'toilet', x: 9.67, y: 6.0, facing: 'west' },
    { type: 'bathtub', x: 9.2, y: 7.05, facing: 'north' },
    // Sheldon's bedroom
    { type: 'bed', x: 5.1, y: 9.93, facing: 'north', color: '#3e5c8a', headboard: '#4a3426' },
    { type: 'nightstand', x: 4.12, y: 10.8, facing: 'north' }, { type: 'nightstand', x: 6.08, y: 10.8, facing: 'north', lamp: false },
    { type: 'wardrobe', x: 4.6, y: 7.0, facing: 'south', width: 2.0, color: '#e7e1d6' },
    { type: 'bookshelf', x: 3.65, y: 10.2, facing: 'east', width: 0.9, height: 1.8 },
    { type: 'painting', x: 5.1, y: 10.97, facing: 'north', width: 1.0, height: 0.7, elevation: 1.25, drawing: 'atom' },
    { type: 'rug', x: 5.1, y: 8.6, width: 1.6, depth: 1.0, color: '#7a6d5c' },
    // Leonard's bedroom
    { type: 'bed', x: 8.93, y: 10.1, facing: 'west', color: '#8c6b4f' },
    { type: 'nightstand', x: 9.8, y: 9.17, facing: 'west' },
    { type: 'wardrobe', x: 9.4, y: 7.8, facing: 'south', width: 1.1, doors: 2 },
    // Hall and landing
    { type: 'wardrobe', x: 7.3, y: 10.8, facing: 'north', width: 0.85, depth: 0.4, doors: 1 },
    { type: 'elevator', x: 1.8, y: 0.03, facing: 'south', height: 2.3, name: { en: 'Elevator', es: 'Ascensor' },
      text: { en: 'Out of order for years.', es: 'Fuera de servicio desde hace años.' } },
    { type: 'stairs', x: 9.25, y: 0.7, facing: 'west', width: 1.2, depth: 1.5, height: 1.35, steps: 8 },
  ],

  // This house's own pieces: same rules as the ones in engine/pieces.js
  pieces: {
    elevator(p, g, c) {
      const steel = c.mat('#b9bec3', 'metal'), frame = c.mat('#8d9297', 'metal');
      c.box(g, -0.65, 0, -0.05, 0.65, 2.3, 0, frame);
      c.box(g, -0.5, 0, 0, -0.004, 2.1, 0.02, steel); c.box(g, 0.004, 0, 0, 0.5, 2.1, 0.02, steel);
      c.box(g, 0.56, 1.0, 0, 0.62, 1.25, 0.015, frame);                                          // button panel
      const [line1, line2] = c.tr({ en: ['OUT OF', 'ORDER'], es: ['FUERA DE', 'SERVICIO'] });
      const { texture } = c.drawnTexture(512, 170, (gx, w, h) => {
        gx.fillStyle = '#fff8d6'; gx.fillRect(0, 0, w, h);
        gx.strokeStyle = '#c0392b'; gx.lineWidth = 10; gx.strokeRect(6, 6, w - 12, h - 12);
        gx.fillStyle = '#c0392b'; gx.font = 'bold 58px system-ui'; gx.textAlign = 'center';
        gx.fillText(line1, w / 2, 74); gx.fillText(line2, w / 2, 140);
      });
      const sign = new c.THREE.Mesh(new c.THREE.PlaneGeometry(0.42, 0.14), new c.THREE.MeshStandardMaterial({ map: texture }));
      sign.position.set(0, 1.45, 0.025); g.add(sign);
    },
  },
};
