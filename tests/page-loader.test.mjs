import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const component = readFileSync(new URL('../src/components/studio/PageLoader.astro', import.meta.url), 'utf8');
const script = component.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
function boot(type, saved, historyY = 0) {
  const attributes = new Set();
  const events = new Map();
  const storage = new Map(saved ? [['eddndev-scroll-position', JSON.stringify(saved)]] : []);
  const window = { scrollY: 0 };
  const scope = {
    window,
    location: { href: 'https://eddndev.com/' },
    history: { state: { scrollY: historyY } },
    performance: { getEntriesByType: () => [{ type }] },
    document: { documentElement: {
      setAttribute: name => attributes.add(name),
      removeAttribute: name => attributes.delete(name),
      hasAttribute: name => attributes.has(name),
    } },
    sessionStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    setTimeout: callback => { events.set('watchdog', callback); },
    addEventListener: (name, callback) => events.set(name, callback),
  };
  runInNewContext(script, scope);
  return { ...scope, attributes, events, storage };
}

test('reload captures its position before the browser can clamp the unpinned document', () => {
  const f = boot('reload', { url: 'https://eddndev.com/', y: 1900 });
  assert.equal(f.history.scrollRestoration, 'manual');
  assert.equal(f.window.__pageLayout.position.y, 1900);
  assert.equal(f.attributes.has('data-layout-loading'), true);
  f.events.get('pagehide')();
  assert.equal(JSON.parse(f.storage.get('eddndev-scroll-position')).y, 1900);
});

test('a fresh visit never inherits stale scroll from a previous visit', () => {
  const f = boot('navigate', { url: 'https://eddndev.com/', y: 1900 }, 900);
  assert.equal(f.window.__pageLayout.position.y, 0);
});

test('history is the fallback when the saved position belongs to another route', () => {
  const f = boot('back_forward', { url: 'https://eddndev.com/services', y: 900 }, 1700);
  assert.equal(f.window.__pageLayout.position.y, 1700);
});

test('a missing application bundle cannot leave the loader covering the document', () => {
  const f = boot('navigate');
  f.events.get('watchdog')();
  assert.equal(f.attributes.has('data-layout-loading'), false);
  assert.match(component, /role="status"/);
  assert.match(component, /visibility: hidden/);
  assert.match(component, /@media print/);
});
