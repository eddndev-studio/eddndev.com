import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

function fixture() {
  let triggers = [];
  let hero;
  const window = { scrollY: 1500, innerHeight: 900 };
  const source = readFileSync(new URL('../src/scripts/core/scroll-position.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace(/^export /gm, '');
  const scope = {
    window,
    ScrollTrigger: { getAll: () => triggers },
    document: { querySelector: () => hero, querySelectorAll: () => [], getElementById: () => null },
  };
  runInNewContext(source, scope);
  return { scope, window, setTriggers: value => { triggers = value; }, setHero: value => { hero = value; } };
}

test('a pinned scene retains its progress when its start and duration change', () => {
  const f = fixture();
  const section = { isConnected: true };
  f.setTriggers([{ pin: true, trigger: section, start: 1000, end: 2000 }]);
  const position = f.scope.captureScrollPosition();
  assert.equal(position.progress, 0.5);
  f.setTriggers([{ pin: true, trigger: section, start: 1400, end: 2600 }]);
  assert.equal(f.scope.resolveScrollPosition(position), 2000);
});

test('a hard reload preserves its saved pixel position regardless of the old scroll limit', () => {
  const f = fixture();
  assert.equal(f.scope.resolveScrollPosition({ y: 4100 }), 4100);
});

test('the native hero pin preserves the exit phase when its viewport runway changes', () => {
  const f = fixture();
  let runway = 1000;
  f.window.scrollY = 500;
  const hero = {
    isConnected: true,
    getBoundingClientRect: () => ({ top: -f.window.scrollY }),
    style: { getPropertyValue: name => name === '--ensamble-runway' ? String(runway) : '0' },
  };
  f.setHero(hero);
  const position = f.scope.captureScrollPosition();
  runway = 1500;
  assert.equal(f.scope.resolveScrollPosition(position), 750);
});
