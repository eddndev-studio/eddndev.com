import assert from 'node:assert/strict';
import test from 'node:test';
import { coverGeometry, visibleRoots, randomRoot } from '../src/scripts/features/concordance/ambient.js';

test('a cover-sized background retains square cells when the viewport crops its edges', () => {
  const geometry = coverGeometry({ left: 0, top: 0, width: 390, height: 844 }, { width: 6, height: 10 });
  assert.equal(geometry.cell, 84.4);
  assert.ok(geometry.left < 0);
  assert.equal(geometry.top, 0);
  assert.equal(geometry.left + geometry.cell * 3, 195);
});

test('automatic roots stay inside the visible, unfaded part of a cropped background', () => {
  const config = { width: 14, height: 8 };
  const geometry = coverGeometry({ left: 0, top: -500, width: 1440, height: 900 }, config);
  const clip = { left: 0, top: 0, right: 1440, bottom: 400 };
  const roots = visibleRoots(geometry, config, clip);
  assert.ok(roots.length > 0);
  for (const root of roots) {
    const x = geometry.left + (root % config.width + .5) * geometry.cell;
    const y = geometry.top + (Math.floor(root / config.width) + .5) * geometry.cell;
    assert.ok(x > clip.left && x < clip.right && y > clip.top && y < clip.bottom);
  }
  assert.deepEqual(visibleRoots(geometry, config, { left: 0, top: 0, right: 1440, bottom: -10 }), []);
});

test('random origins vary with randomness, exclude the previous root and handle an empty viewport', () => {
  const roots = [4, 9, 15, 18];
  assert.equal(randomRoot(roots, 9, () => 0), 4);
  assert.equal(randomRoot(roots, 9, () => .5), 15);
  assert.equal(randomRoot(roots, 9, () => .99), 18);
  assert.equal(randomRoot([], -1), -1);
  assert.equal(randomRoot([4], 4), 4);
  assert.deepEqual(roots, [4, 9, 15, 18]);
});
