import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

const MOBILE_QUERY = '(max-width: 720px), (pointer: coarse)';
const ASCII_GLYPHS = ['.', ':', '-', '~', '/', '|', '\\', '='];
const DIRECTION_GLYPHS = ['-', '/', '|', '\\', '-', '/', '|', '\\'];
const TAU = Math.PI * 2;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function cellIndex(field, x, y) {
  return x + y * field.stride;
}

function setBoundary(kind, values, field) {
  const { columns, rows } = field;
  for (let x = 1; x <= columns; x += 1) {
    values[cellIndex(field, x, 0)] = kind === 2 ? -values[cellIndex(field, x, 1)] : values[cellIndex(field, x, 1)];
    values[cellIndex(field, x, rows + 1)] = kind === 2 ? -values[cellIndex(field, x, rows)] : values[cellIndex(field, x, rows)];
  }
  for (let y = 1; y <= rows; y += 1) {
    values[cellIndex(field, 0, y)] = kind === 1 ? -values[cellIndex(field, 1, y)] : values[cellIndex(field, 1, y)];
    values[cellIndex(field, columns + 1, y)] = kind === 1 ? -values[cellIndex(field, columns, y)] : values[cellIndex(field, columns, y)];
  }
  values[cellIndex(field, 0, 0)] = 0.5 * (values[cellIndex(field, 1, 0)] + values[cellIndex(field, 0, 1)]);
  values[cellIndex(field, 0, rows + 1)] = 0.5 * (values[cellIndex(field, 1, rows + 1)] + values[cellIndex(field, 0, rows)]);
  values[cellIndex(field, columns + 1, 0)] = 0.5 * (values[cellIndex(field, columns, 0)] + values[cellIndex(field, columns + 1, 1)]);
  values[cellIndex(field, columns + 1, rows + 1)] = 0.5 * (values[cellIndex(field, columns, rows + 1)] + values[cellIndex(field, columns + 1, rows)]);
}

function linearSolve(kind, target, source, horizontal, vertical, divisor, field, iterations) {
  for (let pass = 0; pass < iterations; pass += 1) {
    for (let y = 1; y <= field.rows; y += 1) {
      for (let x = 1; x <= field.columns; x += 1) {
        const index = cellIndex(field, x, y);
        target[index] = (
          source[index]
          + horizontal * (target[index - 1] + target[index + 1])
          + vertical * (target[index - field.stride] + target[index + field.stride])
        ) / divisor;
      }
    }
    setBoundary(kind, target, field);
  }
}

function diffuse(kind, target, source, amount, delta, field, iterations) {
  const horizontal = delta * amount * field.columns * field.columns;
  const vertical = delta * amount * field.rows * field.rows;
  linearSolve(kind, target, source, horizontal, vertical, 1 + 2 * (horizontal + vertical), field, iterations);
}

function project(horizontal, vertical, pressure, divergence, field, iterations) {
  const { columns, rows, stride } = field;
  for (let y = 1; y <= rows; y += 1) {
    for (let x = 1; x <= columns; x += 1) {
      const index = cellIndex(field, x, y);
      divergence[index] = -0.5 * (
        (horizontal[index + 1] - horizontal[index - 1]) / columns
        + (vertical[index + stride] - vertical[index - stride]) / rows
      );
      pressure[index] = 0;
    }
  }
  setBoundary(0, divergence, field);
  setBoundary(0, pressure, field);
  linearSolve(0, pressure, divergence, 1, 1, 4, field, iterations);

  for (let y = 1; y <= rows; y += 1) {
    for (let x = 1; x <= columns; x += 1) {
      const index = cellIndex(field, x, y);
      horizontal[index] -= 0.5 * columns * (pressure[index + 1] - pressure[index - 1]);
      vertical[index] -= 0.5 * rows * (pressure[index + stride] - pressure[index - stride]);
    }
  }
  setBoundary(1, horizontal, field);
  setBoundary(2, vertical, field);
}

function advect(kind, target, source, horizontal, vertical, delta, field) {
  const { columns, rows } = field;
  const deltaX = delta * columns;
  const deltaY = delta * rows;
  for (let y = 1; y <= rows; y += 1) {
    for (let x = 1; x <= columns; x += 1) {
      const index = cellIndex(field, x, y);
      const backX = clamp(x - deltaX * horizontal[index], 0.5, columns + 0.5);
      const backY = clamp(y - deltaY * vertical[index], 0.5, rows + 0.5);
      const left = Math.floor(backX);
      const top = Math.floor(backY);
      const right = left + 1;
      const bottom = top + 1;
      const horizontalMix = backX - left;
      const verticalMix = backY - top;
      target[index] = (
        (1 - horizontalMix) * (
          (1 - verticalMix) * source[cellIndex(field, left, top)]
          + verticalMix * source[cellIndex(field, left, bottom)]
        )
        + horizontalMix * (
          (1 - verticalMix) * source[cellIndex(field, right, top)]
          + verticalMix * source[cellIndex(field, right, bottom)]
        )
      );
    }
  }
  setBoundary(kind, target, field);
}

function stepFluid(field, mobile) {
  const iterations = mobile ? 3 : 5;
  const delta = mobile ? 0.14 : 0.12;
  diffuse(1, field.horizontalPrevious, field.horizontal, 0.000012, delta, field, iterations);
  diffuse(2, field.verticalPrevious, field.vertical, 0.000012, delta, field, iterations);
  project(field.horizontalPrevious, field.verticalPrevious, field.pressure, field.divergence, field, iterations);
  advect(1, field.horizontal, field.horizontalPrevious, field.horizontalPrevious, field.verticalPrevious, delta, field);
  advect(2, field.vertical, field.verticalPrevious, field.horizontalPrevious, field.verticalPrevious, delta, field);
  project(field.horizontal, field.vertical, field.pressure, field.divergence, field, iterations);
  diffuse(0, field.densityPrevious, field.density, 0.00002, delta, field, iterations);
  advect(0, field.density, field.densityPrevious, field.horizontal, field.vertical, delta, field);

  for (let index = 0; index < field.size; index += 1) {
    field.horizontal[index] *= 0.994;
    field.vertical[index] *= 0.994;
    field.density[index] *= 0.991;
  }
}

function pseudoRandom(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function seedFluid(field) {
  for (let y = 1; y <= field.rows; y += 1) {
    for (let x = 1; x <= field.columns; x += 1) {
      const index = cellIndex(field, x, y);
      const normalizedX = x / field.columns;
      const normalizedY = y / field.rows;
      const phase = normalizedX * 6.1 + normalizedY * 8.7 + Math.sin(normalizedY * TAU) * 1.15;
      const ribbon = Math.exp(-Math.pow(Math.sin(phase), 2) * 8.5);
      field.density[index] = 0.025 + ribbon * 0.23;
      field.horizontal[index] = 0.006 + Math.cos(phase * 0.72) * 0.006;
      field.vertical[index] = Math.sin(phase * 0.58) * 0.005;
      field.jitterX[index] = pseudoRandom(x, y) - 0.5;
      field.jitterY[index] = pseudoRandom(y + 11, x + 7) - 0.5;
      field.visibility[index] = pseudoRandom(x + 29, y + 31);
    }
  }
}

function createFluid(width, height, mobile) {
  const cellSize = mobile ? 20 : 22;
  const columns = Math.round(clamp(Math.floor(width / cellSize), 16, mobile ? 32 : 84));
  const rows = Math.round(clamp(Math.floor(height / cellSize), 24, mobile ? 110 : 92));
  const stride = columns + 2;
  const size = stride * (rows + 2);
  const field = {
    columns,
    rows,
    stride,
    size,
    horizontal: new Float32Array(size),
    vertical: new Float32Array(size),
    horizontalPrevious: new Float32Array(size),
    verticalPrevious: new Float32Array(size),
    density: new Float32Array(size),
    densityPrevious: new Float32Array(size),
    pressure: new Float32Array(size),
    divergence: new Float32Array(size),
    jitterX: new Float32Array(size),
    jitterY: new Float32Array(size),
    visibility: new Float32Array(size),
  };
  seedFluid(field);
  return field;
}

function inject(field, normalizedX, normalizedY, forceX, forceY, dye, radius, swirl = 0) {
  const centerX = clamp(normalizedX) * field.columns + 1;
  const centerY = clamp(normalizedY) * field.rows + 1;
  const reach = Math.ceil(radius * 2);
  const startX = Math.max(1, Math.floor(centerX - reach));
  const endX = Math.min(field.columns, Math.ceil(centerX + reach));
  const startY = Math.max(1, Math.floor(centerY - reach));
  const endY = Math.min(field.rows, Math.ceil(centerY + reach));

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const offsetX = x - centerX;
      const offsetY = y - centerY;
      const weight = Math.exp(-(offsetX * offsetX + offsetY * offsetY) / (radius * radius));
      const index = cellIndex(field, x, y);
      field.horizontal[index] += (forceX - offsetY / radius * swirl) * weight;
      field.vertical[index] += (forceY + offsetX / radius * swirl) * weight;
      field.density[index] = Math.min(2.4, field.density[index] + dye * weight);
    }
  }
}

function injectAmbient(field, time, mobile) {
  const emitters = mobile ? 3 : 5;
  for (let index = 0; index < emitters; index += 1) {
    const phase = time * 0.00011 + index * 1.9;
    const x = 0.5 + Math.sin(phase * 0.83) * 0.38;
    const y = (index + 0.5) / emitters + Math.cos(phase) * 0.035;
    inject(field, x, y, 0.0035 + Math.cos(phase) * 0.002, Math.sin(phase * 1.17) * 0.0035, 0.012, mobile ? 2.2 : 2.8, 0.0018);
  }
}

function renderAscii(context, field, width, height) {
  const cellWidth = width / field.columns;
  const cellHeight = height / field.rows;
  const fontSize = clamp(Math.min(cellWidth, cellHeight) * 0.7, 9, 15);
  context.clearRect(0, 0, width, height);
  context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = 'rgb(187, 165, 235)';

  for (let y = 1; y <= field.rows; y += 1) {
    for (let x = 1; x <= field.columns; x += 1) {
      const index = cellIndex(field, x, y);
      const density = field.density[index];
      const speed = Math.hypot(field.horizontal[index], field.vertical[index]);
      const energy = clamp(density * 1.5 + speed * 4.2);
      if (energy < 0.055 || field.visibility[index] > clamp(energy * 2.7, 0.22, 0.94)) continue;

      let glyph = ASCII_GLYPHS[0];
      if (energy < 0.13) glyph = ASCII_GLYPHS[1];
      else if (speed < 0.004) glyph = ASCII_GLYPHS[3];
      else {
        const direction = (Math.atan2(field.vertical[index], field.horizontal[index]) + TAU) % TAU;
        glyph = DIRECTION_GLYPHS[Math.round(direction / TAU * 8) % 8];
      }

      context.globalAlpha = clamp(0.04 + energy * 0.55, 0.04, 0.42);
      context.fillText(
        glyph,
        (x - 0.5 + field.jitterX[index] * 0.34) * cellWidth,
        (y - 0.5 + field.jitterY[index] * 0.34) * cellHeight,
      );
    }
  }
  context.globalAlpha = 1;
}

function initField(root) {
  const canvas = root.querySelector('[data-service-field-canvas]');
  const section = root.closest('[data-services-section]');
  const context = canvas?.getContext('2d');
  if (!canvas || !context || !section) return;

  const media = window.matchMedia(MOBILE_QUERY);
  const reducedMotion = prefersReduced();
  const pointer = { x: 0.5, y: 0.5, deltaX: 0, deltaY: 0, energy: 0, inside: false };
  let width = 0;
  let height = 0;
  let ratio = 1;
  let fluid;
  let frameId = 0;
  let lastFrame = 0;
  let visible = true;

  function render(time, advance = true) {
    if (!fluid) return;
    if (advance) {
      injectAmbient(fluid, time, media.matches);
      if (pointer.inside) {
        const activity = Math.max(0.24, pointer.energy);
        inject(
          fluid,
          pointer.x,
          pointer.y,
          pointer.deltaX * 0.92,
          pointer.deltaY * 0.92,
          0.038 * activity,
          media.matches ? 2.4 : 3.4,
          0.008 * activity,
        );
        pointer.deltaX *= 0.7;
        pointer.deltaY *= 0.7;
        pointer.energy *= 0.93;
      }
      stepFluid(fluid, media.matches);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    renderAscii(context, fluid, width, height);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    ratio = Math.min(window.devicePixelRatio || 1, media.matches ? 1.1 : 1.3);
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    fluid = createFluid(width, height, media.matches);
    render(3600, false);
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

  function onPointerMove(event) {
    if (reducedMotion) return;
    const bounds = canvas.getBoundingClientRect();
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    if (!inside) {
      pointer.inside = false;
      return;
    }
    const nextX = clamp((event.clientX - bounds.left) / bounds.width);
    const nextY = clamp((event.clientY - bounds.top) / bounds.height);
    if (pointer.inside) {
      pointer.deltaX = clamp(pointer.deltaX * 0.35 + (nextX - pointer.x) * 1.8, -0.12, 0.12);
      pointer.deltaY = clamp(pointer.deltaY * 0.35 + (nextY - pointer.y) * 1.8, -0.12, 0.12);
    }
    pointer.x = nextX;
    pointer.y = nextY;
    pointer.energy = 1;
    pointer.inside = true;
  }

  function onPointerLeave() {
    pointer.inside = false;
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
  intersectionObserver.observe(root);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('blur', onPointerLeave);
  document.addEventListener('visibilitychange', resume);
  resume();

  onPageCleanup(() => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('blur', onPointerLeave);
    document.removeEventListener('visibilitychange', resume);
  });
}

export default function initServiceFields() {
  document.querySelectorAll('[data-service-field]').forEach(initField);
}
