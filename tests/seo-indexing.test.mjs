import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

test('retired case-study URLs redirect to the canonical work index', () => {
  const redirects = read('public/_redirects');

  assert.match(redirects, /^\/work\/yatagarasu \/work\/ 301$/m);
  assert.match(redirects, /^\/work\/yatagarasu\/ \/work\/ 301$/m);
});

test('the custom 404 is excluded from indexing and omits a canonical URL', () => {
  const page = read('src/pages/404.astro');
  const layout = read('src/layouts/Layout.astro');

  assert.match(page, /\bnoindex\b/);
  assert.match(layout, /<meta name="robots" content="noindex, follow" \/>/);
  assert.match(layout, /: <link rel="canonical" href=\{canonicalURL\} \/>/);
});

test('robots advertises the canonical sitemap index', () => {
  assert.match(read('public/robots.txt'), /^Sitemap: https:\/\/eddndev\.com\/sitemap-index\.xml$/m);
});
