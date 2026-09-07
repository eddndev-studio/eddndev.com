import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mountWorkIndex } from '../src/scripts/features/work-index.js';
import { mountWorkMotion } from '../src/scripts/animations/work-motion.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function harness() {
  const attributes = () => ({
    values: new Map(),
    setAttribute(name, value) { this.values.set(name, value); },
    removeAttribute(name) { this.values.delete(name); },
  });
  const scenes = [0, 1, 2].map(index => ({
    ...attributes(), id: `work-${index}`, top: index * 800,
    getBoundingClientRect() { return { top: this.top }; },
    querySelectorAll() { return [{}, {}, {}, {}]; },
    querySelector() { return {}; },
  }));
  const links = scenes.map(scene => ({
    ...attributes(), hash: `#${scene.id}`,
    getAttribute(name) { return name === 'href' ? this.hash : this.values.get(name); },
  }));
  const count = { textContent: '01' };
  const root = Object.assign(new EventTarget(), attributes(), {
    dataset: {},
    querySelectorAll(selector) { return selector === '[data-work-project]' ? scenes : links; },
    querySelector() { return count; },
  });
  let observer;
  class Observer {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  return { root, scenes, links, count, Observer, get observer() { return observer; } };
}

test('the selected case follows visible scenes without hiding other case links', () => {
  const h = harness();
  const cleanup = mountWorkIndex(h.root, h.Observer);
  assert.equal(h.links[0].values.get('aria-current'), 'location');
  h.observer.callback([{ target: h.scenes[1], isIntersecting: true }]);
  assert.equal(h.links[1].values.get('aria-current'), 'location');
  assert.equal(h.links[0].values.has('aria-current'), false);
  assert.equal(h.count.textContent, '02');
  assert.ok(h.links.every(link => !link.values.has('tabindex') && !link.values.has('aria-hidden')));
  cleanup();
  assert.equal(h.observer.disconnected, true);
  assert.ok(h.links.every(link => !link.values.has('aria-current')));
});

test('keyboard focus selects its case and cleanup removes its listener', () => {
  const h = harness();
  const cleanup = mountWorkIndex(h.root, h.Observer);
  const focus = new Event('focusin');
  Object.defineProperty(focus, 'target', { value: { closest: () => h.scenes[2] } });
  h.root.dispatchEvent(focus);
  assert.equal(h.count.textContent, '03');
  cleanup();
  h.root.dispatchEvent(focus);
  assert.equal(h.links[2].values.has('aria-current'), false);
});

test('index navigation handles one scroll and preserves modified native clicks', () => {
  const h = harness();
  const destinations = [];
  const cleanup = mountWorkIndex(h.root, h.Observer, scene => destinations.push(scene));
  function click(properties = {}) {
    const event = new Event('click', { cancelable: true });
    Object.defineProperty(event, 'target', { value: { closest: () => h.links[1] } });
    Object.assign(event, { button: 0, ...properties });
    h.root.dispatchEvent(event);
    return event;
  }
  assert.equal(click().defaultPrevented, true);
  assert.deepEqual(destinations, [h.scenes[1]]);
  for (const properties of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }]) {
    assert.equal(click(properties).defaultPrevented, false);
  }
  assert.equal(destinations.length, 1);
  cleanup();
  assert.equal(click().defaultPrevented, false);
});

test('motion is opt-in for larger viewports and reverts on preference changes or cleanup', () => {
  const h = harness();
  const tweens = [];
  let activate, deactivate, reverted = false;
  const media = {
    add(query, callback) {
      assert.match(query, /prefers-reduced-motion: no-preference/);
      assert.match(query, /min-width: 960px/);
      assert.match(query, /min-height: 640px/);
      activate = () => { deactivate = callback(); };
    },
    revert() { reverted = true; deactivate?.(); },
  };
  const gsap = {
    matchMedia: () => media,
    timeline(options) {
      tweens.push(options);
      return { fromTo() { return this; } };
    },
  };
  const cleanup = mountWorkMotion(h.root, gsap);
  assert.equal(tweens.length, 0, 'static mode never installs animation masks');
  assert.equal(h.root.dataset.workMotion, undefined);
  activate();
  assert.equal(tweens.length, 3);
  assert.equal(h.root.dataset.workMotion, 'true');
  assert.ok(tweens.every(tween => tween.scrollTrigger.scrub && !tween.scrollTrigger.pin));
  cleanup();
  assert.equal(reverted, true);
  assert.equal(h.root.dataset.workMotion, undefined);
});

test('the homepage gallery keeps real content, native links and static media', () => {
  const home = read('src/pages/index.astro');
  const showcase = read('src/components/work/WorkShowcase.astro');
  const project = read('src/components/work/WorkProject.astro');
  const styles = read('src/styles/work-showcase.css');
  assert.match(home, /<WorkShowcase projects=\{ordered\}/);
  assert.ok(home.indexOf('<WorkShowcase') < home.indexOf('<ProcessStatement'));
  assert.match(showcase, /id="work"/);
  assert.match(showcase, /href=\{`#work-\$\{project.slug\}`\}/);
  assert.match(project, /<article/);
  assert.match(project, /href=\{`\/work\/\$\{project.slug\}\/`\}/);
  assert.match(project, /project.data.status/);
  assert.match(project, /project.data.description/);
  assert.match(project, /project.data.signal/);
  assert.match(project, /src=\{project.data.cover\}/);
  assert.match(project, /loading="lazy"/);
  assert.match(styles, /var\(--signal-on-dark\)/);
  assert.match(styles, /var\(--moonlight\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(styles, /#[\da-f]{3,8}\b|rgba?\(|font-family:\s*['"]/i);
  assert.doesNotMatch(project, /<a[^>]*(?:tabindex="-1"|aria-hidden="true")/);
});
