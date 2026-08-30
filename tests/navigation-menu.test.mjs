import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

test('the navigation panel is a viewport overlay with its own scroll', () => {
  const navigation = read('src/components/studio/SiteNav.astro');

  assert.match(navigation, /data-nav-panel[^>]*class="[^"]*\bfixed\b/);
  assert.match(navigation, /data-nav-panel[^>]*class="[^"]*\bh-dvh\b/);
  assert.match(navigation, /data-nav-panel[^>]*class="[^"]*\boverflow-y-auto\b/);
  assert.doesNotMatch(navigation, /data-nav-panel[^>]*class="[^"]*\boverflow-hidden\b/);
});

test('the navigation uses transform motion without document reflow', () => {
  const behavior = read('src/scripts/features/studio-nav.js');
  const styles = read('src/styles/global.css');

  assert.match(styles, /translate3d\(0, calc\(-100% \+ 0\.5rem\), 0\)/);
  assert.match(behavior, /gsap\.to\(panel, \{ y: 0,/);
  assert.doesNotMatch(behavior, /gsap\.(?:to|set)\(panel, \{ height:/);
});

test('opening the navigation preserves and restores the page position', () => {
  const behavior = read('src/scripts/features/studio-nav.js');
  const styles = read('src/styles/global.css');

  assert.match(behavior, /lockedScrollY = window\.scrollY/);
  assert.match(behavior, /--nav-scroll-offset/);
  assert.match(behavior, /window\.scrollTo\(0, lockedScrollY\)/);
  assert.match(styles, /body\.nav-open\s*\{[^}]*position:\s*fixed/s);
  assert.match(styles, /top:\s*var\(--nav-scroll-offset\)/);
});

test('the navigation omits location and decorative row dividers', () => {
  const navigation = read('src/components/studio/SiteNav.astro');

  assert.doesNotMatch(navigation, /Ubicaci[oó]n/);
  assert.doesNotMatch(navigation, /\beditorial-grid\b/);
  assert.doesNotMatch(navigation, /\bdata-editorial-row\b/);
});
