import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('a layout refresh updates the persistent scroller after navigating to a taller page', () => {
  const source = readFileSync(new URL('../src/scripts/core/lenis.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/^export .*;$/gm, '');
  const events = new Map();
  let height = 6000;
  let scroller;
  class Lenis {
    constructor() { scroller = this; this.limit = height; }
    resize() { this.limit = height; }
    on() {}
  }
  runInNewContext(source, {
    Lenis,
    ScrollTrigger: { update() {}, addEventListener: (name, callback) => events.set(name, callback) },
    window: { matchMedia: () => ({ matches: false }) },
    requestAnimationFrame() {},
  });
  height = 11000;
  events.get('refresh')?.();
  assert.equal(scroller.limit, 11000, 'the new gallery must remain reachable after a page swap');
});
