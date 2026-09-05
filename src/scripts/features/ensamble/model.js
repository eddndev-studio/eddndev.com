export const clamp = (value, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
export const smooth = (start, end, value) => {
  const x = clamp((value - start) / (end - start));
  return x * x * (3 - 2 * x);
};

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

/** Project the same laminated n' in the server-rendered and animated states. */
export function getLayerTransform({
  index,
  progress = 0,
  structure = 0,
  time = 0,
  pointer = { x: 0, y: 0 },
}) {
  const spread = smooth(0.2, 0.58, progress) * 16;
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
  const scale = 1.21;
  const z =
    -135 +
    index * (6 + Math.sin(time * 0.6) * 0.32 + structure * 3.4) +
    (index - 18.5) * spread;
  const wave = Math.sin(time * 0.83 - index * 0.13) * (3.5 + structure * 2);
  const e = (sy * cz + sx * cy * sz) * z;
  const f = (sy * sz - sx * cy * cz) * z;
  return [
    a * scale,
    b * scale,
    c * scale,
    d * scale,
    355 + e * scale + wave,
    353 + f * scale + Math.sin(time * 0.52) * 6,
  ];
}

export const matrix = (values) =>
  `matrix(${values.map((value) => value.toFixed(5)).join(' ')})`;
