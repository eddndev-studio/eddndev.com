import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getExitPhases,
  getLayerDeparture,
  getSceneDeparture,
} from '../src/scripts/features/ensamble/exit.js';
import { getLayerTransform, getLayerIndices } from '../src/scripts/features/ensamble/model.js';

const desktop = {
  width: 1440,
  height: 900,
  svg: { x: 678, y: 150, scale: 0.9 },
};
const mobile = { width: 390, height: 844, svg: { x: 20, y: 285, scale: 0.46 } };

test('copy leaves first, the object centers, then the next section enters', () => {
  assert.equal(getExitPhases(0).copy, 0);
  assert.equal(getExitPhases(0).next, 0);
  assert.equal(getExitPhases(0.45).copy, 1);
  assert.equal(getExitPhases(0.6).center, 1);
  assert.equal(getExitPhases(0.7).next, 0);
  assert.ok(
    getExitPhases(0.8).next > 0,
    'the next section must be entering as the last mobile layers clear',
  );
  assert.equal(getExitPhases(1).next, 1);
});

test('copy exits left and details use the available viewport axis', () => {
  const wide = getSceneDeparture({ ...desktop, progress: 0.6 });
  assert.ok(wide.copyX <= -desktop.width);
  assert.ok(wide.detailsX >= desktop.width);
  assert.equal(wide.detailsY, 0);
  const narrow = getSceneDeparture({ ...mobile, progress: 0.6 });
  assert.ok(narrow.copyX <= -mobile.width);
  assert.equal(narrow.detailsX, 0);
  assert.ok(narrow.detailsY >= mobile.height);
});

test('every layer actually clears the viewport without scaling or opacity tricks', () => {
  for (const viewport of [
    desktop,
    mobile,
    { ...desktop, width: 2560, height: 1440 },
  ]) {
    const scene = getSceneDeparture({ ...viewport, progress: 1 });
    const count = getLayerIndices({ mobile: viewport.width <= 600 }).length;
    for (let index = 0; index < count; index++) {
      const matrix = getLayerTransform({ index, count, progress: 1, time: 0 });
      const departure = getLayerDeparture({ ...viewport, progress: 1, index, count });
      const corners = [
        [-192, -120],
        [192, -120],
        [192, 120],
        [-192, 120],
      ].map(([x, y]) => ({
        x:
          viewport.svg.x +
          scene.objectX +
          (matrix[0] * x + matrix[2] * y + matrix[4] + departure.x) *
            viewport.svg.scale,
        y:
          viewport.svg.y +
          scene.objectY +
          (matrix[1] * x + matrix[3] * y + matrix[5] + departure.y) *
            viewport.svg.scale,
      }));
      assert.ok(
        corners.every((p) => p.x < 0) ||
          corners.every((p) => p.x > viewport.width) ||
          corners.every((p) => p.y < 0) ||
          corners.every((p) => p.y > viewport.height),
        `layer ${index} remains on screen`,
      );
    }
  }
});

test('layer departures are staggered and fully reversible', () => {
  assert.deepEqual(getLayerDeparture({ ...desktop, index: 0, progress: 0 }), {
    x: 0,
    y: 0,
  });
  const outer = getLayerDeparture({ ...desktop, index: 0, progress: 0.7 });
  const inner = getLayerDeparture({ ...desktop, index: 11, progress: 0.7 });
  assert.ok(Math.hypot(outer.x, outer.y) > Math.hypot(inner.x, inner.y));
  const forward = getSceneDeparture({ ...desktop, progress: 0.5 });
  getSceneDeparture({ ...desktop, progress: 1 });
  assert.deepEqual(getSceneDeparture({ ...desktop, progress: 0.5 }), forward);
});

test('the logo centers independently of the layer budget', () => {
  for (const viewport of [desktop, mobile]) {
    const scene = getSceneDeparture({ ...viewport, progress: 0.6 });
    assert.ok(Math.abs(viewport.svg.x + 360 * viewport.svg.scale + scene.objectX - viewport.width * 0.5) < 0.001);
    assert.ok(Math.abs(viewport.svg.y + 360 * viewport.svg.scale + scene.objectY - viewport.height * 0.46) < 0.001);
  }
  for (const edge of [0, 1]) {
    assert.deepEqual(
      getLayerDeparture({ ...mobile, index: edge * 15, count: 16, progress: 0.75 }),
      getLayerDeparture({ ...mobile, index: edge * 23, count: 24, progress: 0.75 }),
    );
  }
});
