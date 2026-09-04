export const FOOTER_FILM = Object.freeze({
  columns: 96,
  rows: 48,
  pitch: 8,
  ledSize: 4,
  colors: Object.freeze({
    1: 'rgb(61, 45, 90)',
    2: 'rgb(108, 80, 160)',
    3: 'rgb(156, 122, 230)',
    4: 'rgb(213, 194, 255)',
  }),
  sizes: Object.freeze({ 1: 0.35, 2: 0.6, 3: 0.85, 4: 1 }),
});

const wideFilm = Object.freeze({
  ...FOOTER_FILM,
  name: 'wide', minWidth: 640,
  speed: 12, ignitionDelay: 0.6, extinctionDelay: 0.25,
  ignitionDuration: 380, extinctionDuration: 600, morphDuration: 240,
});

// Widths refer to the drawing's container, not the device viewport.
export const FOOTER_FILM_PROFILES = Object.freeze([
  Object.freeze({
    ...wideFilm,
    name: 'compact', minWidth: 0,
    columns: 48, rows: 24, pitch: 12, ledSize: 6,
    sizes: Object.freeze({ 1: 0.55, 2: 0.7, 3: 0.9, 4: 1 }),
    speed: 4, ignitionDelay: 0.8, extinctionDelay: 0.4,
    ignitionDuration: 420, extinctionDuration: 700, morphDuration: 320,
  }),
  Object.freeze({
    ...wideFilm,
    name: 'medium', minWidth: 480,
    columns: 72, rows: 36, pitch: 10, ledSize: 5,
    sizes: Object.freeze({ 1: 0.45, 2: 0.65, 3: 0.85, 4: 1 }),
    speed: 6, ignitionDelay: 0.68, extinctionDelay: 0.3,
    ignitionDuration: 400, extinctionDuration: 650, morphDuration: 280,
  }),
  wideFilm,
]);

export function getFooterFilmProfile(width) {
  return FOOTER_FILM_PROFILES.findLast(profile => width >= profile.minWidth) ?? FOOTER_FILM_PROFILES[0];
}

// Two curved ribbons form a single, fixed exposure. Ledding moves the LED
// lattice through this drawing; its geometry never changes with time.
export function createFooterFilm({ columns, rows } = FOOTER_FILM) {
  return Array.from({ length: rows }, (_, row) => (
    Array.from({ length: columns }, (_, column) => {
      const x = column / (columns - 1);
      const y = row / (rows - 1);
      const envelope = Math.sin(Math.PI * x);
      const center = 0.52 - 0.23 * Math.sin(x * Math.PI * 2 - 0.65);
      const width = 0.025 + 0.105 * envelope ** 2;
      const ribbon = Math.max(0, 1 - Math.abs(y - center) / width);
      const returnCenter = 0.5 + 0.21 * Math.sin(x * Math.PI * 2 - 0.65);
      const returnRibbon = Math.max(0, 1 - Math.abs(y - returnCenter) / (0.025 + 0.025 * envelope));
      const exposure = Math.max(ribbon, returnRibbon * 0.72) * envelope ** 0.45;
      if (exposure < 0.1) return 0;
      if (exposure < 0.32) return 1;
      if (exposure < 0.58) return 2;
      if (exposure < 0.83) return 3;
      return 4;
    })
  ));
}
