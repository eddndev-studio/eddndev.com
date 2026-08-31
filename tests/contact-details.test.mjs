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
  const sourcesOfTruthPaths = [
    'src/pages/contact.astro',
    'src/layouts/Layout.astro',
    'src/components/studio/EmailLink.astro',
  ];
  const sourcesOfTruth = sourcesOfTruthPaths.map(read);
  const surfaces = [
    ...sourcesOfTruthPaths,
    'src/components/studio/ContactSection.astro',
    'src/components/studio/SiteNav.astro',
  ].map(read);

  for (const source of sourcesOfTruth) {
    assert.match(source, /contacto@eddndev\.com/);
  }

  for (const surface of surfaces) {
    assert.doesNotMatch(surface, /contacto@eddn\.dev/);
  }
});

test('public email links opt out of Cloudflare obfuscation without JavaScript', () => {
  const emailLink = read('src/components/studio/EmailLink.astro');
  const visibleSurfaces = [
    'src/pages/contact.astro',
    'src/components/studio/ContactSection.astro',
    'src/components/studio/SiteNav.astro',
  ].map(read);

  assert.match(emailLink, /<!--email_off-->\s*<a\b/s);
  assert.match(emailLink, /href="mailto:contacto@eddndev\.com"/);
  assert.match(emailLink, />contacto@eddndev\.com<\/a>\s*<!--\/email_off-->/s);
  assert.doesNotMatch(emailLink, /data-cfemail|email-decode|javascript:/i);

  for (const surface of visibleSurfaces) {
    assert.match(surface, /import EmailLink from ['"]\.\.?.*EmailLink\.astro['"]/);
    assert.match(surface, /<EmailLink\b/);
  }
});
