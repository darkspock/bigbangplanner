// ---------- Languages ----------
// The interface is available in English and Spanish. The language comes from ?lang=en|es if present, otherwise from the
// browser (Spanish for any "es-*" locale, English for everything else).
// House data can be bilingual too: any text field may be a plain string or { en: '…', es: '…' } (see tr()).

const SUPPORTED = ['en', 'es'];
const fromQuery = new URLSearchParams(location.search).get('lang');
const fromBrowser = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase().slice(0, 2);
export const LANG = SUPPORTED.includes(fromQuery) ? fromQuery : SUPPORTED.includes(fromBrowser) ? fromBrowser : 'en';
document.documentElement.lang = LANG;

// Localized house value: a string as is, or the entry for the current language of { en, es } (falling back to the other)
export function tr(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[LANG] ?? value.en ?? value.es ?? Object.values(value)[0];
  return value;
}

// Number with the decimal separator of the current language
export const num = (v, digits = 2) => (LANG === 'es' ? v.toFixed(digits).replace('.', ',') : v.toFixed(digits));

const STRINGS = {
  en: {
    appName: 'Big Bang Planner',
    hide: 'Hide', show: 'Show', hidePanel: 'Hide the panel',
    help: 'Help: how to move around (? key)',
    view: 'View',
    full: 'Full', fullTitle: 'Whole house in perspective',
    top: 'Top', topTitle: 'View from above',
    walk: 'Walk', walkTitle: 'Walk through the house in first person',
    measure: 'Measure', measureTitle: 'Measure: two clicks on the model (Esc to exit)',
    plan: 'Plan', planTitle: 'Scaled 2D floor plan with dimensions, doors and windows',
    hint: 'Click a room to see its card; double-click it (on a phone, press and hold) to see it on its own. Click doors, taps, computers, drawers, the oven… to use them. More in <b>?</b>',
    measureHelp: 'Click two points. A third click starts a new measurement; Esc or «Measure» to exit.',
    wallHeight: 'Wall height', wallsFull: 'full',
    showSection: 'Show', furniture: 'Furniture', roomNames: 'Room names',
    credits: 'Made with three.js (MIT license).',
    chipHint: 'Esc or double-click outside to exit', exit: 'Exit',
    planBar: 'Interior dimensions in metres, wall face to wall face, cut 1 m above the floor («≈»: the room opens onto another). Scroll or pinch to zoom; drag to move.',
    fit: 'Fit', print: 'Print', close: 'Close',
    measurePlanHeight: (dh, dv) => ` (plan ${dh} · height ${dv})`,
    walkHelp: '↑ ↓: forward and back · ← →: turn · Shift + ← →: sidestep · Shift + ↑ ↓: look up and down · mouse: look · click: use what the hand points at · Esc: exit',
    walkHelpDrag: '↑ ↓: forward and back · ← →: turn · Shift + ← →: sidestep · Shift + ↑ ↓: look up and down · drag with the mouse: look · click: use what the hand points at · Esc: exit',
    periodicTable: 'PERIODIC TABLE OF THE ELEMENTS',
    unknownPiece: type => `Unknown piece: ${type}`,
    helpTitle: 'How to move around the house',
    helpBody: `
    <section><h3>🖱️ With the mouse</h3><ul>
      <li><b>Rotate the view:</b> drag with the left button.</li>
      <li><b>Pan:</b> drag with the right button (or with Shift, Ctrl or ⌘ and the left one).</li>
      <li><b>Zoom in and out:</b> mouse wheel or pinch on the trackpad.</li>
      <li><b>Room card:</b> click its floor. <b>See it on its own:</b> double-click; to exit, Esc, «Exit» or double-click outside.</li>
      <li><b>Use things:</b> click anything usable (the cursor turns into a hand); another click puts it back:
        <ul><li>doors, wardrobes, fridge and drawers: open;</li><li>taps: run water (with sound);</li>
        <li>computers (screen or tower), TV, oven, hob and lamps: switch on;</li><li>toilet: lid up or down.</li></ul></li>
    </ul></section>
    <section><h3>⌨️ With the keyboard</h3><ul>
      <li><b>Arrows:</b> pan the view.</li>
      <li><b>Esc:</b> closes whatever is open (plan, measurement, single room, this help).</li>
      <li><b>?</b>: opens this help.</li>
    </ul></section>
    <section><h3>📱 On a phone or tablet</h3><ul>
      <li><b>Rotate:</b> drag with one finger.</li>
      <li><b>Zoom and pan:</b> pinch or drag with two fingers.</li>
      <li><b>Room card or use something:</b> tap once.</li>
      <li><b>See a room on its own:</b> press and hold on its floor for half a second.</li>
      <li><b>Walk</b> needs a keyboard: you cannot walk on a phone.</li>
    </ul></section>
    <section><h3>🚶 Walking in first person</h3><ul>
      <li><b>↑ ↓</b> (or W S): walk forward and back. <b>← →</b> (or A D): turn.</li>
      <li><b>Shift + ← →:</b> sidestep. <b>Shift + ↑ ↓:</b> look up and down.</li>
      <li><b>Mouse:</b> look around. If the browser does not allow capturing the mouse, you look by dragging.</li>
      <li><b>Click:</b> uses what the hand in the centre points at (opens doors, turns on the TV…). Closed doors cannot be walked through.</li>
      <li><b>Esc:</b> stop walking.</li>
    </ul></section>
    <section><h3>🧰 Panel tools</h3><ul>
      <li><b>Full / Top:</b> the whole house in perspective or from above.</li>
      <li><b>Measure:</b> two clicks on any point (floor, wall, furniture) give the distance; with a height difference, also in plan and in height. A third click starts again.</li>
      <li><b>Plan:</b> scaled 2D floor plan with each room's interior dimensions («≈» if it opens onto another), doors with their swing and windows. Scroll or pinch to zoom, drag to move, «Print» to put it on paper.</li>
      <li><b>Wall height:</b> lowers the walls to see the furniture from above.</li>
      <li><b>Show:</b> hides the furniture or the room names.</li>
    </ul></section>`,
  },
  es: {
    appName: 'Big Bang Planner',
    hide: 'Ocultar', show: 'Mostrar', hidePanel: 'Ocultar el panel',
    help: 'Ayuda: cómo moverse por la casa (tecla ?)',
    view: 'Vista',
    full: 'Completa', fullTitle: 'Casa completa en perspectiva',
    top: 'Planta', topTitle: 'Vista desde arriba',
    walk: 'Paseo', walkTitle: 'Recorrer la casa en primera persona',
    measure: 'Medir', measureTitle: 'Medir: dos clics sobre el modelo (Esc para salir)',
    plan: 'Plano', planTitle: 'Plano 2D a escala con cotas, puertas y ventanas',
    hint: 'Clic en una estancia para ver su ficha; doble clic (en el móvil, mantén pulsado) para verla sola. Clic en puertas, grifos, ordenadores, cajones, horno… para usarlos. Más en <b>?</b>',
    measureHelp: 'Pulsa dos puntos. Un tercer clic empieza otra medida; Esc o «Medir» para salir.',
    wallHeight: 'Altura de paredes', wallsFull: 'completas',
    showSection: 'Mostrar', furniture: 'Muebles', roomNames: 'Nombres de estancias',
    credits: 'Hecho con three.js (licencia MIT).',
    chipHint: 'Esc o doble clic fuera para salir', exit: 'Salir',
    planBar: 'Cotas interiores en metros, de cara a cara de muro, cortando a 1 m del suelo («≈»: la estancia se abre a otra). Rueda o pellizco para acercar; arrastra para mover.',
    fit: 'Encajar', print: 'Imprimir', close: 'Cerrar',
    measurePlanHeight: (dh, dv) => ` (planta ${dh} · altura ${dv})`,
    walkHelp: '↑ ↓: avanzar y retroceder · ← →: girar · Mayús + ← →: paso lateral · Mayús + ↑ ↓: mirar arriba y abajo · ratón: mirar · clic: usar lo que señala la mano · Esc: salir',
    walkHelpDrag: '↑ ↓: avanzar y retroceder · ← →: girar · Mayús + ← →: paso lateral · Mayús + ↑ ↓: mirar arriba y abajo · arrastrar con el ratón: mirar · clic: usar lo que señala la mano · Esc: salir',
    periodicTable: 'TABLA PERIÓDICA DE LOS ELEMENTOS',
    unknownPiece: type => `Pieza desconocida: ${type}`,
    helpTitle: 'Cómo moverse por la casa',
    helpBody: `
    <section><h3>🖱️ Con el ratón</h3><ul>
      <li><b>Girar la vista:</b> arrastra con el botón izquierdo.</li>
      <li><b>Desplazar:</b> arrastra con el botón derecho (o con Mayús, Ctrl o ⌘ y el izquierdo).</li>
      <li><b>Acercar y alejar:</b> rueda del ratón o pellizco en el trackpad.</li>
      <li><b>Ficha de una estancia:</b> clic en su suelo. <b>Verla sola:</b> doble clic; para salir, Esc, «Salir» o doble clic fuera.</li>
      <li><b>Usar cosas:</b> clic en lo que se puede usar (el cursor cambia a una mano); otro clic lo deja como estaba:
        <ul><li>puertas, armarios, nevera y cajones: se abren;</li><li>grifos: echan agua (y suena);</li>
        <li>ordenadores (monitor o torre), tele, horno, placa y lámparas: se encienden;</li><li>inodoro: sube o baja la tapa.</li></ul></li>
    </ul></section>
    <section><h3>⌨️ Con el teclado</h3><ul>
      <li><b>Flechas:</b> desplazan la vista.</li>
      <li><b>Esc:</b> cierra lo que esté abierto (plano, medida, estancia sola, esta ayuda).</li>
      <li><b>?</b>: abre esta ayuda.</li>
    </ul></section>
    <section><h3>📱 En el móvil o la tableta</h3><ul>
      <li><b>Girar:</b> arrastra con un dedo.</li>
      <li><b>Acercar, alejar y desplazar:</b> pellizca o arrastra con dos dedos.</li>
      <li><b>Ficha de una estancia o usar algo:</b> toca una vez.</li>
      <li><b>Ver una estancia sola:</b> mantén el dedo pulsado medio segundo sobre su suelo.</li>
      <li>El <b>Paseo</b> necesita teclado: en el móvil no se puede andar.</li>
    </ul></section>
    <section><h3>🚶 Paseo en primera persona</h3><ul>
      <li><b>↑ ↓</b> (o W S): andar hacia delante y hacia atrás. <b>← →</b> (o A D): girar.</li>
      <li><b>Mayús + ← →:</b> paso lateral. <b>Mayús + ↑ ↓:</b> mirar arriba y abajo.</li>
      <li><b>Ratón:</b> mirar alrededor. Si el navegador no deja capturar el ratón, se mira arrastrando.</li>
      <li><b>Clic:</b> usa lo que señala la mano del centro (abre puertas, enciende la tele…). Las puertas cerradas no se atraviesan.</li>
      <li><b>Esc:</b> salir del paseo.</li>
    </ul></section>
    <section><h3>🧰 Herramientas del panel</h3><ul>
      <li><b>Completa / Planta:</b> vista de toda la casa en perspectiva o desde arriba.</li>
      <li><b>Medir:</b> dos clics sobre cualquier punto (suelo, pared, mueble) dan la distancia; si hay desnivel, también en planta y en altura. Un tercer clic empieza otra medida.</li>
      <li><b>Plano:</b> planta 2D a escala con las cotas interiores de cada estancia («≈» si se abre a otra), las puertas con su apertura y las ventanas. Rueda o pellizco para acercar, arrastrar para mover, «Imprimir» para sacarlo en papel.</li>
      <li><b>Altura de paredes:</b> baja los muros para ver los muebles desde arriba.</li>
      <li><b>Mostrar:</b> oculta los muebles o los nombres de las estancias.</li>
    </ul></section>`,
  },
};

export const t = key => STRINGS[LANG][key] ?? STRINGS.en[key] ?? key;

// Fills the page: elements with data-i18n get their text, data-i18n-html their HTML, data-i18n-title their tooltip
export function translatePage(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
}

// Same page in another language (keeps the rest of the query string)
export function languageUrl(lang) {
  const q = new URLSearchParams(location.search); q.set('lang', lang);
  return `${location.pathname}?${q}`;
}
