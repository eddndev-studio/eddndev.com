import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { contactErrors, createContactMessage, createMailto, deliverContact } from '../src/scripts/features/contact-model.js';

const valid = { name: 'María', email: 'maria@example.com', message: 'Quiero construir un sitio para mi proyecto.', services: ['Sitio web', 'Software / sistemas'] };

test('contact requires a name, a valid email and a message, but not a service', () => {
  assert.deepEqual(Object.keys(contactErrors({})), ['name', 'email', 'message']);
  assert.deepEqual(contactErrors({ ...valid, services: [] }), {});
  assert.ok(contactErrors({ ...valid, name: '   ' }).name);
  assert.ok(contactErrors({ ...valid, email: 'maria@' }).email);
  assert.ok(contactErrors({ ...valid, message: '   ' }).message);
  assert.ok(contactErrors({ ...valid, message: 'a'.repeat(3001) }).message);
});

test('email handoff encodes accents, punctuation and all selected services', () => {
  const input = { ...valid, message: 'Diseño & código\nhttps://example.com/?a=1&b=2' };
  const url = new URL(createMailto(input));
  assert.equal(url.pathname, 'contacto@eddndev.com');
  assert.match(url.searchParams.get('body'), /Diseño & código\nhttps:\/\/example.com\/\?a=1&b=2/);
  assert.match(url.searchParams.get('body'), /Sitio web, Software \/ sistemas/);
  assert.match(createContactMessage({ ...valid, services: [] }), /Por definir/);
});

test('without a delivery endpoint the result is a draft, never a sent confirmation', async () => {
  const result = await deliverContact(valid, { fetcher: () => assert.fail('Must not transmit a draft') });
  assert.equal(result.status, 'prepared');
  assert.match(result.href, /^mailto:/);
});

test('delivery confirms only an explicit successful server response', async () => {
  let request;
  const result = await deliverContact(valid, {
    endpoint: '/api/contact',
    fetcher: async (...args) => { request = args; return new Response(JSON.stringify({ ok: true })); },
  });
  assert.equal(result.status, 'sent');
  assert.equal(request[0], '/api/contact');
  assert.equal(request[1].method, 'POST');
  assert.deepEqual(JSON.parse(request[1].body), valid);
  for (const response of [new Response('{}'), new Response('<html>Fallback</html>'), new Response('{"ok":true}', { status: 500 })]) {
    await assert.rejects(deliverContact(valid, { endpoint: '/api/contact', fetcher: async () => response }));
  }
});

test('network failures and cancelled submissions do not produce a sent result', async () => {
  await assert.rejects(deliverContact(valid, { endpoint: '/api/contact', fetcher: async () => { throw new TypeError('Offline'); } }));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(deliverContact(valid, { endpoint: '/api/contact', signal: controller.signal }));
});

test('home and contact share one form and finish with a compact footer', () => {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  for (const path of ['src/pages/index.astro', 'src/pages/contact.astro']) {
    const source = read(path);
    assert.match(source, /contactEnding/);
    assert.match(source, /<ContactSection\s+form/);
  }
  assert.match(read('src/pages/contact.astro'), /headingLevel="h1"/);
  assert.match(read('src/components/studio/Footer.astro'), /!compact/);
  const form = read('src/components/studio/ContactForm.astro');
  assert.match(form, /<fieldset/);
  assert.match(form, /<legend/);
  assert.match(form, /autocomplete="name"/);
  assert.match(form, /autocomplete="email"/);
  assert.match(form, /role="status"/);
  assert.match(form, /role="alert"/);
  assert.match(form, /<noscript>/);
});
