import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

test('the page ending is one question-and-answer sequence with a single primary action', () => {
  const contact = read('src/components/studio/ContactSection.astro');
  const footer = read('src/components/studio/Footer.astro');

  assert.match(contact, /data-closing-prompt/);
  assert.match(contact, />Siguiente paso</);
  assert.doesNotMatch(contact, /<Button|<EmailLink|wa\.me/);

  assert.match(footer, /data-footer-colophon/);
  assert.match(footer, />\s*Empecemos por el trabajo actual\./);
  assert.match(footer, /data-footer-cta[^>]*href="\/contact\/"/);
  assert.equal((`${contact}\n${footer}`.match(/>Iniciar conversación</g) || []).length, 1);
  assert.doesNotMatch(footer, />Contacto directo<|>Respuesta<|Seguimiento directo/);
  assert.match(footer, /<EmailLink/);
  assert.match(footer, /https:\/\/wa\.me\/525560223906/);
  assert.equal((footer.match(/<FooterContactIcon/g) || []).length, 3);
  assert.match(footer, /aria-label="Enlaces del pie de página"/);
  assert.match(footer, /data-footer-index-row/g);
  assert.match(footer, /<FooterContactIcon/);
  assert.match(footer, /<SocialMedia/);
});

test('the footer signal progressively enhances a static, decorative fallback', () => {
  const component = read('src/components/studio/FooterSignal.astro');
  const main = read('src/scripts/main.js');
  const scriptPath = 'src/scripts/features/footer-signal.js';

  assert.ok(existsSync(join(projectRoot, scriptPath)));
  const script = read(scriptPath);
  const runtime = read('src/scripts/features/footer-signal-runtime.js');

  assert.match(component, /data-footer-signal/);
  assert.match(component, /data-footer-signal-fallback/);
  assert.match(component, /<svg[^>]*aria-hidden="true"/);
  assert.match(component, /data-footer-signal[^>]*aria-hidden="true"/);
  assert.match(main, /initFooterSignal/);
  assert.match(runtime, /import\(['"]ledding['"]\)/);
  assert.match(runtime, /CircleRenderer/);
  assert.doesNotMatch(runtime, /setPlaylist|setPattern|Math\.random/);
  assert.match(component, /createFooterFilm/);
  assert.match(runtime, /createFooterFilm/);
  assert.match(script, /onPageCleanup/);
});

test('the footer signal stays optional for motion, forced colors, and pointer input', () => {
  const styles = read('src/styles/footer.css');

  assert.match(styles, /\.footer-colophon\s*\{[\s\S]*?background:\s*var\(--void\)/);
  assert.match(styles, /\.footer-colophon \.section-code::after\s*\{[\s\S]*?display:\s*none/);
  assert.match(styles, /\[data-footer-signal\][\s\S]*?pointer-events:\s*none/);
  assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(styles, /@media \(forced-colors:\s*active\)/);
  assert.match(styles, /\.footer-cta:focus-visible/);
  assert.doesNotMatch(styles, /box-shadow|filter:\s*blur/);
});

test('the compact footer uses official contact and social icon sources', () => {
  const contactIcons = read('src/components/studio/FooterContactIcon.astro');
  const footer = read('src/components/studio/Footer.astro');
  const notices = read('THIRD_PARTY_NOTICES.md');

  assert.match(contactIcons, /data-icon-family="heroicons"/);
  assert.match(contactIcons, /M21\.75 6\.75v10\.5/);
  assert.match(contactIcons, /M20\.25 8\.511/);
  assert.match(contactIcons, /M19\.5 10\.5c0 7\.142/);
  assert.doesNotMatch(contactIcons, /kind:.*clock|kind === 'clock'|M12 6v6h4\.5/);
  assert.match(footer, /<SocialMedia/);
  assert.match(notices, /FooterContactIcon\.astro/);
  assert.match(notices, /MIT License/);
});
