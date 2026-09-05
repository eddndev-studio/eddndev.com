import assert from 'node:assert/strict';
import test from 'node:test';
import { createLayoutCoordinator, isCriticalResize } from '../src/scripts/core/layout-coordinator.js';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

function harness(ready = async () => {}) {
  const calls = [];
  const coordinator = createLayoutCoordinator({
    show: () => calls.push('show'),
    ready,
    rebuild: request => calls.push(['rebuild', request.position]),
    frame: async () => {},
    measure: () => calls.push('measure'),
    restore: request => calls.push(['restore', request.position]),
    reveal: () => calls.push('reveal'),
    fail: () => calls.push('fail'),
  });
  return { coordinator, calls };
}

test('restored scroll is applied only after fonts, untransformed layout and pins settle', async () => {
  const fonts = deferred();
  const { coordinator, calls } = harness(() => fonts.promise);
  const run = coordinator.run({ position: 1450 });
  assert.deepEqual(calls, ['show']);
  fonts.resolve();
  await run;
  assert.deepEqual(calls, ['show', ['rebuild', 1450], 'measure', ['restore', 1450], 'reveal']);
});

test('a pending page cannot restore scroll or uncover a newer route', async () => {
  const first = deferred();
  let count = 0;
  const { coordinator, calls } = harness(() => ++count === 1 ? first.promise : Promise.resolve());
  const stale = coordinator.run({ position: 1700 });
  coordinator.cancel();
  await coordinator.run({ position: 0 });
  first.resolve();
  await stale;
  assert.deepEqual(calls.filter(Array.isArray), [['rebuild', 0], ['restore', 0]]);
  assert.equal(calls.filter(value => value === 'reveal').length, 1);
});

test('a newer resize supersedes a refresh even between measuring and restoring', async () => {
  const frame = deferred();
  const restored = [];
  let frames = 0;
  const coordinator = createLayoutCoordinator({
    show() {}, ready: async () => {}, rebuild() {}, measure() {},
    frame: () => ++frames === 1 ? frame.promise : Promise.resolve(),
    restore: request => restored.push(request.position), reveal() {}, fail() {},
  });
  const first = coordinator.run({ position: 900 });
  await Promise.resolve();
  await coordinator.run({ position: 1200 });
  frame.resolve();
  await first;
  assert.deepEqual(restored, [1200]);
});

test('an initialization failure releases the provisional loading screen', async () => {
  const calls = [];
  const coordinator = createLayoutCoordinator({
    show() {}, ready: async () => { throw new Error('asset failure'); },
    reveal: () => calls.push('reveal'), fail: () => calls.push('fail'),
  });
  await coordinator.run({ position: 0 });
  assert.deepEqual(calls, ['fail', 'reveal']);
});

test('critical resizes include width, orientation, height and pin breakpoints', () => {
  assert.equal(isCriticalResize({ width: 1440, height: 900 }, { width: 980, height: 900 }), true);
  assert.equal(isCriticalResize({ width: 390, height: 844 }, { width: 844, height: 390 }), true);
  assert.equal(isCriticalResize({ width: 1440, height: 900 }, { width: 1440, height: 740 }), true);
  assert.equal(isCriticalResize({ width: 980, height: 800 }, { width: 980, height: 740 }), true);
  assert.equal(isCriticalResize({ width: 1440, height: 710 }, { width: 1440, height: 690 }), true);
  assert.equal(isCriticalResize({ width: 390, height: 650 }, { width: 390, height: 630 }), true);
});

test('mobile browser chrome and typing do not repeatedly rebuild the page', () => {
  assert.equal(isCriticalResize({ width: 390, height: 844 }, { width: 390, height: 790 }, false, true), false);
  assert.equal(isCriticalResize({ width: 390, height: 844 }, { width: 390, height: 500 }, true), false);
  assert.equal(isCriticalResize({ width: 390, height: 844 }, { width: 844, height: 390 }, true), true);
});
