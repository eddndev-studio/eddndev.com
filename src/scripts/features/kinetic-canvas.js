import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';
import { createElectricPulses } from './electric-pulses';

const MOBILE_QUERY = '(max-width: 720px), (pointer: coarse)';
const MODE_DURATION = 6800;
const TAU = Math.PI * 2;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from, to, amount) => from + (to - from) * amount;

function ease(value) {
  const time = clamp(value);
  return time * time * (3 - 2 * time);
}

function cyclicDistance(a, b, length) {
  const distance = Math.abs(a - b);
  return Math.min(distance, length - distance);
}

function modeWeights(time) {
  const phase = (time / MODE_DURATION) % 3;
  return [0, 1, 2].map((mode) => ease(1 - cyclicDistance(phase, mode, 3)));
}

function pathOffset(path) {
  let hash = 0;
  for (let index = 0; index < path.length; index += 1) {
    hash = Math.imul(31, hash) + path.charCodeAt(index) | 0;
  }
  return Math.abs(hash % 2000);
}

function deformPoint(x, y, width, height, time, pointer, pathPhase) {
  const nx = x / width;
  const ny = y / height;
  const [flow, fold, shear] = modeWeights(time + pathPhase);
  const autoX = 0.5 + Math.sin(time * 0.00017 + pathPhase) * 0.22;
  const autoY = 0.52 + Math.cos(time * 0.00021 + pathPhase) * 0.18;
  const focusX = lerp(autoX, pointer.x, pointer.active);
  const focusY = lerp(autoY, pointer.y, pointer.active);
  const dx = nx - focusX;
  const dy = ny - focusY;
  const gravity = Math.exp(-(dx * dx * 10 + dy * dy * 7));
  const split = 0.5 + Math.sin(time * 0.00023 + pathPhase) * 0.14;
  const cut = Math.tanh((nx - split) * 11);
  const scale = Math.min(width / 1200, height / 420);

  const flowX = Math.sin(ny * TAU * 1.55 - time * 0.00032) * 18 * scale;
  const flowY = Math.sin(nx * TAU * 1.35 + ny * 2.2 + time * 0.00037) * 22 * scale;
  const foldX = -dx * gravity * 210 * scale;
  const foldY = -dy * gravity * 145 * scale;
  const shearX = cut * (ny - 0.5) * 78 * scale;
  const shearY = (-cut * 12 + Math.sin(ny * TAU * 2.7 + time * 0.0005) * 5) * scale;
  const pointerPull = gravity * pointer.active;

  return {
    x: x + flowX * flow + foldX * (fold + pointerPull * 0.7) + shearX * shear,
    y: y + flowY * flow + foldY * (fold + pointerPull * 0.7) + shearY * shear,
  };
}

function buildRow(index, total, samples, width, height, time, pointer, pathPhase) {
  const y = height * ((index + 1) / (total + 1));
  const points = [];
  for (let sample = 0; sample <= samples; sample += 1) {
    const x = width * (sample / samples);
    points.push(deformPoint(x, y, width, height, time, pointer, pathPhase));
  }
  return points;
}

function buildColumn(index, total, samples, width, height, time, pointer, pathPhase) {
  const x = width * ((index + 1) / (total + 1));
  const points = [];
  for (let sample = 0; sample <= samples; sample += 1) {
    const y = height * (sample / samples);
    points.push(deformPoint(x, y, width, height, time, pointer, pathPhase));
  }
  return points;
}

function drawPath(context, points) {
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.stroke();
}

function drawForegroundPath(context, points, index, time, lift, mobile) {
  const dash = index % 3 === 0 ? [48, 13, 4, 9] : [2, 8, 30, 11];
  const baseDashOffset = -(time * 0.012 + index * 13);
  let traveled = 0;

  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.setLineDash(dash);

  for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
    const from = points[pointIndex - 1];
    const to = points[pointIndex];
    const segmentLength = Math.hypot(to.x - from.x, to.y - from.y);
    const progress = (pointIndex - 0.5) / (points.length - 1);
    const proximity = 1 - clamp(Math.abs(progress - lift.center) / lift.radius);
    const presence = lift.strength * ease(proximity);

    if (presence > 0.02) {
      context.lineDashOffset = baseDashOffset - traveled;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.lineWidth = mobile ? 3.2 : 4.6;
      context.strokeStyle = `rgba(11, 9, 16, ${presence * 0.86})`;
      context.stroke();

      context.lineWidth = mobile ? 1.25 : 1.65;
      context.strokeStyle = `rgba(183, 166, 236, ${presence * 0.76})`;
      context.stroke();

      context.lineWidth = 0.5;
      context.strokeStyle = `rgba(241, 237, 244, ${presence * 0.3})`;
      context.stroke();
    }

    traveled += segmentLength;
  }

  context.restore();
}

export default function initKineticCanvas() {
  const canvas = document.querySelector('[data-kinetic-canvas]');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;
  const foregroundCanvas = document.querySelector('[data-kinetic-foreground]');
  const foregroundContext = foregroundCanvas?.getContext('2d') || null;

  const media = window.matchMedia(MOBILE_QUERY);
  const reducedMotion = prefersReduced();
  const pathSeed = pathOffset(canvas.dataset.path || '/') + 1;
  const phase = pathSeed / 1000;
  const electricPulses = createElectricPulses(pathSeed);
  const pointer = { x: 0.52, y: 0.48, active: 0, targetX: 0.52, targetY: 0.48, targetActive: 0 };
  let width = 0;
  let height = 0;
  let ratio = 1;
  let frameId = 0;
  let lastFrame = 0;
  let visible = true;

  function render(time) {
    if (!width || !height) return;
    const renderTime = reducedMotion ? MODE_DURATION * 0.58 + phase * 1000 : time;
    const rows = media.matches ? 8 : 12;
    const columns = media.matches ? 11 : 19;
    const rowSamples = media.matches ? 22 : 38;
    const columnSamples = media.matches ? 10 : 16;

    pointer.x = lerp(pointer.x, pointer.targetX, 0.07);
    pointer.y = lerp(pointer.y, pointer.targetY, 0.07);
    pointer.active = lerp(pointer.active, pointer.targetActive, 0.055);

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.lineCap = 'butt';
    context.lineJoin = 'round';
    if (foregroundContext) {
      foregroundContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      foregroundContext.clearRect(0, 0, width, height);
    }

    const columnPaths = Array.from({ length: columns }, (_, index) => (
      buildColumn(index, columns, columnSamples, width, height, renderTime, pointer, phase)
    ));
    const rowPaths = Array.from({ length: rows }, (_, index) => (
      buildRow(index, rows, rowSamples, width, height, renderTime, pointer, phase)
    ));

    columnPaths.forEach((path, index) => {
      context.strokeStyle = `rgba(180, 160, 232, ${index % 4 === 0 ? 0.2 : 0.11})`;
      context.lineWidth = index % 4 === 0 ? 0.9 : 0.55;
      context.setLineDash(index % 4 === 0 ? [24, 14] : [1, 12]);
      context.lineDashOffset = reducedMotion ? 0 : renderTime * 0.009 - index * 7;
      drawPath(context, path);
    });

    rowPaths.forEach((path, index) => {
      context.strokeStyle = `rgba(200, 187, 239, ${index % 3 === 0 ? 0.34 : 0.22})`;
      context.lineWidth = index % 3 === 0 ? 1.2 : 0.75;
      context.setLineDash(index % 3 === 0 ? [48, 13, 4, 9] : [2, 8, 30, 11]);
      context.lineDashOffset = reducedMotion ? 0 : -(renderTime * 0.012 + index * 13);
      drawPath(context, path);
    });

    context.setLineDash([]);
    const foregroundLifts = reducedMotion
      ? []
      : electricPulses.render(context, rowPaths, renderTime, media.matches);
    if (foregroundContext && !reducedMotion) {
      foregroundLifts.forEach((lift) => {
        const path = rowPaths[lift.index];
        if (path) drawForegroundPath(foregroundContext, path, lift.index, renderTime, lift, media.matches);
      });
      electricPulses.renderForeground(foregroundContext, rowPaths, renderTime, media.matches);
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    ratio = Math.min(window.devicePixelRatio || 1, media.matches ? 1.2 : 1.6);
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (foregroundCanvas) {
      foregroundCanvas.width = Math.round(width * ratio);
      foregroundCanvas.height = Math.round(height * ratio);
    }
    render(performance.now());
  }

  function onPointerMove(event) {
    if (media.matches || reducedMotion) return;
    const bounds = canvas.getBoundingClientRect();
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    if (!inside) {
      pointer.targetActive = 0;
      return;
    }
    pointer.targetX = clamp((event.clientX - bounds.left) / bounds.width);
    pointer.targetY = clamp((event.clientY - bounds.top) / bounds.height);
    pointer.targetActive = 1;
  }

  function onPointerLeave() {
    pointer.targetActive = 0;
  }

  function loop(time) {
    if (!visible || document.hidden) {
      frameId = 0;
      return;
    }
    const interval = media.matches ? 50 : 32;
    if (time - lastFrame >= interval) {
      render(time);
      lastFrame = time;
    }
    frameId = requestAnimationFrame(loop);
  }

  function resume() {
    if (!reducedMotion && visible && !document.hidden && !frameId) frameId = requestAnimationFrame(loop);
  }

  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    if (!visible) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else {
      resume();
    }
  }, { threshold: 0.01 });

  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave);
  document.addEventListener('visibilitychange', resume);
  resume();

  onPageCleanup(() => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', resume);
  });
}
