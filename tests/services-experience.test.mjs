import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mountServiceSignal } from '../src/scripts/features/service-signal.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the services catalogue preserves linkable services and their complete scope', () => {
  const chapter = read('src/components/services/ServiceChapter.astro');
  const page = read('src/pages/services.astro');
  assert.match(chapter, /id=\{service.id\}/);
  assert.match(chapter, /service.description/);
  assert.match(chapter, /service.highlights.map/);
  assert.match(page, /services.map/);
  assert.match(page, /breadcrumbs=\{\[\{ name: 'Servicios', url: '\/services\/' \}\]\}/);
  assert.match(read('src/components/services/ServicesHero.astro'), /href=\{`#\$\{service.id\}`\}/);
});

function harness(t) {
  const instances = [];
  const attributes = new Map();
  const root = {
    id: 'test-signal',
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key),
  };
  t.mock.method(globalThis, 'getComputedStyle', () => ({ color: '#9c7ae6' }));
  class Ledding {
    constructor(selector, options) {
      this.options = options;
      this.selector = selector;
      this.events = new Map();
      this.canvas = { setAttribute() {} };
      instances.push(this);
    }
    on(name, fn) { this.events.set(name, fn); }
    pause() { this.paused = true; }
    resume() { this.paused = false; }
    destroy() { this.destroyed = true; }
    setPattern(pattern) { this.pattern = pattern; }
  }
  return { root, instances, attributes, module: { Ledding, CircleRenderer: {}, CenterAligner: {}, Pattern: { CASCADE: 'cascade' } } };
}

// Node does not expose getComputedStyle; the runtime only reads it after loading.
globalThis.getComputedStyle ??= () => ({});

test('signal enhancement stays lazy and cannot mount after an Astro page swap', async (t) => {
  const h = harness(t);
  let resolve;
  let loads = 0;
  const signal = mountServiceSignal(h.root, () => {
    loads++;
    return new Promise(done => { resolve = done; });
  });
  assert.equal(loads, 0);
  const pending = signal.play();
  signal.destroy();
  resolve(h.module);
  await pending;
  assert.equal(h.instances.length, 0);
});

test('signals use exactly 4 by 4 LEDs, pause when stopped, and destroy their canvas', async (t) => {
  const h = harness(t);
  const signal = mountServiceSignal(h.root, async () => h.module);
  await signal.play();
  const instance = h.instances[0];
  assert.equal(instance.options.artPattern.length, 4);
  assert.ok(instance.options.artPattern.every(row => row.length === 4));
  assert.equal(instance.options.animation.scroll.speed, 0);
  signal.stop();
  assert.equal(instance.paused, true);
  signal.destroy();
  assert.equal(instance.destroyed, true);
});

test('a signal stops by itself after its short entry animation', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness(t);
  const signal = mountServiceSignal(h.root, async () => h.module);
  await signal.play();
  assert.equal(h.instances[0].paused, false);
  t.mock.timers.tick(900);
  assert.equal(h.instances[0].paused, true);
  signal.destroy();
});

test('leaving the viewport during loading does not create a running canvas', async (t) => {
  const h = harness(t);
  let resolve;
  const signal = mountServiceSignal(h.root, () => new Promise(done => { resolve = done; }));
  const pending = signal.play();
  signal.stop();
  resolve(h.module);
  await pending;
  assert.equal(h.instances.length, 0);
  signal.destroy();
});

test('a failed Ledding import leaves the static matrix available', async (t) => {
  const h = harness(t);
  const signal = mountServiceSignal(h.root, async () => { throw new Error('offline'); });
  await signal.play();
  assert.equal(h.attributes.has('data-enhanced'), false);
  signal.destroy();
});
