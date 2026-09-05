import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url));
const pngSize = name => {
  const png = read(name);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
};

test('browser and home-screen icons retain their public URLs and square dimensions', () => {
  assert.deepEqual(pngSize('public/favicon.png'), [512, 512]);
  assert.deepEqual(pngSize('public/apple-touch-icon.png'), [180, 180]);
  const svg = read('public/favicon.svg').toString();
  const symbol = read('src/assets/images/eddndev.svg').toString();
  assert.match(svg, /viewBox="0 0 384 384"/);
  assert.equal(svg.match(/ d="([^"]+)"/)[1], symbol.match(/ d="([^"]+)"/)[1]);
  assert.doesNotMatch(svg, /<image\b|<script\b|<foreignObject\b/);
  const layout = read('src/layouts/Layout.astro').toString();
  for (const url of ['/favicon.svg', '/favicon.ico', '/favicon.png', '/apple-touch-icon.png']) {
    assert.ok(layout.includes(`href="${url}"`), `${url} remains discoverable from every page`);
  }
});

test('ICO contains valid images for small tabs and high density displays', () => {
  const ico = read('public/favicon.ico');
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  const dimensions = [];
  for (let i = 0; i < ico.readUInt16LE(4); i++) {
    const offset = 6 + i * 16;
    const width = ico[offset] || 256;
    const height = ico[offset + 1] || 256;
    assert.equal(width, height);
    dimensions.push(width);
    const bytes = ico.readUInt32LE(offset + 8);
    const start = ico.readUInt32LE(offset + 12);
    assert.ok(start + bytes <= ico.length && bytes > 0);
    const image = ico.subarray(start, start + bytes);
    assert.ok(image.subarray(1, 4).toString() === 'PNG' || image.readUInt32LE(0) === 40, 'each entry contains PNG or DIB image data');
  }
  assert.deepEqual(dimensions.sort((a, b) => a - b), [16, 32, 48, 64, 128, 256]);
});
