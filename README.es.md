# Big Bang Planner

*[Read in English](README.md)*

Un framework gratuito y de código abierto (MIT) para hacer modelos 3D interactivos de viviendas.

Convierte el plano de una vivienda en un modelo 3D interactivo en el navegador, hablando con Claude: le pasas el plano, unas medidas y fotos, y te devuelve la casa en 3D, amueblada, con la que puedes:

- **mirarla** entera o en planta, y bajar la altura de las paredes;
- **ver una estancia sola** (doble clic en su suelo; en el móvil, mantener pulsado);
- **pasear** por dentro en primera persona y usar las cosas: abrir puertas, armarios, cajones y la nevera, abrir los grifos, encender los ordenadores, la tele, el horno, la placa o las lámparas;
- **medir** cualquier distancia con dos clics;
- sacar un **plano 2D a escala** con las cotas interiores de cada estancia, las puertas con su apertura y las ventanas, e imprimirlo.

El botón **?** del panel (o la tecla ?) explica cómo moverse con ratón, teclado y pantalla táctil.

La interfaz está en **inglés y español**: sigue el idioma del navegador, y las banderas del panel lo cambian (o añade `?lang=es` / `?lang=en` a la dirección).

No hay que instalar nada ni programar: la casa es un fichero de datos en metros que escribe Claude. El código y los nombres de los campos están en inglés; los textos de cada casa pueden ir en los dos idiomas.

## Cómo se usa

Descárgalo de GitHub (`git clone https://github.com/darkspock/bigbangplanner.git`, o el ZIP desde la página del repositorio).


1. Instala la carpeta como skill de Claude. En Claude Code, por ejemplo, copiándola en `~/.claude/skills/bigbangplanner/` (el `SKILL.md` está en la raíz).
2. Pídeselo a Claude con el plano adjunto: *«Usa bigbangplanner para crear mi piso a partir de este plano. La pared del salón mide 4,20 m.»*
3. Claude monta muros, puertas, ventanas y estancias, te enseña el Plano con las cotas para que las compares con las reales, y después amuebla estancia por estancia contigo.
4. Para compartirla, Claude la publica como Artifact privado de claude.ai, que tú decides con quién compartir.

## Verla en tu ordenador

```bash
python3 -m http.server 8000
```

Y abre `http://localhost:8000/` (la página del proyecto, con el ejemplo dentro), `http://localhost:8000/viewer.html` (la casa de ejemplo) o `http://localhost:8000/viewer.html?house=<nombre>`.

## Qué hay dentro

| Carpeta | Contenido |
|---|---|
| `engine/` | El motor: escena, muros y huecos, piezas, paseo, plano 2D, idiomas y estilos. Igual para todas las casas. |
| `houses/` | Una carpeta por casa con su `house.js`. Trae `apartment-4a` de ejemplo. |
| `index.html` | La página de presentación del proyecto. |
| `viewer.html` | El visor: abre una casa en 3D. |
| `docs/FORMAT.md` | El formato de una casa y la lista de piezas (en inglés). |
| `SKILL.md` | Las instrucciones para Claude. |

## La casa de ejemplo

`apartment-4a` está inspirado en el piso de Sheldon y Leonard. La distribución y las medidas son inventadas y aproximadas, no planos oficiales. Los nombres de los personajes pertenecen a sus titulares. No se usan imágenes ni logotipos de ninguna serie: todo está dibujado por el propio kit.

## Licencias

- Big Bang Planner: [licencia MIT](LICENSE).
- three.js: licencia MIT, cargado desde jsDelivr.
- Texturas y muebles: procedurales, generados por el propio kit.

## Aviso legal

Big Bang Planner es un proyecto de fan independiente. No tiene relación con los creadores, productores ni titulares de derechos de *The Big Bang Theory*, ni cuenta con su patrocinio o respaldo; el nombre, los personajes y las marcas de la serie pertenecen a sus titulares. El software se ofrece «tal cual», sin garantía, bajo licencia MIT; los modelos y medidas que produce son una ayuda visual, que conviene comprobar en obra o con un profesional antes de construir, reformar o comprar muebles.

## Contacto

Preguntas, ideas o peticiones para cambiar o retirar algo: [@juanmacias en X](https://x.com/juanmacias).
