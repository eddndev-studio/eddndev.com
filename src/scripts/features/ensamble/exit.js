import { LAYER_COUNT, smooth } from './model.js';

export function getExitPhases(progress) {
  return {
    copy: smooth(0.025, 0.44, progress),
    details: smooth(0.08, 0.5, progress),
    center: smooth(0.12, 0.6, progress),
    next: smooth(0.73, 0.96, progress),
  };
}

export function getSceneDeparture({ progress, width, height, svg }) {
  const phases = getExitPhases(progress);
  const portrait = width <= 900 || height > width;
  return {
    copyX: -(width + 80) * phases.copy,
    detailsX: portrait ? 0 : (width + 80) * phases.details,
    detailsY: portrait ? (height + 80) * phases.details : 0,
    objectX: (width * 0.5 - (svg.x + 360 * svg.scale)) * phases.center,
    objectY: (height * 0.46 - (svg.y + 360 * svg.scale)) * phases.center,
  };
}

/** Send the outer planes first, then the inner pair, along the depth axis. */
export function getLayerDeparture({ index, count = LAYER_COUNT, progress, width, height, svg }) {
  const position = index / Math.max(1, count - 1);
  const rank = Math.abs(position - 0.5) * 2;
  const departure = smooth(
    0.48 + (1 - rank) * 0.18,
    0.84 + (1 - rank) * 0.15,
    progress,
  );
  if (!departure) return { x: 0, y: 0 };
  const direction = position < 0.5 ? -1 : 1;
  const distance = (Math.hypot(width, height) + 720 * svg.scale) / svg.scale;
  return {
    x: -0.86 * direction * distance * departure,
    y: 0.51 * direction * distance * departure,
  };
}
