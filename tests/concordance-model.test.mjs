import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitial, planCascade, validate, intermediateState, mismatchedEdges } from '../src/scripts/features/concordance/model.js';
import { svgMarkup } from '../src/scripts/features/concordance/markup.js';

for (const [width, height] of [[14, 8], [6, 10]]) {
  test(`${width}×${height} compositions are reproducible and close every shared edge`, () => {
    const config = { width, height, maxReach: 16 };
    const initial = createInitial(config);
    assert.equal(initial.cells.length, width * height);
    assert.deepEqual(initial, createInitial(config));
    assert.equal(validate(initial).ok, true);
    let state = initial;
    let accepted = 0;
    for (let i = 0; i < 64; i++) {
      const root = i % state.cells.length;
      const plan = planCascade(state, root);
      assert.deepEqual(plan, planCascade(state, root));
      if (!plan.accepted) continue;
      accepted++;
      assert.equal(validate(plan.target).ok, true);
      assert.equal(plan.path[0], root);
      assert.equal(new Set(plan.path).size, plan.path.length);
      assert.ok(plan.steps.length <= config.maxReach);
      assert.ok(plan.examined <= state.config.maxCandidates);
      assert.deepEqual(plan.target.cells.map(c => c.ink), state.cells.map(c => c.ink));
      // A single frontier travels around the circuit; it cannot branch or leak.
      for (let completed = 1; completed < plan.steps.length; completed++) {
        assert.equal(mismatchedEdges(intermediateState(state, plan, completed)).length, 2);
      }
      assert.equal(mismatchedEdges(plan.target).length, 0);
      state = plan.target;
    }
    assert.ok(accepted > 48, 'most cells should be able to start a cascade');
    assert.deepEqual(initial, createInitial(config), 'planning must not mutate the SSR state');
  });

  test(`${width}×${height} SVG renders the full static composition before JavaScript`, () => {
    const state = createInitial({ width, height });
    const markup = svgMarkup(state, { id: 'home-mosaic' });
    assert.match(markup, new RegExp(`viewBox="0 0 ${width * 100} ${height * 100}"`));
    assert.equal((markup.match(/data-cell=/g) || []).length, state.cells.length);
    assert.ok((markup.match(/data-old-path d="M/g) || []).length > 8);
    assert.match(markup, /aria-hidden="true"/);
    assert.doesNotMatch(markup, /data-debug|<script|https:\/\/cdn/);
    assert.throws(() => svgMarkup(state, { id: 'invalid"id' }));
  });
}
