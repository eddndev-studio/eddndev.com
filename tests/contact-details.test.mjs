import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

test('contact surfaces use the current WhatsApp number', () => {
  const surfaces = [
    'src/pages/contact.astro',
    'src/components/studio/ContactSection.astro',
    'src/components/studio/SiteNav.astro',
  ].map(read);

  for (const surface of surfaces) {
    assert.match(surface, /https:\/\/wa\.me\/525560223906/);
    assert.match(surface, /\+52 55 6022 3906/);
    assert.doesNotMatch(surface, /5619433938|56 1943 3938|525619433938/);
  }
});

test('contact surfaces use the studio email domain', () => {
  const surfaces = [
    'src/pages/contact.astro',
    'src/layouts/Layout.astro',
    'src/components/studio/ContactSection.astro',
    'src/components/studio/SiteNav.astro',
  ].map(read);

  for (const surface of surfaces) {
    assert.match(surface, /contacto@eddndev\.com/);
    assert.doesNotMatch(surface, /contacto@eddn\.dev/);
  }
});
