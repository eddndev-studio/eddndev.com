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
  const styles = read('src/styles/global.css');

  assert.match(navigation, /data-nav-panel[^>]*class="[^"]*\bfixed\b/);
  assert.match(navigation, /data-nav-panel[^>]*class="[^"]*\bh-dvh\b/);
  assert.match(navigation, /data-nav-panel[^>]*class="[^"]*\boverflow-y-auto\b/);
  assert.doesNotMatch(navigation, /data-nav-panel[^>]*class="[^"]*\boverflow-hidden\b/);
  assert.match(styles, /\[data-nav-panel\]\s*\{[^}]*scrollbar-width:\s*none/s);
  assert.match(styles, /\[data-nav-panel\]::\-webkit-scrollbar\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /html\.nav-open\s*\{[^}]*scrollbar-gutter:\s*auto/s);
});

test('the navigation uses transform motion without document reflow', () => {
  const behavior = read('src/scripts/features/studio-nav.js');
  const styles = read('src/styles/global.css');

  assert.match(styles, /translate3d\(0, -100%, 0\)/);
  assert.match(behavior, /gsap\.to\(panel, \{ y: 0,/);
  assert.match(behavior, /return -panel\.clientHeight/);
  assert.doesNotMatch(behavior, /COLLAPSED_EDGE|anticipate/);
  assert.doesNotMatch(behavior, /gsap\.(?:to|set)\(panel, \{ height:/);
});

test('the navigation does not reserve a top strip above page content', () => {
  const layout = read('src/layouts/Layout.astro');
  const navigation = read('src/components/studio/SiteNav.astro');
  const space = read('src/styles/space.css');

  assert.match(navigation, /class="[^"]*\btop-0\b[^"]*" data-nav-bar/);
  assert.doesNotMatch(navigation, /class="[^"]*\btop-2\b[^"]*" data-nav-bar/);
  assert.doesNotMatch(navigation, /data-nav-panel[^>]*class="[^"]*\bpt-2\b/);
  assert.doesNotMatch(layout, /data-nav-content[^>]*class="[^"]*\bpt-\d+\b/);
  assert.doesNotMatch(layout, /flex w-full flex-col pt-9/);
  assert.match(space, /\.home-hero\s*\{[^}]*min-height:\s*100dvh/s);
  assert.doesNotMatch(space, /100(?:s|d)?vh - 6\.25rem/);
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

test('closing the navigation restores focus after the panel becomes inert', () => {
  const behavior = read('src/scripts/features/studio-nav.js');
  const settledFocus = behavior.match(/settleClosed\(\);\s*if \(focusOpen\) focusOpenButton\(\);/g) ?? [];

  assert.match(behavior, /function focusOpenButton\(\)/);
  assert.equal(settledFocus.length, 2);
});

test('the navigation omits location and decorative row dividers', () => {
  const navigation = read('src/components/studio/SiteNav.astro');

  assert.doesNotMatch(navigation, /Ubicaci[oó]n/);
  assert.doesNotMatch(navigation, /\beditorial-grid\b/);
  assert.doesNotMatch(navigation, /\bdata-editorial-row\b/);
});
