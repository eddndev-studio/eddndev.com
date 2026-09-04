import assert from 'node:assert/strict';
import test from 'node:test';
import { AnimationEngine, Directions, Pattern } from 'ledding';
import { createFooterFilm, FOOTER_FILM, getFooterFilmProfile } from '../src/scripts/features/footer-film.js';
import { mountFooterSignal } from '../src/scripts/features/footer-signal-runtime.js';

test('the film is a deterministic, bounded drawing shared by canvas and fallback', () => {
  const film = createFooterFilm();
  assert.deepEqual(film, createFooterFilm());
  assert.equal(film.length, FOOTER_FILM.rows);
  assert.ok(film.every(row => row.length === FOOTER_FILM.columns));
  const values = film.flat();
  assert.ok(values.every(value => value === 0 || FOOTER_FILM.colors[value]));
  assert.ok(values.filter(Boolean).length > values.length * 0.1);
  assert.ok(values.filter(Boolean).length < values.length * 0.5);
  assert.ok(film.every(row => row[0] === 0 && row.at(-1) === 0));
});

function harness(t, { reduced = false, forced = false, deferred = false, rejected = false, width = 764 } = {}) {
  const listeners = () => new EventTarget();
  const motion = Object.assign(listeners(), { matches: reduced });
  const contrast = Object.assign(listeners(), { matches: forced });
  const doc = Object.assign(listeners(), { hidden: false });
  const button = Object.assign(listeners(), {
    hidden: true,
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
  });
  const classes = new Set();
  const surface = {
    id: 'footer-signal-surface',
    getBoundingClientRect: () => ({ width, height: width * 380 / 764 }),
  };
  const signal = {
    dataset: {},
    classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
    querySelector: () => surface,
    parentElement: { querySelector: () => button },
  };
  const observers = [];
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
    fire(visible) { this.callback([{ isIntersecting: visible }]); }
  }
  let resizeObserver;
  class SurfaceObserver {
    constructor(callback) { this.callback = callback; resizeObserver = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const restoreGlobals = [];
  for (const [name, value] of Object.entries({
    document: doc,
    window: { matchMedia: query => query.includes('reduced-motion') ? motion : contrast },
    IntersectionObserver: Observer,
    ResizeObserver: SurfaceObserver,
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    restoreGlobals.push(() => descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name]);
  }
  const instances = [];
  class Ledding {
    constructor(selector, options) {
      this.options = options;
      this.canvas = { setAttribute() {} };
      this.events = new Map();
      this.running = true;
      instances.push(this);
    }
    on(name, callback) { this.events.set(name, callback); }
    off(name) { this.events.delete(name); }
    pause() { this.running = false; }
    resume() { this.running = true; }
    destroy() { this.destroyed = true; this.running = false; }
    frame() { this.events.get('afterDraw')?.(); }
  }
  let loads = 0;
  let resolve;
  const library = { Ledding, CircleRenderer: {}, CenterAligner: {}, Directions, Pattern };
  const pending = new Promise(done => { resolve = () => done(library); });
  const cleanup = mountFooterSignal(signal, () => {
    loads += 1;
    if (rejected) return Promise.reject(new Error('unavailable'));
    return deferred ? pending : Promise.resolve(library);
  });
  t.after(() => {
    cleanup();
    restoreGlobals.forEach(restore => restore());
  });
  return {
    signal, classes, button, motion, contrast, doc, instances, observers, cleanup, resolve,
    get loads() { return loads; },
    near() { observers.find(observer => observer.options.rootMargin)?.fire(true); },
    visible(value = true) { observers.find(observer => !observer.options.rootMargin)?.fire(value); },
    resize(value) { width = value; resizeObserver.callback(); },
    get resizeDisconnected() { return resizeObserver.disconnected; },
    async settle() { await new Promise(done => setImmediate(done)); },
    change(target, property, value) { target[property] = value; target.dispatchEvent(new Event(target === doc ? 'visibilitychange' : 'change')); },
  };
}

test('one fixed film scrolls left and only plays while visible', async t => {
  const h = harness(t);
  assert.equal(h.loads, 0);
  h.near();
  await h.settle();
  const instance = h.instances[0];
  assert.equal(instance.running, false);
  assert.deepEqual(instance.options.artPattern, createFooterFilm());
  assert.equal(instance.options.animation.scroll.direction, 'to-left');
  assert.equal(instance.options.animation.scroll.speed, 6);
  assert.equal(instance.options.grid.fill, true, 'the moving exposure keeps a persistent LED lattice');
  assert.equal(h.classes.has('is-enhanced'), false, 'fallback remains until a canvas frame exists');
  h.visible();
  assert.equal(instance.running, true);
  instance.frame();
  assert.equal(h.classes.has('is-enhanced'), true);
  h.visible(false);
  assert.equal(instance.running, false);
  h.visible();
  h.change(h.doc, 'hidden', true);
  assert.equal(instance.running, false);
  h.change(h.doc, 'hidden', false);
  assert.equal(instance.running, true);
  assert.equal(h.loads, 1);
});

test('the film uses fewer, larger dots as its available width decreases', () => {
  const compact = getFooterFilmProfile(360);
  const medium = getFooterFilmProfile(540);
  const wide = getFooterFilmProfile(764);
  assert.deepEqual([compact.columns, compact.rows], [48, 24]);
  assert.deepEqual([medium.columns, medium.rows], [72, 36]);
  assert.deepEqual([wide.columns, wide.rows], [96, 48]);
  const count = profile => createFooterFilm(profile).flat().filter(Boolean).length;
  assert.ok(count(compact) < count(wide) * 0.3);
  assert.ok(count(medium) < count(wide) * 0.6);
  for (const width of [290, 360, 479, 480, 639]) {
    const profile = getFooterFilmProfile(width);
    const scale = width / ((profile.columns - 1) * profile.pitch + profile.ledSize);
    const smallestDot = profile.ledSize * scale * Math.min(...Object.values(profile.sizes));
    assert.ok(smallestDot >= 1.4, `edge dots remain legible at ${width}px`);
    assert.deepEqual(createFooterFilm(profile), createFooterFilm(profile));
  }
  assert.equal(getFooterFilmProfile(479).name, compact.name);
  assert.equal(getFooterFilmProfile(480).name, medium.name);
  assert.equal(getFooterFilmProfile(640).name, wide.name);
});

test('small films move slowly enough to complete a downward ignition before the next column', async t => {
  for (const width of [290, 480]) {
    await t.test(`${width}px film`, async t => {
      const h = harness(t, { width });
      h.visible(); await h.settle();
      const { animation, artPattern, ledSize, ledGap, transitions, pixelRatio, fps } = h.instances[0].options;
      const rows = artPattern.length;
      const columns = artPattern[0].length;
      const pitch = ledSize + ledGap;
      const columnTravelMs = width / ((columns - 1) * pitch + ledSize) * pitch / animation.scroll.speed * 1000;
      const lastLitRow = artPattern.findLastIndex(row => row.some(Boolean));
      const lastIgnitionFrame = AnimationEngine.calculateDelay(
        { gridPosition: { i: 0, j: lastLitRow } }, columns + 2, rows + 2, animation.ignition,
      );
      assert.ok(columnTravelMs > Math.ceil(lastIgnitionFrame) / fps * 1000 + transitions.ignition.duration);
      assert.equal(animation.scroll.direction, 'to-left');
      assert.equal(animation.ignition.direction, 'to-bottom');
      assert.equal(animation.extinction.pattern, 'cascade');
      assert.equal(animation.extinction.direction, 'to-top');
      assert.ok(transitions.extinction.duration > transitions.ignition.duration);
      assert.equal(pixelRatio, 'auto', 'canvas uses the screen resolution instead of a fixed ratio');
    });
  }
});

test('a profile change rebuilds the film and preserves the user pause', async t => {
  const h = harness(t);
  h.visible(); await h.settle();
  const wide = h.instances[0];
  wide.frame();
  h.resize(700); await h.settle();
  assert.equal(h.instances.length, 1, 'resizing within one density keeps the instance');
  h.button.dispatchEvent(new Event('click'));
  h.resize(360); await h.settle();
  const compact = h.instances[1];
  assert.equal(wide.destroyed, true);
  assert.equal(wide.events.size, 0);
  assert.equal(compact.options.artPattern[0].length, 48);
  assert.equal(compact.running, false);
  assert.equal(h.button.attributes['aria-pressed'], 'true');
  assert.equal(h.classes.has('is-enhanced'), false);
  h.button.dispatchEvent(new Event('click'));
  compact.frame();
  assert.equal(compact.running, true);
  assert.equal(h.classes.has('is-enhanced'), true);
  h.cleanup();
  assert.equal(h.resizeDisconnected, true);
  h.resize(764); await h.settle();
  assert.equal(h.instances.length, 2);
});

test('a resize during import uses the latest density without duplicating the canvas', async t => {
  const h = harness(t, { deferred: true });
  h.visible();
  h.resize(360);
  h.resolve(); await h.settle();
  assert.equal(h.instances.length, 1);
  assert.equal(h.instances[0].options.artPattern[0].length, 48);
});

test('ignition cascades downward across the film in roughly two seconds', async t => {
  const h = harness(t);
  h.visible(); await h.settle();
  const { animation, transitions, sizes, fps } = h.instances[0].options;
  const delaysAt = column => Array.from({ length: FOOTER_FILM.rows }, (_, row) => (
    AnimationEngine.calculateDelay(
      { gridPosition: { i: column, j: row } },
      FOOTER_FILM.columns, FOOTER_FILM.rows, animation.ignition,
    )
  ));
  const delays = delaysAt(0);
  assert.equal(delays[0], 0, 'the top row ignites first');
  assert.ok(delays.every((delay, row) => row === 0 || delay > delays[row - 1]), 'each lower row ignites later');
  const sweepMs = Math.ceil(delays.at(-1)) * 1000 / fps;
  assert.ok(sweepMs >= 1800 && sweepMs <= 2000, 'the cascade has a longer, bounded interval');
  assert.deepEqual(delaysAt(FOOTER_FILM.columns - 1), delays, 'row timing stays fixed as LEDs move horizontally');
  assert.deepEqual(transitions.ignition, { duration: 380, easing: 'ease-out-cubic' });
  assert.deepEqual(sizes.states, { 1: 0.35, 2: 0.6, 3: 0.85, 4: 1 });
});

test('every density extinguishes from bottom to top with a slower fade', async t => {
  for (const width of [360, 540, 764]) {
    await t.test(`${width}px film`, async t => {
      const h = harness(t, { width });
      h.visible(); await h.settle();
      const { animation, transitions, artPattern, fps } = h.instances[0].options;
      const rows = artPattern.length;
      const columns = artPattern[0].length;
      const delaysAt = column => Array.from({ length: rows }, (_, row) => (
        AnimationEngine.calculateDelay(
          { gridPosition: { i: column, j: row } }, columns, rows, animation.extinction,
        )
      ));
      const delays = delaysAt(0);
      assert.equal(delays.at(-1), 0, 'the bottom row extinguishes first');
      assert.ok(delays.every((delay, row) => row === 0 || delay < delays[row - 1]));
      assert.deepEqual(delaysAt(columns - 1), delays, 'each row keeps its timing across columns');
      const sweepMs = Math.ceil(delays[0]) * 1000 / fps;
      const [minSweep, maxSweep] = width >= 640 ? [1600, 1800] : [300, 450];
      assert.ok(sweepMs >= minSweep && sweepMs <= maxSweep);
      assert.ok(transitions.extinction.duration > transitions.ignition.duration);
    });
  }
});

test('reduced motion and forced colors keep the SVG without loading animation', async t => {
  const h = harness(t, { reduced: true });
  h.near(); h.visible();
  await h.settle();
  assert.equal(h.loads, 0);
  assert.equal(h.button.hidden, true);
  h.change(h.contrast, 'matches', true);
  h.change(h.motion, 'matches', false);
  await h.settle();
  assert.equal(h.loads, 0);
  h.change(h.contrast, 'matches', false);
  await h.settle();
  const instance = h.instances[0];
  assert.equal(instance.running, true);
  instance.frame();
  h.change(h.motion, 'matches', true);
  assert.equal(instance.running, false);
  assert.equal(h.signal.dataset.signalState, 'static');
  assert.equal(h.classes.has('is-enhanced'), false);
  assert.equal(h.button.hidden, true);
});

test('the keyboard-accessible pause control stays paused across visibility changes', async t => {
  const h = harness(t);
  h.visible(); await h.settle();
  h.instances[0].frame();
  assert.equal(h.button.hidden, false);
  h.button.dispatchEvent(new Event('click'));
  assert.equal(h.instances[0].running, false);
  assert.equal(h.button.attributes['aria-pressed'], 'true');
  h.visible(false); h.visible();
  assert.equal(h.instances[0].running, false);
  h.button.dispatchEvent(new Event('click'));
  assert.equal(h.instances[0].running, true);
});

test('navigation during loading neither duplicates nor leaves a canvas behind', async t => {
  const h = harness(t, { deferred: true });
  h.near(); h.visible(); h.visible();
  assert.equal(h.loads, 1);
  h.cleanup(); h.resolve(); await h.settle();
  assert.equal(h.instances.length, 0);
  assert.ok(h.observers.every(observer => observer.disconnected));
});

test('an import failure leaves the fallback and contact usable', async t => {
  const h = harness(t, { rejected: true });
  h.visible(); await h.settle();
  assert.equal(h.classes.has('is-enhanced'), false);
  assert.equal(h.button.hidden, true);
});

test('cleanup destroys the instance and detaches media and visibility listeners', async t => {
  const h = harness(t);
  h.visible(); await h.settle();
  const instance = h.instances[0];
  h.cleanup();
  assert.equal(instance.destroyed, true);
  h.change(h.motion, 'matches', false);
  h.change(h.doc, 'hidden', false);
  assert.equal(instance.running, false);
  assert.equal(h.loads, 1);
});

test('resizing a paused canvas restores the static drawing until rendering resumes', async t => {
  const h = harness(t);
  h.visible(); await h.settle();
  const instance = h.instances[0];
  instance.frame();
  h.button.dispatchEvent(new Event('click'));
  instance.events.get('resize')?.();
  assert.equal(instance.running, false);
  assert.equal(h.classes.has('is-enhanced'), false);
  h.button.dispatchEvent(new Event('click'));
  instance.frame();
  assert.equal(h.classes.has('is-enhanced'), true);
});

test('a motion preference change during loading prevents canvas creation', async t => {
  const h = harness(t, { deferred: true });
  h.visible();
  h.change(h.motion, 'matches', true);
  h.resolve(); await h.settle();
  assert.equal(h.instances.length, 0);
  assert.equal(h.button.hidden, true);
});
