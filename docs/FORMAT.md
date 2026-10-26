# House format

Each house is a file `houses/<name>/house.js` that exports an object. It is the only thing to write for a new house: the engine (`engine/`) is not touched. The example house, `houses/apartment-4a/house.js`, uses almost everything described here.

## Coordinates

- Everything is in **metres**.
- In plan, **x grows towards the east** and **y towards the south**, as on a drawing with north at the top. The origin (0, 0) goes wherever is convenient; the outer north-west corner of the home is usually easiest.
- Heights are in metres too, from the floor of each room.
- The compass points (`north`, `south`, `east`, `west`) refer to that drawing, even if the real house faces another way.

## Languages

The interface comes in English and Spanish. It follows the browser's language (Spanish for any `es-*` locale, English otherwise); `?lang=en` or `?lang=es` forces one, and the flags in the panel switch it.

**Every text field of a house** (`name`, `description`, `credits`, room `name` and `text`, furniture `name`, `text` and `label`, door `label`, whiteboard `lines`) can be a plain value or one value per language:

```js
name: 'Calle Mayor flat',                                // the same in both languages
name: { en: 'Living room', es: 'Salón' },                // one per language
lines: { en: ['strings or loops?'], es: ['¿cuerdas o lazos?'] },
```

If a language is missing, the other one is used. Custom pieces translate their own texts with `c.tr(value)`.

## General fields

```js
export default {
  name: 'Calle Mayor flat',
  description: '2026 renovation',          // panel subtitle
  credits: '',                             // extra text at the foot of the panel
  ceilingHeight: 2.6,                      // default wall height
  doorHeight: 2.03,                        // default door height
  sun: [-0.7, 0.6],                        // where the sun comes from, in plan (x, y); south-west by default
  walk: { start: [x, y], lookAt: [x, y] }, // where the walk starts and which way it looks
  walls: [...], doors: [...], windows: [...], rooms: [...], furniture: [...],
  pieces: { ... },                         // this house's own pieces (optional)
};
```

## Walls

Rectangles in plan, `[x1, y1, x2, y2]`, face to face. A typical outer wall is 0.25 m thick; a partition, 0.10 m.

```js
walls: [
  [0, 0, 8, 0.25],                                  // wall 8 m long and 25 cm thick
  { rect: [3, 0.25, 3.1, 4], height: 2.5 },         // with its own height
  { rect: [0, 4, 8, 4.25], finish: 'brick' },       // finish: paint (default), brick or tile
  { rect: [5, 2, 5.1, 3], color: '#e6d8c4' },       // paint in another colour
  { rect: [6, 2, 6.1, 3], base: 1.0, height: 1.6 }, // starts 1 m above the floor (e.g. on top of a low wall)
]
```

- Walls may overlap at the corners: that is fine.
- **Do not leave gaps** for doors and windows: openings cut the walls on their own.

## Doors

```js
doors: [
  { opening: [2.0, 0, 2.9, 0.25], type: 'swing', opensTo: 'south', hinges: 'west' },
  { opening: [3, 1.2, 3.1, 2.0], type: 'sliding', opensTo: 'north' },
  { opening: [5, 4, 6.2, 4.25], type: 'opening' },
]
```

| Field | What it is |
|---|---|
| `opening` | Rectangle of the opening. It must cover **the whole thickness of the wall**, and it cuts it. |
| `type` | `swing`, `sliding` (slides into the wall) or `opening` (no leaf). |
| `opensTo` | Swing doors: which side the leaf swings to (across the wall). Sliding doors: which way it slides (along the wall). |
| `hinges` | Swing doors: which end of the opening the hinges are on (along the wall). |
| `height` | Height of the opening (`doorHeight` by default). |
| `color`, `label`, `open` | Leaf colour, a floating label (e.g. "3B") and whether it starts open. |

Example: in a wall running west to east (horizontal on the drawing), `opensTo` is `north` or `south` and `hinges` is `east` or `west`. In a wall running north to south, the other way round.

## Windows

```js
windows: [
  { opening: [0, 1, 0.25, 2.4], sill: 0.9, height: 1.3 },   // from 0.90 to 2.20 m
  { opening: [4, 0, 6, 0.25], sill: 0, height: 2.1 },       // French window (down to the floor)
]
```

## Rooms

```js
rooms: [
  { id: 'living', name: { en: 'Living room', es: 'Salón' }, polygon: [[0.25, 0.25], [5, 0.25], [5, 4], [0.25, 4]],
    floor: 'wood', floorColor: '#9b6b43', text: 'Card shown when the room is clicked.' },
  { id: 'terrace', name: 'Terrace', polygon: [...], floor: 'tile', level: -0.15, outdoor: true },
]
```

- `polygon`: the **interior** vertices, wall face to wall face, in order (clockwise or counter-clockwise).
- `floor`: `wood`, `tile`, `carpet`, `concrete` or `terrazzo`. `floorColor` changes the tone.
- `level`: floor height relative to the rest (one step down, `-0.16`). Furniture inside it stands on that level.
- `outdoor: true` paints it light green on the plan.

## What the engine adds on its own

- A 7 cm **skirting board** around every indoor room, wherever there is a wall and no door or French window.
- An inner **sill** and an outer **drip sill** on every window with a sill height (the inner side is the one inside a room that is not `outdoor`).
- **Architraves and lever handles** on swing doors.

## Furniture

All items share these fields:

| Field | What it is |
|---|---|
| `type` | A piece from the table below or a custom piece from `pieces`. |
| `x`, `y` | Centre of the item in plan. |
| `facing` | Where its **front** faces: `south` (default), `north`, `east`, `west`, or degrees (0 south, 90 east, 180 north, 270 west; any angle in between works). |
| `width`, `depth`, `height` | The item's own sizes: width from side to side of its front, depth from front to back. When it turns, width and depth turn with it. |
| `elevation` | How high above the floor it goes (wall cabinets, paintings, a TV on a sideboard). |
| `color`, `finish` | Colour (`'#rrggbb'`) and, in some pieces, finish: `matte`, `satin`, `gloss`, `metal`, `fabric`, `wood`. |
| `name`, `text` | Card shown when it is clicked. |
| `label`, `labelX` | Floating label above it (and offset along the item's width). |

To put an item against a wall, its centre goes half its depth from the wall face. Example: a 0.60 deep wardrobe against a wall whose face is at `y = 4`, facing north, goes at `y = 4 − 0.30 = 3.70`.

### Available pieces

In brackets, the default sizes (width × depth × height, in metres).

| Piece | What for | Own fields |
|---|---|---|
| `box` | Any simple volume (1 × 0.5 × 0.8) | `finish` |
| `rug` | Rug (2 × 1.4) | |
| `sofa` | Sofa with seat and back cushions and two loose cushions (2.1 × 0.95 × 0.85) | `seats`, `cushions: false`, `cushionColors: ['#…', '#…']` |
| `armchair` | Armchair (0.9 × 0.9) | |
| `table`, `coffeeTable` | Table (1.4 × 0.8 × 0.75) and coffee table (height 0.42) | `legColor` |
| `chair`, `stool` | Chair (the front is where the sitter looks) and bar stool | |
| `desk` | Desk with screens, keyboard and mouse (1.4 × 0.7). Clicking a screen or the tower switches the computer on: code scrolling on screen and green LEDs. | `screens`, `tower`, `on: true` (starts switched on) |
| `bookshelf` | Bookshelf with books (0.9 × 0.3 × 1.9) | `shelves`, `books: false`, `finish` |
| `bed` | Bed with headboard, mattress, cover, folded sheet, pillows and a throw at the foot (1.35 × 2.0). The front is the foot. | `headboard` (colour), `throw: false`, `throwColor` |
| `nightstand` | Nightstand with a drawer that slides out when clicked and a lamp that switches on when clicked | `lamp: false` |
| `wardrobe` | Wardrobe with doors that open when clicked, rail and clothes (1.6 × 0.6 × 2.2) | `doors` |
| `counter` | Kitchen base units in modules of about 60 cm, with plinth, handles, worktop and tiled backsplash. The sink sits in a cut-out of the worktop with a steel bowl, drain and tap; under the hob, an oven. | `sink`, `hob`, `drawers` (position of their centre, in metres from the centre of the unit, along its width; `drawers` adds a three-drawer unit), `oven: false`, `topColor`, `backsplash` (height of the backsplash; 0 removes it), `backsplashColor` |
| `wallCabinet` | Kitchen wall cabinets (depth 0.35; elevation 1.45) | |
| `fridge` | Fridge that opens when clicked (0.7 × 0.68 × 1.85) | |
| `bar` | Breakfast bar with knee space at the front (height 1.05) | `topColor` |
| `sideboard` | Low cabinet with doors (TV stand) | |
| `tv` | TV that switches on when clicked (`width` = screen width) | `mount: 'wall'` |
| `whiteboard` | Whiteboard on wheels | `lines` (what is written on it), `wall: true` |
| `toilet`, `washbasin`, `mirror`, `shower`, `bathtub` | Bathroom. The toilet is turned, with seat and lid; the washbasin has a sunken oval bowl, drain, tap and a two-drawer cabinet; the bathtub, a tap. | `washbasin`: `cabinet: false` (pedestal) |
| `plant` | Potted plant | |
| `lamp` | Floor lamp that switches on when clicked | `on: false` |
| `painting` | Painting on the wall (elevation 1.2) | `image` (path), `drawing` (`'periodic-table'`, `'atom'`), `frame` |
| `stairs` | Straight flight rising from the front towards the back | `steps` |

### What can be used

When clicked (or with the hand during the walk), doors, wardrobes, the fridge and drawers (kitchen, washbasin and nightstand ones) open; the sink, washbasin and bathtub taps run water with sound; computers, the TV, the oven, the hob and lamps switch on; and the toilet lid goes up or down. Custom pieces get the same with `c.interactive` and `c.animate`.

## Custom pieces

If something is missing, it is defined in the house itself with the same rules as `engine/pieces.js`: a function that draws the item centred on the origin, standing on `y = 0` and with its front facing `+z`.

```js
pieces: {
  fireplace(p, g, c) {
    c.box(g, -0.8, 0, -0.3, 0.8, 1.1, 0, c.mat('#d9d3c7', 'matte'));                // body
    c.box(g, -0.4, 0.15, -0.05, 0.4, 0.75, 0.001, c.mat('#1a1a1a', 'matte'));       // firebox
  },
},
furniture: [{ type: 'fireplace', x: 2, y: 3.7, facing: 'north' }],
```

Utilities in `c`:

| Utility | What it does |
|---|---|
| `c.box(g, x1, y1, z1, x2, y2, z2, material)` | Box between two corners. Returns the mesh. |
| `c.rounded(g, x1, y1, z1, x2, y2, z2, radius, material)` | Box with rounded edges (cushions, mattresses). |
| `c.cylinder(g, rTop, rBottom, height, x, y, z, material)` | Cylinder centred on (x, y, z). |
| `c.mat(color, finish)` | Material. Finishes: `matte`, `satin`, `gloss`, `metal`, `steel` (brushed), `fabric`, `wood`, `glass`, `mirror`, `light`. |
| `c.wall(type, color)` | Wall finish (`paint`, `brick`, `tile`), for backsplashes and claddings. |
| `c.drawnTexture(width, height, draw)` | Texture drawn on a canvas (signs, screens). Returns `{ texture, canvas }`. |
| `c.interactive(object, fn)` | Clicking the object (or using it with the hand during the walk) calls `fn`. |
| `c.animate(fn)` | `fn(dt)` is called every frame (doors opening, screens). |
| `c.light(g, x, y, z, color, intensity, range)` | Point light. |
| `c.waterSound()` | Water sound: returns `{ start(), stop() }` (it plays while any is started). |
| `c.tr(value)` | The current language's text of a bilingual value (see Languages). |
| `c.t(key)` | An interface text from `engine/i18n.js`. |
| `c.lang` | The current language: `'en'` or `'es'`. |
| `c.THREE` | The three.js library, for custom geometry. |
