import assert from 'node:assert/strict';
import test from 'node:test';
import { mountEnsamble } from '../src/scripts/features/ensamble/controller.js';

class Element extends EventTarget {
  dataset = {};
  attributes = new Map();
  classes = new Set();
  children = new Map();
  hidden = true;
  offsetHeight = 768;
  offsetWidth = 600;
  offsetLeft = 0;
  offsetTop = 0;
  clientWidth = 1366;
  classList = {
    contains: (name) => this.classes.has(name),
    toggle: (name, value) =>
      value ? this.classes.add(name) : this.classes.delete(name),
    remove: (...names) => names.forEach((name) => this.classes.delete(name)),
  };
  style = {
    setProperty(name, value) {
      this[name] = value;
    },
    removeProperty(name) {
      delete this[name];
    },
  };
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    return this.attributes.get(name);
  }
  querySelector(selector) {
    if (!this.children.has(selector))
      this.children.set(selector, new Element());
    return this.children.get(selector);
  }
  querySelectorAll(selector) {
    if (selector === '.ensamble-lamina') {
      return Array.from({ length: 24 }, (_, index) => this.querySelector(`${selector}-${index}`));
    }
    return [
      this.querySelector(selector + '-1'),
      this.querySelector(selector + '-2'),
    ];
  }
  getBoundingClientRect() {
    return { left: 0, top: -window.scrollY };
  }
}

function scene(t, options = {}) {
  const window = new EventTarget(),
    document = new EventTarget(),
    queries = new Map(),
    queue = new Map();
  let next = 0,
    now = 0,
    intersection,
    resize,
    disconnected = 0,
    refreshes = 0;
  window.innerHeight = 768;
  window.innerWidth = 1366;
  window.scrollY = 0;
  window.matchMedia = (name) => {
    if (!queries.has(name)) {
      const query = new EventTarget();
      query.matches = name.includes('pointer: fine');
      queries.set(name, query);
    }
    return queries.get(name);
  };
  document.documentElement = new Element();
  document.hidden = false;
  const environment = {
    window,
    document,
    requestAnimationFrame: (callback) => {
      queue.set(++next, callback);
      return next;
    },
    cancelAnimationFrame: (id) => queue.delete(id),
    IntersectionObserver: class {
      constructor(callback) {
        intersection = callback;
      }
      observe() {}
      disconnect() {
        disconnected++;
      }
    },
    ResizeObserver: class {
      constructor(callback) {
        resize = callback;
      }
      observe() {}
      disconnect() {
        disconnected++;
      }
    },
  };
  let api;
  t.after(() => api?.destroy());
  for (const [key, value] of Object.entries(environment)) {
    const before = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    t.after(() =>
      before
        ? Object.defineProperty(globalThis, key, before)
        : delete globalThis[key],
    );
  }
  const track = new Element();
  const nextSection = new Element();
  api = mountEnsamble(track, {
    onLayoutChange: () => refreshes++,
    next: nextSection,
    onRequestScroll: (y) => {
      window.scrollY = y;
    },
    ...options,
  });
  const tick = (count = 1) => {
    for (let i = 0; i < count; i++) {
      now += 17;
      const pending = [...queue.values()];
      queue.clear();
      pending.forEach((callback) => callback(now));
    }
  };
  const media = (name, matches) => {
    const query = [...queries.entries()].find(([key]) => key.includes(name))[1];
    query.matches = matches;
    query.dispatchEvent(new Event('change'));
  };
  return {
    api,
    track,
    nextSection,
    window,
    document,
    tick,
    media,
    resize: () => resize(),
    visibility: (value) =>
      intersection([
        { isIntersecting: value, intersectionRatio: value ? 1 : 0 },
      ]),
    refreshes: () => refreshes,
    disconnected: () => disconnected,
    queue,
  };
}

test('mobile paints only its active layers and restores desktop layers on resize', (t) => {
  const s = scene(t);
  s.api.setPaused(true);
  s.tick(2);
  const layers = s.track.querySelectorAll('.ensamble-lamina');
  const front = layers.at(-1).getAttribute('transform');
  assert.equal(s.api.getState().layerCount, 24);
  s.media('max-width', true);
  s.tick(2);
  assert.equal(s.api.getState().layerCount, 16);
  const hidden = layers.filter(layer => layer.style.display === 'none');
  assert.equal(hidden.length, 8);
  assert.equal(layers.at(-1).getAttribute('transform'), front);
  const hiddenTransforms = hidden.map(layer => layer.getAttribute('transform'));
  s.window.scrollY = 400;
  s.window.dispatchEvent(new Event('scroll'));
  s.tick(2);
  assert.deepEqual(hidden.map(layer => layer.getAttribute('transform')), hiddenTransforms);
  s.media('max-width', false);
  s.tick(2);
  assert.equal(s.api.getState().layerCount, 24);
  assert.ok(layers.every(layer => layer.style.display !== 'none'));
});

test('mobile browser chrome can change without changing the CSS viewport runway', (t) => {
  const s = scene(t, { getViewportHeight: () => 768 });
  s.window.scrollY = 500;
  s.window.dispatchEvent(new Event('scroll'));
  s.tick(2);
  const before = s.api.getState();
  s.window.innerHeight = 824;
  s.resize();
  s.tick(2);
  const after = s.api.getState();
  assert.equal(after.runway, before.runway);
  assert.equal(after.progress, before.progress);
});

test('scroll makes faces transparent, preserves outlines and restores the solid logo on return', (t) => {
  const s = scene(t);
  s.api.setPaused(true);
  s.tick(2);
  const front = s.track.querySelectorAll('.ensamble-lamina').at(-1).querySelectorAll('use')[0];
  assert.equal(front.getAttribute('fill-opacity'), '1.000');
  for (const progress of [.35, .7]) {
    s.window.scrollY = s.api.getState().runway * progress;
    s.window.dispatchEvent(new Event('scroll'));
    s.tick(2);
    assert.ok(Number(front.getAttribute('fill-opacity')) < (progress < .5 ? .8 : .04));
    assert.ok(Number(front.getAttribute('stroke-opacity')) >= .67);
    assert.ok(Number(s.track.querySelector('.ensamble-drawing').style['--drawing-opacity']) > 0);
  }
  s.media('reduced-motion', true);
  s.tick(2);
  assert.equal(front.getAttribute('fill-opacity'), '1.000');
  assert.equal(s.track.querySelector('.ensamble-drawing').style['--drawing-opacity'], '0');
  s.media('reduced-motion', false);
  s.window.scrollY = 0;
  s.window.dispatchEvent(new Event('scroll'));
  s.tick(2);
  assert.equal(front.getAttribute('fill-opacity'), '1.000');
  assert.equal(s.track.querySelector('.ensamble-drawing').style['--drawing-opacity'], '0');
});

test('hover reveals the structure and pointer leave restores the solid sculpture', (t) => {
  const s = scene(t),
    art = s.track.querySelector('.ensamble-sculpture');
  art.dispatchEvent(new Event('pointerenter'));
  assert.equal(s.api.getState().showStructure, true);
  art.dispatchEvent(new Event('pointerleave'));
  assert.equal(s.api.getState().showStructure, false);
  // The native button remains available for keyboard and touch users.
  s.track
    .querySelector('.ensamble-structure')
    .dispatchEvent(new Event('click'));
  art.dispatchEvent(new Event('pointerenter'));
  art.dispatchEvent(new Event('pointerleave'));
  assert.equal(s.api.getState().showStructure, true);
  s.track
    .querySelector('.ensamble-structure')
    .dispatchEvent(new Event('click'));
  assert.equal(s.api.getState().showStructure, false);
});

test('scroll, resize and live motion preferences agree on the pin runway', (t) => {
  const s = scene(t);
  s.tick();
  assert.equal(s.api.getState().runway, 883);
  s.window.scrollY = 441.5;
  s.window.dispatchEvent(new Event('scroll'));
  s.tick();
  assert.equal(s.api.getState().progress, 0.5);
  assert.match(
    s.track.querySelector('.ensamble-title').style.transform,
    /translate3d\(-/,
  );
  assert.equal(s.nextSection.style.opacity, '0');
  s.media('reduced-motion', true);
  s.tick(2);
  assert.equal(s.api.getState().runway, 0);
  assert.equal(s.api.getState().progress, 0);
  assert.equal(s.track.classList.contains('is-pinned'), false);
  s.media('reduced-motion', false);
  s.tick(2);
  assert.equal(s.api.getState().runway, 883);
  s.track.querySelector('.ensamble-stage').offsetHeight = 920;
  s.resize();
  s.tick(2);
  assert.equal(s.api.getState().runway, 883);
  assert.equal(s.api.getState().delay, 152);
  assert.equal(s.track.style['--ensamble-pin-top'], '-152px');
  assert.equal(
    s.refreshes(),
    4,
    'downstream pins and the Lenis limit refresh only when geometry changes',
  );
});

test('pause, offscreen and hidden tabs stop the automatic animation', (t) => {
  const s = scene(t);
  for (const toggle of [
    (value) => s.api.setPaused(value),
    (value) => s.visibility(!value),
    (value) => {
      s.document.hidden = value;
      s.document.dispatchEvent(new Event('visibilitychange'));
    },
  ]) {
    s.tick(3);
    toggle(true);
    s.tick(2);
    const frames = s.api.getState().frames;
    s.tick(100);
    assert.equal(s.api.getState().frames, frames);
    toggle(false);
    s.tick(4);
    assert.ok(s.api.getState().frames > frames);
  }
});

test('page cleanup cancels observers, event handlers, pending frames and pin spacing', (t) => {
  const s = scene(t);
  assert.equal(mountEnsamble(s.track), null, 'duplicate mounting is ignored');
  s.api.destroy();
  assert.equal(s.disconnected(), 2);
  assert.equal(s.queue.size, 0);
  assert.equal(s.track.dataset.mounted, undefined);
  assert.equal(s.track.classList.contains('is-pinned'), false);
  assert.equal(s.track.style['--ensamble-runway'], undefined);
  s.track
    .querySelector('.ensamble-structure')
    .dispatchEvent(new Event('click'));
  s.window.dispatchEvent(new Event('resize'));
  s.media('reduced-motion', true);
  assert.equal(s.api.getState().showStructure, false);
  assert.equal(s.queue.size, 0);
});

test('keyboard focus recovers hero controls that have exited the viewport', (t) => {
  const s = scene(t);
  s.window.scrollY = 800;
  s.window.dispatchEvent(new Event('scroll'));
  s.tick();
  const focus = new Event('focusin');
  Object.defineProperty(focus, 'target', { value: { matches: () => true } });
  s.track.dispatchEvent(focus);
  assert.equal(s.window.scrollY, 0);
  assert.equal(s.track.querySelector('.ensamble-foot').style.transform, 'translate3d(0px, 0px, 0)', 'focused controls return before the browser scrolls them into view');
  s.window.dispatchEvent(new Event('scroll'));
  s.tick();
  assert.equal(
    s.track.querySelector('.ensamble-bottom').style.transform,
    'translate3d(0px, 0, 0)',
  );
});
