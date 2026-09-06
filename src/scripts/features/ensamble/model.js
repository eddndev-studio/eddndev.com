export const clamp = (value, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
export const smooth = (start, end, value) => {
  const x = clamp((value - start) / (end - start));
  return x * x * (3 - 2 * x);
};

export const LAYER_COUNT = 24;

/** Sample the same stack, including its front and back faces, on small screens. */
export function getLayerIndices({ mobile = false } = {}) {
  const count = mobile ? 16 : LAYER_COUNT;
  return Array.from({ length: count }, (_, index) =>
    Math.round(index * (LAYER_COUNT - 1) / (count - 1)),
  );
}

export function getLayout({
  height,
  viewport,
  mobile = false,
  reduced = false,
}) {
  const pinned = !reduced && height > 0 && viewport > 0;
  const delay = pinned ? Math.max(0, height - viewport) : 0;
  return {
    pinned,
    runway: pinned ? Math.round(viewport * (mobile ? 1.1 : 1.15)) : 0,
    delay,
    pinTop: delay ? -delay : 0,
    overlap: pinned ? Math.round(viewport * 0.6) : 0,
  };
}

export function getProgress({
  scroll,
  top,
  runway,
  delay = 0,
  reduced = false,
}) {
  return reduced || !runway ? 0 : clamp((scroll - top - delay) / runway);
}

/** Project the centered brand profile with a depth independent of layer count. */
export function getLayerTransform({
  index,
  count = LAYER_COUNT,
  progress = 0,
  structure = 0,
  time = 0,
  pointer = { x: 0, y: 0 },
}) {
  const position = index / Math.max(1, count - 1);
  const spread = smooth(0.2, 0.58, progress) * 592;
  const rx = -0.31 + Math.sin(time * 0.27) * 0.055 + pointer.y * 0.055;
  const ry = -0.57 + Math.sin(time * 0.22) * 0.11 + pointer.x * 0.1;
  const rz = -0.12 + Math.sin(time * 0.19) * 0.035;
  const cx = Math.cos(rx),
    sx = Math.sin(rx),
    cy = Math.cos(ry),
    sy = Math.sin(ry),
    cz = Math.cos(rz),
    sz = Math.sin(rz);
  const a = cy * cz - sx * sy * sz,
    b = cy * sz + sx * sy * cz,
    c = -cx * sz,
    d = cx * cz;
  const scale = 1.45;
  const z = (position - 0.5) *
    (168 + Math.sin(time * 0.6) * 12 + structure * 126 + spread);
  const wave = Math.sin(time * 0.83 - position * 4.8) * (3.5 + structure * 2);
  const e = (sy * cz + sx * cy * sz) * z;
  const f = (sy * sz - sx * cy * cz) * z;
  return [
    a * scale,
    b * scale,
    c * scale,
    d * scale,
    360 + e * scale + wave,
    360 + f * scale + Math.sin(time * 0.52) * 6,
  ];
}

export const matrix = (values) =>
  `matrix(${values.map((value) => value.toFixed(5)).join(' ')})`;
