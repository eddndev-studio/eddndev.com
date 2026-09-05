import assert from 'node:assert/strict';
import test from 'node:test';
import { fieldOpacity } from '../src/scripts/features/concordance/field.js';
import { coverGeometry, visibleRoots } from '../src/scripts/features/concordance/ambient.js';
import { createInitial } from '../src/scripts/features/concordance/model.js';
import { svgMarkup } from '../src/scripts/features/concordance/markup.js';
import { createDrift, planDriftStep } from '../src/scripts/features/concordance/drift.js';

for (const [width, height, viewportWidth, viewportHeight] of [[14, 8, 1440, 1000], [6, 10, 390, 844]]) {
  test(`${width}×${height}: the field leaves clear space and starts repairs in the exposed area`, () => {
    const config = { width, height };
    const exposure = Array.from({ length: width * height }, (_, id) => fieldOpacity(id, config));
    assert.ok(exposure.every(value => value >= 0 && value <= 1));
    assert.ok(exposure.filter(value => value === 0).length >= exposure.length * .4,
      'the field must leave a substantial part of the hero completely clear');
    assert.ok(exposure.slice(0, width).every(value => value === 0), 'navigation stays clear');
    assert.ok(exposure.slice(-width).every(value => value === 0), 'the field ends before the next section');
    const rect = { left: 0, top: 0, width: viewportWidth, height: viewportHeight,
      right: viewportWidth, bottom: viewportHeight };
    const roots = visibleRoots(coverGeometry(rect, config), config, rect);
    assert.ok(roots.length >= 4);
    assert.ok(roots.every(id => exposure[id] >= .18), 'random origins must account for the actual mask');
    const markup = svgMarkup(createInitial(config));
    const rendered = [...markup.matchAll(/<svg data-cell="(\d+)"[^>]*opacity="([\d.]+)"/g)];
    assert.equal(rendered.length, width * height, 'the mask is present in the initial HTML');
    rendered.forEach(([, id, opacity]) => assert.equal(Number(opacity), exposure[id]));
  });

  test(`${width}×${height}: ongoing repairs remain concentrated in the exposed field`, () => {
    const state = createInitial({ width, height });
    const rect = { left: 0, top: 0, width: viewportWidth, height: viewportHeight,
      right: viewportWidth, bottom: viewportHeight };
    const roots = visibleRoots(coverGeometry(rect, state.config), state.config, rect);
    let flow = createDrift(state), exposed = 0, seed = 127;
    const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 2 ** 32);
    for (let i = 0; i < 1000; i++) {
      const plan = planDriftStep(flow, { root: roots[0], roots, random });
      flow = plan.flow;
      if (fieldOpacity(plan.root, state.config) >= .18) exposed++;
    }
    assert.ok(exposed >= 650, `${exposed}/1000 repairs were visible; the mask must not hide most of the motion`);
  });
}
