// Fallback images: shown when the Unsplash API is unavailable (no key / fetch error).
// When the key is set, App fetches via the API and overrides each `url` (see utils/unsplash.js).
// These are curated real Unsplash tattoo photos; fit=crop gives a clean full-bleed 2:3 crop
// (no padding) that fills the 1.4×2.1 card. Hotlinking images.unsplash.com is allowed.
const IMG = (id) =>
  `https://images.unsplash.com/photo-${id}?w=768&h=1152&fit=crop&crop=entropy&q=80&auto=format`

export const PHOTOS = [
  { url: IMG('1586243287039-23f4c8e2e7ab'), title: 'Norte verdadero',  style: 'Ornamental · Línea fina',   artist: 'Iria L.',   year: '2025', size: '14 × 14 cm', session: '3 — 4 h' },
  { url: IMG('1597852075234-fd721ac361d3'), title: 'Ouroboros',        style: 'Blackwork · Línea',         artist: 'Mateo R.',  year: '2025', size: '10 × 22 cm', session: '4 — 5 h' },
  { url: IMG('1542727365-19732a80dcfd'),    title: 'Polilla luna',     style: 'Línea fina · Dotwork',      artist: 'Iria L.',   year: '2024', size: '12 × 16 cm', session: '3 h'     },
  { url: IMG('1595862645152-2f32bd80ce1d'), title: 'Vesica',           style: 'Sacred geometry',           artist: 'Júlia C.',  year: '2025', size: '16 × 16 cm', session: '5 h'     },
  { url: IMG('1607382007937-fe3a9d196b7a'), title: 'Hierbabuena',      style: 'Botánica · Microrealismo',  artist: 'Iria L.',   year: '2024', size: '9 × 20 cm',  session: '3 h'     },
  { url: IMG('1531951829979-d658d7e5e8a6'), title: 'Hoja partida',     style: 'Tradicional · Blackwork',   artist: 'Mateo R.',  year: '2025', size: '8 × 22 cm',  session: '4 h'     },
  { url: IMG('1651692883249-ed36b3523419'), title: 'Mano que ve',      style: 'Ornamental · Esoterismo',   artist: 'Júlia C.',  year: '2024', size: '13 × 18 cm', session: '5 h'     },
  { url: IMG('1568515045052-f9a854d70bfd'), title: 'Kanagawa',         style: 'Neo-japonés · Línea',       artist: 'Mateo R.',  year: '2025', size: '20 × 14 cm', session: '6 h'     },
  { url: IMG('1562379825-415aea84ebcf'),    title: 'Fases · 1.II',     style: 'Microrealismo · Dotwork',   artist: 'Iria L.',   year: '2024', size: '18 × 6 cm',  session: '2 — 3 h' },
  { url: IMG('1547754145-ef9ff306e3f3'),    title: 'Memento',          style: 'Lettering · Cursiva',       artist: 'Júlia C.',  year: '2025', size: '12 × 7 cm',  session: '2 h'     },
  { url: IMG('1679621551579-8f7a24b467c2'), title: 'Vanitas',          style: 'Neo-tradicional',           artist: 'Mateo R.',  year: '2024', size: '12 × 16 cm', session: '5 — 6 h' },
  { url: IMG('1562962230-16e4623d36e6'),    title: 'Vesica II',        style: 'Geométrico · Línea fina',   artist: 'Júlia C.',  year: '2025', size: '10 × 14 cm', session: '3 h'     },
  { url: IMG('1598371839696-5c5bb00bdc28'), title: 'Serpiente solar',  style: 'Blackwork · Ornamental',    artist: 'Iria L.',   year: '2025', size: '15 × 20 cm', session: '4 — 5 h' },
  { url: IMG('1601848714157-d845bb5c11ff'), title: 'Calavera',         style: 'Neo-tradicional · Color',   artist: 'Mateo R.',  year: '2024', size: '11 × 15 cm', session: '4 h'     },
  { url: IMG('1564426622559-5af68da63b96'), title: 'Luna llena',       style: 'Fino · Puntillismo',        artist: 'Júlia C.',  year: '2025', size: '8 × 8 cm',   session: '2 h'     },
  { url: IMG('1627458514257-41d0ea46e326'), title: 'Brújula',          style: 'Geométrico · Fino',         artist: 'Iria L.',   year: '2024', size: '12 × 12 cm', session: '3 h'     },
  { url: IMG('1542744383-8c330d91f4b1'),    title: 'Flor de loto',     style: 'Ornamental · Dotwork',      artist: 'Júlia C.',  year: '2025', size: '14 × 18 cm', session: '4 — 5 h' },
  { url: IMG('1570168983832-8989dae1522e'), title: 'Runas',            style: 'Lettering · Fino',          artist: 'Mateo R.',  year: '2024', size: '6 × 10 cm',  session: '1 — 2 h' },
  { url: IMG('1552627019-947c3789ffb5'),    title: 'Dragón oriental',  style: 'Neo-japonés · Blackwork',   artist: 'Iria L.',   year: '2025', size: '20 × 30 cm', session: '8 h'     },
  { url: IMG('1607281503082-f01fedd97a5b'), title: 'Espadas',          style: 'Tradicional · Geométrico',  artist: 'Júlia C.',  year: '2024', size: '10 × 20 cm', session: '3 — 4 h' },
]

export const DESC_LIB = [
  'Línea fina sobre piel limpia. Boceto enviado por mail antes de la cita; sesión reservada cuando estés listo.',
  'Pieza diseñada a medida. Cada elemento puede reescalarse para ajustarse a la anatomía del cliente.',
  'Trabajo de varias sesiones. Cuidado posterior pautado por el estudio — sin tinta industrial.',
  'Tinta vegana, agujas de un solo uso, esterilización clínica. Cita previa con depósito reembolsable.',
  'Diseño exclusivo del estudio: una vez tatuado, retiramos la pieza del catálogo.',
]
