import assert from 'node:assert/strict';
import test from 'node:test';
import { MosaicView } from '../src/scripts/features/concordance/view.js';

class Element {
  attributes = new Map();
  children = new Map();
  dataset = {};
  setAttribute(key, value) { this.attributes.set(key, String(value)); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  removeAttribute(key) { this.attributes.delete(key); }
  querySelector(key) {
    if (!this.children.has(key)) this.children.set(key, new Element());
    return this.children.get(key);
  }
}

test('a color change uses the same directional wipe as a shape change', () => {
  const root = new Element();
  const svg = new Element();
  svg.querySelectorAll = () => [root];
  const from = { id: 0, mask: 3, motif: 3, ink: 0 };
  const to = { ...from, mask: 6, ink: 2 };
  const state = { revision: 0, cells: [from] };
  const plan = { accepted: true, target: { revision: 1, cells: [to] },
    motion: { lead: 0, hop: 0, morph: 1, settle: 0 },
    steps: [{ id: 0, depth: 0, incoming: 3, outgoing: 1, from, to }] };
  const view = new MosaicView(svg, state);
  view.prepare(plan);
  view.paint(.5);
  assert.equal(root.querySelector('[data-new]').getAttribute('opacity'), '1');
  assert.equal(root.querySelector('[data-new-path]').getAttribute('fill'),
    'var(--signal, #9e88df)');
  assert.ok(Number(root.querySelector('[data-new-clip]').getAttribute('width')) > 0);
  assert.ok(Number(root.querySelector('[data-old-clip]').getAttribute('width')) < 100);
});
