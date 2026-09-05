// A diagonal field follows the tile lattice instead of fading each shape into
// a vignette. The portrait field keeps the paragraph and navigation clear.
const landscape = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, .04, .12, .30, .56, .85, 1, .70, .32],
  [0, 0, 0, 0, 0, .08, .20, .45, .78, 1, .92, .72, .40, .12],
  [0, 0, 0, .03, .12, .32, .62, .78, .65, .42, .20, .06, 0, 0],
  [0, 0, .04, .16, .35, .42, .28, .14, .04, 0, 0, 0, 0, 0],
  [0, 0, 0, .06, .12, .08, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
const portrait = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, .05, .18, .50, .85, .48],
  [.03, .12, .35, .70, 1, .55],
  [0, .08, .18, .42, .65, .34],
  [0, 0, .04, .12, .22, .12],
  [0, 0, 0, .04, .08, .04],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
];

/** Share the field's exposure between SSR and cascade origin selection. */
export function fieldOpacity(id, { width, height }) {
  if (id < 0 || id >= width * height) return 0;
  const field = height > width ? portrait : landscape;
  const x = Math.floor((id % width + .5) / width * field[0].length);
  const y = Math.floor((Math.floor(id / width) + .5) / height * field.length);
  return field[y][x];
}
