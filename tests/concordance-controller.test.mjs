import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitial } from '../src/scripts/features/concordance/model.js';
import { mountMosaic } from '../src/scripts/features/concordance/controller.js';

class Element extends EventTarget {
  dataset = {};
  attributes = new Map();
  children = new Map();
  setAttribute(key, value) { this.attributes.set(key, String(value)); }
  removeAttribute(key) { this.attributes.delete(key); }
  querySelector(key) {
    if (!this.children.has(key)) this.children.set(key, new Element());
    return this.children.get(key);
  }
}

function scene(t, reducedInitially = false) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const media = new EventTarget(), document = new EventTarget();
  media.matches = reducedInitially;
  document.hidden = false;
  let intersection;
  const environment = {
    document,
    window: { matchMedia: () => media, innerWidth: 1440, innerHeight: 900 },
    IntersectionObserver: class {
      constructor(callback) { intersection = callback; }
      observe() {}
      disconnect() {}
    },
  };
  for (const [key, value] of Object.entries(environment)) {
    const before = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    t.after(() => before ? Object.defineProperty(globalThis, key, before) : delete globalThis[key]);
  }
  const state = createInitial({ width: 14, height: 8 });
  const svg = new Element(), nodes = state.cells.map(() => new Element());
  svg.querySelectorAll = () => nodes;
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1440, bottom: 900, width: 1440, height: 900 });
  const active = new Set();
  const gsap = { to(cursor, config) {
    const tween = {
      paused: true,
      play() { this.paused = false; },
      pause() { this.paused = true; },
      kill() { active.delete(this); },
      complete() {
        if (this.paused) return;
        cursor.time = config.time;
        config.onUpdate();
        config.onComplete();
      },
    };
    active.add(tween);
    return tween;
  } };
  const api = mountMosaic({ svg, state, scope: new Element(), gsap });
  t.after(() => api.destroy());
  const visibility = visible => intersection([{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]);
  visibility(true);
  return { api, svg, media, document, active, visibility, current: () => [...active][0] };
}

test('each completed repair hands off immediately with exactly one active tween', t => {
  const s = scene(t);
  t.mock.timers.tick(3001);
  let revision = 0;
  for (let i = 0; i < 100; i++) {
    assert.equal(s.active.size, 1);
    s.current().complete();
    const nextRevision = Number(s.svg.dataset.revision);
    assert.ok(nextRevision - revision >= 2, 'each pulse advances multiple origins');
    revision = nextRevision;
    assert.equal(s.active.size, 1, 'the next cell starts without another ambient timer');
  }
});

test('pause, offscreen, hidden tabs and inactive layouts retain the same in-flight repair', t => {
  const s = scene(t);
  t.mock.timers.tick(3001);
  for (const set of [value => s.api.setPaused(value), value => s.visibility(!value),
    value => s.api.suspend(value), value => {
      s.document.hidden = value;
      s.document.dispatchEvent(new Event('visibilitychange'));
    }]) {
    const current = s.current(), revision = s.svg.dataset.revision;
    set(true);
    assert.equal(current.paused, true);
    t.mock.timers.tick(60000);
    current.complete();
    assert.equal(s.svg.dataset.revision, revision);
    set(false);
    assert.equal(s.current(), current, 'resume cannot replace or catch up the paused repair');
    assert.equal(current.paused, false);
  }
  s.api.destroy();
  t.mock.timers.tick(60000);
  assert.equal(s.active.size, 0);
});

test('reduced motion starts static and stops an ongoing drift without scheduling another repair', t => {
  const s = scene(t, true);
  t.mock.timers.tick(60000);
  assert.equal(s.active.size, 0);
  assert.equal(s.api.recompose(), false);
  s.media.matches = false;
  s.media.dispatchEvent(new Event('change'));
  t.mock.timers.tick(3001);
  assert.equal(s.active.size, 1);
  s.current().complete();
  s.media.matches = true;
  s.media.dispatchEvent(new Event('change'));
  assert.equal(s.active.size, 0);
  const revision = s.svg.dataset.revision;
  t.mock.timers.tick(60000);
  assert.equal(s.svg.dataset.revision, revision);
  s.media.matches = false;
  s.media.dispatchEvent(new Event('change'));
  assert.equal(s.active.size, 1);
  s.current().complete();
  assert.ok(Number(s.svg.dataset.revision) - Number(revision) >= 2);
});
