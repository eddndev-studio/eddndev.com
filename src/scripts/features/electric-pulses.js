const TAU = Math.PI * 2;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const ELECTRIC_FILAMENTS = [
  { seedOffset: 0, phase: 0, spread: 0, wave: 0.35, jitter: 1, opacity: 1, color: '73, 173, 255' },
  { seedOffset: 97, phase: 1.6, spread: -1, wave: 1, jitter: 0.72, opacity: 0.68, color: '139, 76, 255' },
  { seedOffset: 211, phase: 3.7, spread: 1, wave: 0.86, jitter: 0.76, opacity: 0.62, color: '78, 214, 255' },
  { seedOffset: 347, phase: 5.2, spread: -0.25, wave: 0.68, jitter: 0.56, opacity: 0.44, color: '185, 121, 255' },
];

function pointOnPath(points, progress) {
  const position = clamp(progress) * (points.length - 1);
  const start = Math.floor(position);
  const end = Math.min(points.length - 1, start + 1);
  const amount = position - start;
  return {
    x: lerp(points[start].x, points[end].x, amount),
    y: lerp(points[start].y, points[end].y, amount),
  };
}

function electricNoise(seed, position, time) {
  const value = Math.sin(seed * 12.9898 + position * 78.233 + Math.floor(time / 42) * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function createRandom(seed) {
  let state = Math.imul(seed || 1, 0x9e3779b1) >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function createPulse(time, rowCount, mobile, random, allowForeground) {
  return {
    index: Math.floor(random() * rowCount),
    startedAt: time,
    duration: mobile ? 1050 + random() * 560 : 1200 + random() * 760,
    direction: random() < 0.5 ? -1 : 1,
    span: 0.18 + random() * 0.13,
    seed: random() * 1000,
    foreground: allowForeground && random() < (mobile ? 0.4 : 0.52),
  };
}

function updatePulses(state, time, rowCount, mobile, random) {
  state.items = state.items.filter((pulse) => time - pulse.startedAt <= pulse.duration);
  if (!state.nextAt) {
    state.nextAt = time + 180 + random() * 260;
  } else if (time >= state.nextAt) {
    if (state.items.length < (mobile ? 2 : 3)) {
      const allowForeground = !state.items.some((pulse) => pulse.foreground);
      state.items.push(createPulse(time, rowCount, mobile, random, allowForeground));
    }
    state.nextAt = time + (mobile ? 850 + random() * 700 : 380 + random() * 560);
  }
}

function pulseCenter(pulse, time) {
  const life = clamp((time - pulse.startedAt) / pulse.duration);
  return pulse.direction > 0
    ? lerp(-pulse.span * 0.5, 1 + pulse.span * 0.5, life)
    : lerp(1 + pulse.span * 0.5, -pulse.span * 0.5, life);
}

function foregroundLift(pulse, time, mobile) {
  const life = clamp((time - pulse.startedAt) / pulse.duration);
  return {
    index: pulse.index,
    center: pulseCenter(pulse, time),
    radius: Math.min(mobile ? 0.34 : 0.3, pulse.span * 1.25),
    strength: Math.pow(Math.sin(life * Math.PI), 0.45),
  };
}

function buildElectricArc(path, pulse, time, mobile, filament) {
  const center = pulseCenter(pulse, time);
  const start = Math.max(0, center - pulse.span * 0.5);
  const end = Math.min(1, center + pulse.span * 0.5);
  if (start >= end) return [];

  const samples = mobile ? 16 : 28;
  return Array.from({ length: samples + 1 }, (_, index) => {
    const local = index / samples;
    const progress = lerp(start, end, local);
    const point = pointOnPath(path, progress);
    const before = pointOnPath(path, progress - 0.008);
    const after = pointOnPath(path, progress + 0.008);
    const tangentX = after.x - before.x;
    const tangentY = after.y - before.y;
    const length = Math.hypot(tangentX, tangentY) || 1;
    const taper = Math.pow(Math.sin(local * Math.PI), 0.45);
    const filamentSeed = pulse.seed + filament.seedOffset;
    const coarse = electricNoise(filamentSeed, index * 1.7, time) - 0.5;
    const fine = electricNoise(filamentSeed + 17, index * 4.1, time * 1.37) - 0.5;
    const jitter = (coarse * (mobile ? 3.5 : 5.4) + fine * 2) * filament.jitter;
    const wave = Math.sin(
      local * TAU * (2.3 + filament.wave)
        + time * 0.009 * pulse.direction
        + filament.phase,
    ) * filament.wave * (mobile ? 1.5 : 2.35);
    const spread = filament.spread * (mobile ? 1.3 : 2.1);
    const displacement = (jitter + wave + spread) * taper;
    return {
      x: point.x - tangentY / length * displacement,
      y: point.y + tangentX / length * displacement,
    };
  });
}

function drawElectricLayer(context, points, lineWidth, color, opacity, strength, seed, time) {
  for (let index = 1; index < points.length; index += 1) {
    const local = (index - 0.5) / (points.length - 1);
    const taper = Math.pow(Math.sin(local * Math.PI), 0.35);
    const flicker = 0.72 + electricNoise(seed + 31, index, time) * 0.28;
    context.beginPath();
    context.moveTo(points[index - 1].x, points[index - 1].y);
    context.lineTo(points[index].x, points[index].y);
    context.lineWidth = lineWidth;
    context.strokeStyle = `rgba(${color}, ${opacity * strength * taper * flicker})`;
    context.stroke();
  }
}

function drawChargedCable(context, path, pulse, time, mobile, strength) {
  const center = pulseCenter(pulse, time);
  for (let index = 1; index < path.length; index += 1) {
    const progress = (index - 0.5) / (path.length - 1);
    const signedDistance = (progress - center) * pulse.direction;
    const reach = signedDistance >= 0 ? pulse.span * 2.35 : pulse.span * 1.25;
    const charge = Math.exp(-Math.pow(Math.abs(progress - center) / reach, 2) * 2.4);
    if (charge < 0.025) continue;
    const flicker = 0.82 + electricNoise(pulse.seed + 73, index, time * 0.8) * 0.18;
    const alpha = charge * strength * flicker;
    const from = path[index - 1];
    const to = path[index];
    const layers = [
      [mobile ? 6 : 10, '57, 214, 255', 0.075],
      [mobile ? 3 : 4.6, '139, 76, 255', 0.18],
      [mobile ? 1 : 1.35, '126, 224, 255', 0.58],
    ];
    layers.forEach(([lineWidth, color, opacity]) => {
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.lineWidth = lineWidth;
      context.strokeStyle = `rgba(${color}, ${opacity * alpha})`;
      context.stroke();
    });
  }
}

function drawSecondaryFilament(context, points, filament, pulse, time, mobile, strength) {
  const filamentStrength = strength * filament.opacity;
  const seed = pulse.seed + filament.seedOffset;
  drawElectricLayer(context, points, mobile ? 3 : 4.2, '62, 91, 255', 0.1, filamentStrength, seed, time);
  drawElectricLayer(context, points, mobile ? 1.2 : 1.55, filament.color, 0.72, filamentStrength, seed, time);
  drawElectricLayer(context, points, 0.55, '218, 237, 255', 0.7, filamentStrength, seed, time);
}

function drawElectricPulse(context, pulse, path, time, mobile) {
  const life = clamp((time - pulse.startedAt) / pulse.duration);
  const filaments = ELECTRIC_FILAMENTS
    .slice(0, mobile ? 3 : ELECTRIC_FILAMENTS.length)
    .map((filament) => ({
      filament,
      points: buildElectricArc(path, pulse, time, mobile, filament),
    }));
  const primary = filaments[0];
  if (!primary || primary.points.length < 2) return;
  const strength = Math.pow(Math.sin(life * Math.PI), 0.32)
    * (0.86 + electricNoise(pulse.seed, 0, time * 1.9) * 0.14);

  context.save();
  context.setLineDash([]);
  context.lineCap = 'round';
  drawChargedCable(context, path, pulse, time, mobile, strength);
  filaments.slice(1).forEach(({ filament, points }) => {
    drawSecondaryFilament(context, points, filament, pulse, time, mobile, strength);
  });
  drawElectricLayer(context, primary.points, mobile ? 6 : 8.5, '62, 91, 255', 0.14, strength, pulse.seed, time);
  drawElectricLayer(context, primary.points, mobile ? 3.2 : 4.5, '139, 76, 255', 0.32, strength, pulse.seed, time);
  drawElectricLayer(context, primary.points, mobile ? 1.6 : 2.2, '73, 173, 255', 0.88, strength, pulse.seed, time);
  drawElectricLayer(context, primary.points, 0.8, '228, 244, 255', 0.98, strength, pulse.seed, time);
  context.restore();
}

export function createElectricPulses(seed) {
  const random = createRandom(seed);
  const state = { items: [], nextAt: 0 };
  return {
    render(context, rowPaths, time, mobile) {
      updatePulses(state, time, rowPaths.length, mobile, random);
      state.items.forEach((pulse) => {
        drawElectricPulse(context, pulse, rowPaths[pulse.index], time, mobile);
      });
      return state.items
        .filter((pulse) => pulse.foreground)
        .map((pulse) => foregroundLift(pulse, time, mobile));
    },
    renderForeground(context, rowPaths, time, mobile) {
      state.items.forEach((pulse) => {
        if (!pulse.foreground || !rowPaths[pulse.index]) return;
        drawElectricPulse(context, pulse, rowPaths[pulse.index], time, mobile);
      });
    },
  };
}
