import { smooth } from './model.js';

export function getDrawingPhases(progress) {
  return {
    opacity: smooth(0.14, 0.34, progress) * (1 - smooth(0.78, 0.96, progress)),
    design: smooth(0.14, 0.42, progress),
    engineering: smooth(0.28, 0.56, progress),
    product: smooth(0.4, 0.68, progress),
  };
}

const point = ([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`;
const line = (a, b) => `M${point(a)}L${point(b)}`;
const stages = ['design', 'engineering', 'product'];

/** A design-to-product sequence with room for the departing sculpture between views. */
export function getDrawingLayout({ width, height }) {
  const portrait = width < height * 0.9;
  const size = portrait ? Math.min(width * .58, height * .23) : Math.min(width * .23, height * .6);
  const scale = size / 240;
  const centers = portrait
    ? [[width * .38, height * .22], [width * .62, height * .48], [width * .38, height * .74]]
    : [[width * .18, height * .47], [width * .5, height * .52], [width * .82, height * .43]];
  const transforms = Object.fromEntries(stages.map((name, i) => [name, [scale, 0, 0, scale, ...centers[i]]]));
  const labels = Object.fromEntries(stages.map((name, i) => [name, [centers[i][0] - 100 * scale, centers[i][1] - 90 * scale - 20]]));
  const connections = centers.slice(0, 2).map((center, i) => {
    const next = centers[i + 1];
    if (portrait) {
      const start = [center[0], center[1] + 90 * scale + 14];
      const end = [next[0], next[1] - 90 * scale - 32];
      const mid = (start[1] + end[1]) / 2;
      return `M${point(start)}V${mid.toFixed(2)}H${end[0].toFixed(2)}V${end[1].toFixed(2)}` +
        line([end[0] - 3, end[1] - 5], end) + line(end, [end[0] + 3, end[1] - 5]);
    }
    const start = [center[0] + 110 * scale + 14, center[1]];
    const end = [next[0] - 110 * scale - 14, next[1]];
    const mid = (start[0] + end[0]) / 2;
    return `M${point(start)}H${mid.toFixed(2)}V${end[1].toFixed(2)}H${end[0].toFixed(2)}` +
      line([end[0] - 5, end[1] - 3], end) + line(end, [end[0] - 5, end[1] + 3]);
  });
  // A shared datum keeps the three drawings aligned without enclosing the hero.
  const datum = centers.map(([x, y]) => line([x - 112 * scale, y + 93 * scale], [x + 112 * scale, y + 93 * scale])).join('');
  const bounds = centers.flatMap(([x, y]) => [[x - 112 * scale, y - 90 * scale], [x + 112 * scale, y + 93 * scale]]);
  return {
    portrait,
    transforms,
    paths: { datum, toEngineering: connections[0], toProduct: connections[1] },
    labels,
    anchors: [...bounds, ...Object.values(labels)],
  };
}
