import { validate, neighbor, direction, beauty, metrics } from './model.js';

const sameEdge = (a, b) => a[0] === b[0] && a[1] === b[1] || a[0] === b[1] && a[1] === b[0];
const distance = (a, b, width) => Math.abs(a % width - b % width) + Math.abs(Math.floor(a / width) - Math.floor(b / width));

export function createDrift(state) {
  if (!validate(state).ok) throw new Error('A drift must start from a valid static composition.');
  return { state, defects: [], active: 0, run: 0, tick: 0, tempo: .34,
    visits: Array(state.cells.length).fill(-100) };
}

function adjacent(id, { width, height }) {
  return [0, 1, 2, 3].map(port => ({ port, id: neighbor(id, port, width, height) }))
    .filter(cell => cell.id >= 0);
}

function change(state, id, incoming, outgoing, ink) {
  const cells = state.cells.slice();
  cells[id] = { ...cells[id], mask: cells[id].mask ^ (1 << incoming) ^ (1 << outgoing), ink };
  return { ...state, cells, revision: state.revision + 1 };
}

// Density is a restoring force, not a hard gate that could deadlock a repair.
function energy(state) {
  const m = metrics(state), c = state.config;
  const outside = (value, min, max) => Math.max(0, min - value, value - max);
  return 32 * beauty(state) + 100 * (
    outside(m.mass, c.minMass, c.maxMass) + outside(m.quiet, c.minQuiet, c.maxQuiet) +
    outside(m.light, c.minLightMass, c.maxLightMass));
}

function choose(candidates, score, random) {
  const scores = candidates.map(score), min = Math.min(...scores);
  const weights = scores.map(value => Math.exp(min - value));
  let pick = random() * weights.reduce((sum, weight) => sum + weight, 0);
  return candidates.find((_, i) => (pick -= weights[i]) < 0) ?? candidates.at(-1);
}

function addColorCandidates(candidates, state, candidate) {
  for (let ink = 0; ink < 4; ink++) {
    if (ink === state.cells[candidate.id].ink) continue;
    candidates.push({ ...candidate, ink,
      target: change(state, candidate.id, candidate.incoming, candidate.outgoing, ink) });
  }
}

function scoreCandidate(flow, candidate, { focus, roots }) {
  const { state, tick } = flow, { width } = state.config;
  const age = tick - flow.visits[candidate.id];
  const repetition = 2.8 * Math.exp(-age / 6);
  const switching = candidate.active === flow.active ? 0 : Math.max(0, 2.1 - flow.run * .14);
  const destination = candidate.defects[candidate.active][1];
  const attraction = focus >= 0 ? .28 * distance(destination, focus, width) : 0;
  const visibility = roots.length ? 2.4 * Math.min(...roots.map(root => distance(destination, root, width))) : 0;
  const neighbors = adjacent(candidate.id, state.config);
  const matchingNeighbors = neighbors.filter(({ id }) => state.cells[id].ink === candidate.ink).length;
  const colorRhythm = Math.abs(matchingNeighbors - 1) * .18;
  return energy(candidate.target) + repetition + switching + attraction + visibility + colorRhythm +
    (candidate.reverse ? .7 : 0);
}

function accept(flow, selected, random) {
  const visits = flow.visits.slice();
  visits[selected.id] = flow.tick;
  const tempo = .72 * flow.tempo + .28 * (.20 + random() * .38);
  const next = { state: selected.target, defects: selected.defects, active: selected.active,
    run: selected.active === flow.active ? flow.run + 1 : 1, tick: flow.tick + 1, visits, tempo };
  return { accepted: true, root: selected.id, target: selected.target, flow: next,
    motion: { lead: .035, hop: 0, morph: tempo, settle: 0 },
    steps: [{ id: selected.id, depth: 0, incoming: selected.incoming, outgoing: selected.outgoing,
      from: flow.state.cells[selected.id], to: selected.target.cells[selected.id] }] };
}

function birthCandidates(flow, root) {
  const { state, defects } = flow, candidates = [];
  if (!Number.isInteger(root) || root < 0 || root >= state.cells.length) throw new RangeError('Invalid drift origin.');
  const neighbors = adjacent(root, state.config).filter(next =>
    !defects.some(edge => sameEdge(edge, [root, next.id])));
  for (let a = 0; a < neighbors.length - 1; a++) for (let b = a + 1; b < neighbors.length; b++) {
    const incoming = neighbors[a].port, outgoing = neighbors[b].port;
    addColorCandidates(candidates, state, { id: root, incoming, outgoing,
      active: defects.length, reverse: false,
      defects: [...defects.map(edge => [...edge]), [root, neighbors[a].id], [root, neighbors[b].id]] });
  }
  return candidates;
}

function walkingCandidates(flow, activeIndexes, forbiddenIds) {
  const { state, defects } = flow, { width } = state.config, candidates = [];
  activeIndexes.forEach(active => {
    const edge = defects[active];
    if (!edge) return;
    for (const reverse of [false, true]) {
      const [tail, id] = reverse ? [...edge].reverse() : edge;
      if (forbiddenIds.has(id)) continue;
      const incoming = direction(id, tail, width);
      const options = adjacent(id, state.config).filter(next => next.id !== tail &&
        !defects.some((other, index) => index !== active && sameEdge([id, next.id], other)));
      for (const next of options) {
        const updated = defects.map(defect => [...defect]);
        updated[active] = [id, next.id];
        addColorCandidates(candidates, state, { id, incoming, outgoing: next.port,
          active, reverse, defects: updated });
      }
      if (options.length) break;
    }
  });
  return candidates;
}

/**
 * An even tile toggles two internal ports. At birth this creates two defects.
 * Every later move toggles exactly one mismatched and one matching edge:
 * E = number of mismatched edges = 2 is therefore conserved indefinitely.
 * Closing the other defect is forbidden. Forward motion is preferred, but a
 * trapped frontier may reverse so even a 2×2 grid always has a legal move.
 */
export function planDriftStep(flow, { root = 0, focus = -1, roots = [], random = Math.random,
    activeIndexes = null, forbiddenIds = new Set() } = {}) {
  const candidates = flow.defects.length
    ? walkingCandidates(flow, activeIndexes ?? flow.defects.map((_, index) => index), forbiddenIds)
    : birthCandidates(flow, root);
  if (!candidates.length) return { accepted: false, reason: 'no-legal-continuation', flow };
  return accept(flow, choose(candidates, candidate => scoreCandidate(flow, candidate, { focus, roots }), random), random);
}

function dispersedRoots(roots, count, first, width, random) {
  const pool = [...new Set(roots)], selected = [];
  if (!pool.length) return selected;
  selected.push(pool.includes(first) ? first : pool[Math.floor(random() * pool.length)]);
  while (selected.length < Math.min(count, pool.length)) {
    const candidates = pool.filter(root => !selected.includes(root));
    const distances = candidates.map(root => Math.min(...selected.map(other => distance(root, other, width))));
    const farthest = Math.max(...distances);
    const choices = candidates.filter((_, index) => distances[index] === farthest);
    selected.push(choices[Math.floor(random() * choices.length)]);
  }
  return selected;
}

/** Advance one cell per origin and render all origins in the same visual pulse. */
export function planDriftFrame(flow, { root = -1, focus = -1, roots = [], sourceCount = 2,
    random = Math.random } = {}) {
  if (!Number.isInteger(sourceCount) || sourceCount < 2 || sourceCount > 4)
    throw new RangeError('sourceCount must be an integer in 2..4.');
  let working = flow;
  const steps = [];
  if (!working.defects.length) {
    const origins = dispersedRoots(roots.length ? roots : working.state.cells.map(cell => cell.id),
      sourceCount, root, working.state.config.width, random);
    for (const origin of origins) {
      const candidates = birthCandidates(working, origin);
      if (!candidates.length) continue;
      const plan = accept(working,
        choose(candidates, candidate => scoreCandidate(working, candidate, { focus, roots }), random), random);
      working = plan.flow;
      steps.push(plan.steps[0]);
    }
  } else {
    const sources = Math.min(sourceCount, Math.floor(working.defects.length / 2));
    const forbiddenIds = new Set();
    for (let source = 0; source < sources; source++) {
      const plan = planDriftStep(working, { focus, roots, random,
        activeIndexes: [source * 2, source * 2 + 1], forbiddenIds });
      if (!plan.accepted) continue;
      working = plan.flow;
      steps.push(plan.steps[0]);
      forbiddenIds.add(plan.steps[0].id);
    }
  }
  if (steps.length < 2) return { accepted: false, reason: 'insufficient-simultaneous-origins', flow };
  return { accepted: true, root: steps[0].id, target: working.state, flow: working, steps,
    motion: { lead: .035, hop: 0, morph: working.tempo, settle: 0 } };
}
