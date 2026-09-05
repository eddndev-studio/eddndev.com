import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const contactMarkup = readFileSync(new URL('../src/components/studio/ContactForm.astro', import.meta.url), 'utf8');

// Exercise the installed scroll engine, including its pending animation.
function createScroller({ reducedMotion = false } = {}) {
  class HTMLElement {
    className = '';
    scrollHeight = 10000;
    scrollWidth = 1280;
    hasAttribute() { return false; }
    addEventListener() {}
    removeEventListener() {}
  }
  class HTMLTextAreaElement extends HTMLElement {
    scrollHeight = 160;
    clientHeight = 160;
    scrollTop = 0;
    hasAttribute(name) { return name === 'data-lenis-prevent' && /data-lenis-prevent/.test(contactMarkup); }
  }
  class Window extends HTMLElement {
    scrollY = 1000;
    innerWidth = 1280;
    innerHeight = 720;
    matchMedia() { return { matches: reducedMotion }; }
    scrollTo({ top }) { this.scrollY = top; }
  }
  const window = new Window();
  const root = new HTMLElement();
  const engine = readFileSync(new URL(import.meta.resolve('lenis')), 'utf8')
    .replace(/export\s*\{\s*Lenis as default\s*\};/, '');
  const integration = readFileSync(new URL('../src/scripts/core/lenis.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/^export .*;$/gm, '');
  const scroller = runInNewContext(`${engine}\n${integration}\nlenis;`, {
    window, document: { documentElement: root }, Window, HTMLElement, HTMLTextAreaElement,
    ResizeObserver: class { observe() {} },
    ScrollTrigger: { update() {}, addEventListener() {} },
    requestAnimationFrame() {}, clearTimeout, setTimeout,
  });
  const textarea = new HTMLTextAreaElement();
  function wheel(deltaY, target = root) {
    const event = {
      type: 'wheel', cancelable: true, defaultPrevented: false,
      composedPath: () => [target, root, window],
      preventDefault() { this.defaultPrevented = true; },
    };
    scroller.onVirtualScroll({ deltaX: 0, deltaY, event });
    return event;
  }
  return { scroller, window, textarea, wheel };
}

test('an empty textarea and its directional limits keep scrolling the page', () => {
  const { scroller, textarea, wheel } = createScroller();
  assert.equal(wheel(120, textarea).defaultPrevented, true);
  assert.equal(scroller.targetScroll, 1120);
  scroller.reset();
  textarea.scrollHeight = 600;
  assert.equal(wheel(-120, textarea).defaultPrevented, true, 'top edge lets the page move up');
  assert.equal(scroller.targetScroll, 880);
  scroller.reset();
  textarea.scrollTop = 440;
  assert.equal(wheel(120, textarea).defaultPrevented, true, 'bottom edge lets the page move down');
  assert.equal(scroller.targetScroll, 1120);
});

test('scrolling a long message cancels page inertia before native scrolling takes over', () => {
  const { scroller, window, textarea, wheel } = createScroller();
  wheel(300);
  scroller.raf(1);
  scroller.raf(17);
  assert.equal(scroller.animate.isRunning, true);
  const pagePosition = window.scrollY;
  textarea.scrollHeight = 600;
  assert.equal(wheel(120, textarea).defaultPrevented, false);
  scroller.raf(33);
  assert.equal(window.scrollY, pagePosition, 'the page must not drift while reading the message');
  assert.equal(scroller.animate.isRunning, false);
});

test('leaving a textarea resumes from the real page position, without pulling back', () => {
  const { scroller, window, textarea, wheel } = createScroller();
  textarea.scrollHeight = 600;
  wheel(120, textarea);
  // A native scroll can land before its asynchronous scroll event is delivered.
  window.scrollY = 1100;
  wheel(120);
  assert.equal(scroller.animatedScroll, 1100);
  assert.equal(scroller.targetScroll, 1220);
});

test('textarea handoff preserves navigation locks and reduced-motion scrolling', () => {
  for (const lock of ['stop', 'lock']) {
    const { scroller, textarea, wheel } = createScroller();
    textarea.scrollHeight = 600;
    if (lock === 'stop') scroller.stop();
    else scroller.scrollTo(2000, { lock: true });
    assert.equal(wheel(120, textarea).defaultPrevented, true);
    assert.equal(lock === 'stop' ? scroller.isStopped : scroller.isLocked, true);
  }
  const { scroller, textarea, wheel } = createScroller({ reducedMotion: true });
  assert.equal(wheel(120, textarea).defaultPrevented, false);
  assert.equal(scroller.animate.isRunning, false);
});

test('the shared contact textarea does not unconditionally capture page scrolling', () => {
  assert.equal(/data-lenis-prevent/.test(contactMarkup), false);
});
