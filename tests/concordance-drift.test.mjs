import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitial, mismatchedEdges, validate } from '../src/scripts/features/concordance/model.js';
import { VALID_MASKS } from '../src/scripts/features/concordance/glyphs.js';
import { createDrift, planDriftFrame, planDriftStep } from '../src/scripts/features/concordance/drift.js';

function random(seed) {
  return () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 2 ** 32);
}
const edgeKey = edge => [...edge].sort((a, b) => a - b).join(':');

for (const [width, height] of [[14, 8], [6, 10], [2, 2]]) {
  test(`${width}×${height}: persistent repairs preserve exactly two defects without dead ends`, () => {
    const initial = createInitial({ width, height, ...(width === 2 ? {
      minMass: 0, maxMass: 1, minQuiet: 0, maxQuiet: 1, minLightMass: 0, maxLightMass: 1,
    } : {}) });
    const before = structuredClone(initial);
    const rng = random(81);
    let flow = createDrift(initial);
    const visited = new Set(), tempos = new Set(), fronts = new Set(), inks = new Set();
    for (let tick = 0; tick < 1600; tick++) {
      const previous = flow;
      const snapshot = structuredClone(flow);
      const plan = planDriftStep(flow, { root: 0, random: rng });
      assert.ok(plan.accepted, `must keep moving at step ${tick}`);
      assert.deepEqual(flow, snapshot, 'planning cannot mutate an in-flight frame');
      flow = plan.flow;
      const { state } = flow;
      assert.equal(state.revision, tick + 1);
      assert.equal(plan.steps.length, 1);
      const changed = state.cells.filter((cell, i) =>
        cell.mask !== previous.state.cells[i].mask || cell.ink !== previous.state.cells[i].ink);
      assert.equal(changed.length, 1, 'each shape and color repair is local to one cell');
      assert.notEqual(changed[0].mask, previous.state.cells[changed[0].id].mask);
      assert.notEqual(changed[0].ink, previous.state.cells[changed[0].id].ink,
        'the cascade changes color together with shape');
      const edges = mismatchedEdges(state);
      assert.equal(edges.length, 2, 'the two defects can move but never annihilate');
      assert.deepEqual(edges.map(edgeKey).sort(), flow.defects.map(edgeKey).sort());
      if (tick) {
        const oldEdges = mismatchedEdges(previous.state).map(edgeKey);
        assert.equal(edges.filter(edge => oldEdges.includes(edgeKey(edge))).length, 1,
          'one defect transfers while the other is conserved');
      }
      for (const cell of state.cells) {
        assert.ok(VALID_MASKS.includes(cell.mask));
        assert.ok(Number.isInteger(cell.ink) && cell.ink >= 0 && cell.ink < 4);
        assert.equal(cell.motif, initial.cells[cell.id].motif);
      }
      assert.ok(validate(state, { art: false }).errors.every(error => error.startsWith('edge:')),
        'all borders stay closed; only the two intended shared edges may disagree');
      assert.ok(plan.motion.morph >= .18 && plan.motion.morph <= .62);
      assert.equal(flow.visits.length, width * height, 'memory stays bounded');
      visited.add(plan.steps[0].id);
      fronts.add(flow.active);
      tempos.add(plan.motion.morph.toFixed(3));
      inks.add(plan.steps[0].to.ink);
    }
    assert.ok(visited.size >= width * height * .75, 'the flow explores the grid');
    assert.equal(fronts.size, 2, 'both defects must travel');
    assert.ok(tempos.size > 30, 'cadence cannot become a fixed repeating interval');
    assert.equal(inks.size, 4, 'the cascade must explore the whole blue–purple palette');
    assert.deepEqual(initial, before);
  });
}

test('entropy changes the route while injected entropy makes a session reproducible', () => {
  const state = createInitial({ width: 14, height: 8 });
  const trace = seed => {
    let flow = createDrift(state);
    const rng = random(seed), steps = [];
    for (let i = 0; i < 40; i++) {
      const plan = planDriftStep(flow, { root: 45, random: rng });
      flow = plan.flow;
      steps.push([plan.steps[0].id, plan.steps[0].to.mask, plan.steps[0].to.ink, plan.motion.morph]);
    }
    return steps;
  };
  assert.deepEqual(trace(7), trace(7));
  assert.notDeepEqual(trace(7), trace(8));
});

test('pointer steering attracts the existing flow without restarting it at the pointer', () => {
  let flow = createDrift(createInitial({ width: 14, height: 8 }));
  const rng = random(123);
  flow = planDriftStep(flow, { root: 0, random: rng }).flow;
  for (let i = 0; i < 80; i++) {
    const endpoints = flow.defects.flat();
    const plan = planDriftStep(flow, { root: 110, focus: 110, random: rng });
    assert.ok(endpoints.includes(plan.steps[0].id), 'a pointer cannot teleport a defect');
    assert.equal(mismatchedEdges(plan.target).length, 2);
    flow = plan.flow;
  }
});

for (const [width, height, sourceCount] of [[14, 8, 3], [6, 10, 2]]) {
  test(`${width}×${height}: ${sourceCount} cascades propagate simultaneously without collisions`, () => {
    const initial = createInitial({ width, height });
    const roots = initial.cells.map(cell => cell.id);
    const rng = random(405);
    let flow = createDrift(initial);
    for (let frame = 0; frame < 600; frame++) {
      const before = flow.state;
      const plan = planDriftFrame(flow, { roots, sourceCount, random: rng });
      assert.ok(plan.accepted);
      assert.equal(plan.steps.length, sourceCount);
      assert.equal(new Set(plan.steps.map(step => step.id)).size, sourceCount,
        'one frame cannot update the same cell from two origins');
      for (const step of plan.steps) {
        assert.notEqual(step.from.mask, step.to.mask);
        assert.notEqual(step.from.ink, step.to.ink);
        assert.deepEqual(step.from, before.cells[step.id]);
      }
      flow = plan.flow;
      assert.equal(flow.defects.length, sourceCount * 2);
      assert.equal(mismatchedEdges(flow.state).length, sourceCount * 2,
        'each origin conserves its pair of travelling defects');
    }
  });
}
