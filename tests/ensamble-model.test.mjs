import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLayout,
  getProgress,
  getLayerTransform,
  getLayerIndices,
  LAYER_COUNT,
} from '../src/scripts/features/ensamble/model.js';

test('short viewports read the whole hero before a bottom-aligned pin starts', () => {
  assert.deepEqual(getLayout({ height: 900, viewport: 900 }), {
    pinned: true,
    runway: 1035,
    delay: 0,
    pinTop: 0,
    overlap: 540,
  });
  assert.deepEqual(getLayout({ height: 940, viewport: 640, mobile: true }), {
    pinned: true,
    runway: 704,
    delay: 300,
    pinTop: -300,
    overlap: 384,
  });
});

test('reduced motion and forced colors remove all pin geometry', () => {
  assert.deepEqual(getLayout({ height: 940, viewport: 640, reduced: true }), {
    pinned: false,
    runway: 0,
    delay: 0,
    pinTop: 0,
    overlap: 0,
  });
});

test('exit progress waits until the last part of a tall hero has been read', () => {
  const layout = { top: 100, runway: 704, delay: 300 };
  assert.equal(getProgress({ ...layout, scroll: 350 }), 0);
  assert.equal(getProgress({ ...layout, scroll: 400 }), 0);
  assert.equal(getProgress({ ...layout, scroll: 752 }), 0.5);
});

test('scroll progress accounts for the hero document offset and clamps both ends', () => {
  const layout = { top: 100, height: 900, runway: 522 };
  assert.equal(getProgress({ ...layout, scroll: 0 }), 0);
  assert.equal(getProgress({ ...layout, scroll: 361 }), 0.5);
  assert.equal(getProgress({ ...layout, scroll: 622 }), 1);
  assert.equal(getProgress({ ...layout, scroll: 2000 }), 1);
  assert.equal(getProgress({ ...layout, scroll: 622, reduced: true }), 0);
});

test('a normal-flow hero does not scrub away content while readers reach its controls', () => {
  assert.equal(getProgress({ scroll: 400, top: 0, height: 940, runway: 0 }), 0);
});

test('the layer budget is smaller on mobile while retaining both faces', () => {
  const desktop = getLayerIndices();
  const mobile = getLayerIndices({ mobile: true });
  assert.equal(desktop.length, 24);
  assert.equal(mobile.length, 16);
  for (const indices of [desktop, mobile]) {
    assert.equal(indices[0], 0);
    assert.equal(indices.at(-1), LAYER_COUNT - 1);
    assert.equal(new Set(indices).size, indices.length);
    assert.ok(indices.every(index => Number.isInteger(index) && desktop.includes(index)));
  }
});

test('responsive layer counts retain the same depth and front face position', () => {
  for (const progress of [0, 0.4, 1]) {
    for (const structure of [0, 1]) {
      for (const edge of [0, 1]) {
        const desktop = getLayerTransform({ index: edge * 23, count: 24, progress, structure, time: 12 });
        const mobile = getLayerTransform({ index: edge * 15, count: 16, progress, structure, time: 12 });
        assert.deepEqual(mobile, desktop);
      }
    }
  }
});

test('scroll preserves the shape and projected area of every layer', () => {
  for (const structure of [0, 1]) {
    for (const progress of [0, 0.5, 1]) {
      for (let index = 0; index < LAYER_COUNT; index++) {
        const values = getLayerTransform({
          index,
          progress,
          structure,
          time: 0,
        });
        assert.equal(values.length, 6);
        assert.ok(values.every(Number.isFinite));
        const initial = getLayerTransform({
          index,
          progress: 0,
          structure,
          time: 0,
        });
        assert.deepEqual(
          values.slice(0, 4),
          initial.slice(0, 4),
          'scroll must not flatten or stretch the sculpture',
        );
        assert.ok(
          Math.abs(values[0] * values[3] - values[1] * values[2]) > 0.5,
        );
      }
    }
  }
});
