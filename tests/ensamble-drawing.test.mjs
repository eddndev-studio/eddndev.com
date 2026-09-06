import assert from 'node:assert/strict';
import test from 'node:test';
import { getDrawingLayout, getDrawingPhases } from '../src/scripts/features/ensamble/drawing-model.js';
import { getMaterialReveal } from '../src/scripts/features/ensamble/material.js';

test('scroll reveals the wire structure progressively without resetting a selected hover view', () => {
  assert.equal(getMaterialReveal({ progress: 0 }), 0);
  const samples = [0, .15, .3, .45, .6, .75, 1].map(progress => getMaterialReveal({ progress }));
  assert.ok(samples.every((value, i) => i === 0 || value >= samples[i - 1]));
  assert.ok(samples[2] > 0 && samples[2] < 1);
  assert.equal(samples.at(-1), 1);
  assert.equal(getMaterialReveal({ progress: .3, structure: 1 }), 1);
  assert.equal(getMaterialReveal({ progress: 0 }), 0, 'reverse scroll restores the original material');
});

test('the drawing develops in order and clears before the next section finishes entering', () => {
  assert.equal(getDrawingPhases(0).opacity, 0);
  const early = getDrawingPhases(.3);
  assert.ok(early.design > early.engineering);
  assert.ok(early.engineering >= early.product);
  assert.equal(getDrawingPhases(.7).opacity, 1);
  assert.equal(getDrawingPhases(.7).product, 1);
  assert.equal(getDrawingPhases(.96).opacity, 0);
  assert.equal(getDrawingPhases(1).opacity, 0);
  assert.deepEqual(getDrawingPhases(.3), early);
});

test('drawing views and their annotations fit portrait, landscape and wide layouts', () => {
  for (const [width, height] of [[320,568], [390,844], [844,390], [768,1024], [1440,900], [2560,1440]]) {
    const layout = getDrawingLayout({ width, height });
    for (const point of layout.anchors) {
      assert.ok(point.every(Number.isFinite));
      assert.ok(point[0] >= 8 && point[0] <= width - 8, `${width}: drawing x=${point[0]}`);
      assert.ok(point[1] >= 8 && point[1] <= height - 8, `${height}: drawing y=${point[1]}`);
    }
    for (const path of Object.values(layout.paths)) assert.doesNotMatch(path, /NaN|Infinity/);
    assert.deepEqual(Object.keys(layout.transforms), ['design', 'engineering', 'product']);
    for (const transform of Object.values(layout.transforms)) assert.equal(transform.length, 6);
    const centers = Object.values(layout.transforms).map(transform => transform.slice(4));
    const axis = layout.portrait ? 1 : 0;
    assert.ok(centers[0][axis] < centers[1][axis] && centers[1][axis] < centers[2][axis], 'the three steps follow reading order');
  }
});
