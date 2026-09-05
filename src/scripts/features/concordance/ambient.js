import { fieldOpacity } from './field.js';

/** SVG's xMidYMid slice geometry, shared by hit testing and random origins. */
export function coverGeometry(rect, { width, height }) {
  const cell = Math.max(rect.width / width, rect.height / height);
  return {
    cell,
    left: rect.left + (rect.width - width * cell) / 2,
    top: rect.top + (rect.height - height * cell) / 2,
  };
}

export function visibleRoots(geometry, { width, height }, clip) {
  if (clip.right <= clip.left || clip.bottom <= clip.top || !geometry.cell) return [];
  const insetX = (clip.right - clip.left) * .12;
  const insetY = (clip.bottom - clip.top) * .12;
  const roots = Array.from({ length: width * height }, (_, i) => i).filter(i => {
    const x = geometry.left + (i % width + .5) * geometry.cell;
    const y = geometry.top + (Math.floor(i / width) + .5) * geometry.cell;
    return x > clip.left + insetX && x < clip.right - insetX &&
      y > clip.top + insetY && y < clip.bottom - insetY;
  });
  const exposed = roots.filter(id => fieldOpacity(id, { width, height }) >= .18);
  // Preserve continuity while scrolling through an entirely masked strip.
  return exposed.length ? exposed : roots;
}

/** Choose a visible origin without immediately reusing the previous one. */
export function randomRoot(roots, previous, random = Math.random) {
  if (!roots.length) return -1;
  const candidates = roots.length > 1 ? roots.filter(root => root !== previous) : roots;
  return candidates[Math.floor(random() * candidates.length)];
}
