/**
 * Full-side Wang signatures. Bit order: N=1, E=2, S=4, W=8.
 * A port covers the OPEN side interval (0,100). A closed side is empty.
 * Corner points have zero measure; all shared open intervals agree exactly.
 * Holes/grooves are strictly inside a cell and cannot alter a port.
 */
const N = 1, E = 2, S = 4, W = 8;
const VALID_MASKS = Object.freeze([0, 3, 5, 6, 9, 10, 12, 15]);
const INKS = Object.freeze(['--concordance-blue', '--concordance-cobalt', '--signal', '--signal-on-dark']);
const DEFAULT_COLORS = Object.freeze(['#49adff', '#2f7fff', '#9e88df', '#b7a6ec']);

const squareHole = (x, side, r) => {
  const c = x + side / 2;
  return `M${x} ${x}h${side}v${side}h-${side}Z M${c-r} ${c}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 -${2*r} 0Z`;
};
const bars = [14, 32, 50, 68].map(y => `M14 ${y}h72v9H14Z`).join(' ');
const GLYPHS = Object.freeze({
  empty: { path: '', area: 0, base: 0 },
  bars: { path: bars, area: .2592, base: 0 },
  island: { path: squareHole(14, 72, 22), area: (72*72-Math.PI*22*22)/10000, base: 0 },
  quarter: { path: 'M0 0H100A100 100 0 0 1 0 100Z', area: Math.PI/4, base: 9 },
  stair: { path: 'M0 0H100L75 25H50V50H25V75L0 100Z', area: .4375, base: 9 },
  waist: { path: 'M0 0H100C72 28 72 72 100 100H0C28 72 28 28 0 0Z', area: .71104, base: 5 },
  aperture: { path: squareHole(0, 100, 28), area: 1-Math.PI*.28*.28, base: 15 },
});

function rotateMask(mask, turns) {
  let m = mask;
  for (let i = 0; i < (turns % 4 + 4) % 4; i++) m = ((m << 1) & 15) | (m >> 3);
  return m;
}

function describeTile(cell) {
  const { mask, motif = 0, ink = 0 } = cell;
  if (!VALID_MASKS.includes(mask)) throw new RangeError(`Odd/unknown mask: ${mask}`);
  let kind = 'empty', rotation = 0;
  if (mask === 0) kind = motif === 0 ? 'bars' : motif === 1 ? 'island' : 'empty';
  else if (mask === 15) kind = 'aperture';
  else if (mask === 5 || mask === 10) { kind = 'waist'; rotation = mask === 5 ? 0 : 90; }
  else {
    kind = motif % 4 === 0 ? 'stair' : 'quarter';
    rotation = [9, 3, 6, 12].indexOf(mask) * 90;
  }
  return { kind, rotation, ink, ...GLYPHS[kind] };
}

function shortestTurn(from, to) {
  const d = ((to - from + 540) % 360) - 180;
  return d === -180 ? 180 : d;
}

export { VALID_MASKS, INKS, DEFAULT_COLORS, describeTile, shortestTurn };
