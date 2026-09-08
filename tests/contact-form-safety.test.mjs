import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parse, parseFragment } from 'parse5';
import { contactErrors, createContactMessage, deliverContact } from '../src/scripts/features/contact-model.js';

const component = readFileSync(new URL('../src/components/studio/ContactForm.astro', import.meta.url), 'utf8');
const behavior = readFileSync(new URL('../src/scripts/features/contact-form.js', import.meta.url), 'utf8');
const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
const descendants = node => [node, ...(node.childNodes || []).flatMap(descendants)];

test('without scripting, the draft cannot submit to a mixed target or expose fields in a URL', () => {
  const markup = component.replace(/^---[\s\S]*?---/, '')
    .replace('<EmailLink />', '<a href="mailto:contacto@eddndev.com">contacto@eddndev.com</a>');
  const nodes = descendants(parseFragment(markup, { scriptingEnabled: false }));
  const form = nodes.find(node => node.tagName === 'form');
  assert.equal(new URL(attr(form, 'action'), 'https://eddndev.com/').protocol, 'https:');
  assert.equal(attr(form, 'method'), 'post');
  const submit = descendants(form).find(node => node.tagName === 'button' && attr(node, 'type') === 'submit');
  assert.notEqual(attr(submit, 'disabled'), undefined);
  const fallback = nodes.find(node => node.tagName === 'noscript');
  assert.ok(!descendants(form).includes(fallback));
  assert.ok(descendants(fallback).some(node => node.tagName === 'a' && attr(node, 'href').startsWith('mailto:')));
  const style = descendants(fallback).find(node => node.tagName === 'style');
  assert.match(style.childNodes[0].value, /\[data-contact-form\]\s*\{\s*display:\s*none\s*!important/);
});

const builtHome = new URL('../dist/index.html', import.meta.url);
test('the production build keeps its no-script hiding rule inside noscript', { skip: !existsSync(builtHome) }, () => {
  const nodes = descendants(parse(readFileSync(builtHome, 'utf8'), { scriptingEnabled: false }));
  const fallback = nodes.find(node => node.tagName === 'noscript' && descendants(node).some(child => child.tagName === 'style'));
  assert.ok(fallback, 'Astro must retain the no-script style instead of extracting it');
  const style = descendants(fallback).find(node => node.tagName === 'style');
  assert.match(style.childNodes[0].value, /\[data-contact-form\]\s*\{\s*display:\s*none\s*!important/);
  const stylesheets = nodes.filter(node => node.tagName === 'link' && attr(node, 'rel') === 'stylesheet');
  for (const stylesheet of stylesheets) {
    const css = readFileSync(new URL(`../dist${attr(stylesheet, 'href')}`, import.meta.url), 'utf8');
    assert.doesNotMatch(css, /\[data-contact-form\]/, 'the form must remain visible when JavaScript is enabled');
  }
});

function harness(deliver = deliverContact) {
  const document = { body: {}, activeElement: null };
  function node() {
    const children = new Map();
    return {
      dataset: {}, hidden: false, textContent: '', listeners: new Map(),
      querySelector(selector) {
        if (!children.has(selector)) children.set(selector, node());
        return children.get(selector);
      },
      querySelectorAll: () => [],
      addEventListener(name, callback) { this.listeners.set(name, callback); },
      setAttribute() {}, removeAttribute() {}, contains: () => false,
      focus() { document.activeElement = this; },
    };
  }
  const desk = node();
  const form = desk.querySelector('[data-contact-form]');
  const receipt = desk.querySelector('[data-contact-receipt]');
  const submit = form.querySelector('[data-contact-submit]');
  const fields = Object.fromEntries(Object.entries({ name: 'María', email: 'maria@example.com', message: 'Quiero construir un sitio para mi proyecto.' })
    .map(([name, value]) => [name, Object.assign(node(), { name, value })]));
  form.elements = { namedItem: name => fields[name] };
  receipt.hidden = true;
  let disabled = true;
  Object.defineProperty(submit, 'disabled', {
    get: () => disabled,
    set(value) {
      if (!value) assert.ok(form.listeners.has('submit'), 'submission must be intercepted before enabling the button');
      disabled = value;
    },
  });
  document.querySelector = () => desk;
  const initialize = new Function('document', 'onPageCleanup', 'contactErrors', 'createContactMessage', 'deliverContact',
    `${behavior.replace(/^import .*;\n/gm, '').replace('export default function', 'function')}\nreturn initContactForm;`)
    (document, () => {}, contactErrors, createContactMessage, deliver);
  return { initialize, form, receipt, submit, fields };
}

test('scripting enables the handler, prepares a mail draft and restores editing without native submission', async () => {
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  const fixture = harness(async (...args) => { await ready; return deliverContact(...args); });
  assert.equal(fixture.submit.disabled, true);
  fixture.initialize();
  assert.equal(fixture.submit.disabled, false);
  let prevented = false;
  const pending = fixture.form.listeners.get('submit')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(fixture.submit.disabled, true);
  release();
  await pending;
  assert.equal(fixture.form.hidden, true);
  assert.equal(fixture.receipt.hidden, false);
  assert.equal(fixture.submit.disabled, false);
  const mailto = fixture.receipt.querySelector('[data-contact-mailto]');
  assert.equal(mailto.hidden, false);
  const url = new URL(mailto.href);
  assert.equal(url.protocol, 'mailto:');
  assert.match(url.searchParams.get('body'), /María/);
  assert.match(url.searchParams.get('body'), /Quiero construir un sitio/);
  fixture.receipt.querySelector('[data-contact-reset]').listeners.get('click')();
  assert.equal(fixture.form.hidden, false);
  assert.equal(fixture.receipt.hidden, true);
  assert.equal(fixture.fields.name.value, 'María');
  assert.equal(fixture.submit.disabled, false);
});
