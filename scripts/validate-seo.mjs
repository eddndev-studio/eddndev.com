import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parse } from 'parse5';

const root = resolve('dist');
const origin = 'https://eddndev.com';
const read = (path) => readFileSync(join(root, path), 'utf8');
const attrs = (node) => Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
const text = (node) => node.value || (node.childNodes || []).map(text).join('');
function elements(node) {
  return [node, ...(node.childNodes || []).flatMap(elements)];
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
}
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const index = read('sitemap-index.xml');
assert.match(index, /<sitemapindex\s[^>]*xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
const sitemapFiles = locs(index);
assert.ok(sitemapFiles.length, 'Sitemap index is empty');
const sitemapURLs = sitemapFiles.flatMap((url) => {
  const parsed = new URL(url);
  assert.equal(parsed.origin, origin, `Foreign sitemap: ${url}`);
  const xml = read(parsed.pathname);
  assert.match(xml, /<urlset\s[^>]*xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
  return locs(xml);
});
assert.equal(new Set(sitemapURLs).size, sitemapURLs.length, 'Duplicate sitemap URLs');
assert.match(read('robots.txt'), /^Sitemap: https:\/\/eddndev\.com\/sitemap-index\.xml$/m);
assert.doesNotMatch(read('robots.txt'), /^Disallow:\s*\/\s*$/m);

const pages = new Map();
const titles = new Set();
const descriptions = new Set();
for (const file of files(root).filter((path) => path.endsWith('.html'))) {
  const path = `/${relative(root, file).replace(/index\.html$/, '')}`;
  const nodes = elements(parse(readFileSync(file, 'utf8')));
  const tags = (tag) => nodes.filter((node) => node.tagName === tag);
  const meta = (name) => tags('meta').filter((node) => attrs(node).name === name || attrs(node).property === name);
  const canonicals = tags('link').filter((node) => attrs(node).rel === 'canonical');
  const noindex = meta('robots').some((node) => /noindex/.test(attrs(node).content));
  assert.equal(attrs(tags('html')[0]).lang, 'es', `${path}: missing Spanish language`);
  assert.equal(tags('h1').length, 1, `${path}: expected one h1`);
  assert.ok(text(tags('h1')[0]).trim(), `${path}: empty h1`);
  assert.equal(tags('title').length, 1, `${path}: expected one title`);
  const title = text(tags('title')[0]);
  assert.ok(title.length >= 10 && title.length <= 90, `${path}: invalid title length`);
  assert.ok(!titles.has(title), `${path}: duplicate title`);
  titles.add(title);
  assert.equal(meta('description').length, 1, `${path}: expected one description`);
  const description = attrs(meta('description')[0]).content;
  assert.ok(description.length >= (noindex ? 10 : 50) && description.length <= 220, `${path}: invalid description length`);
  assert.ok(!descriptions.has(description), `${path}: duplicate description`);
  descriptions.add(description);
  if (noindex) {
    assert.equal(path, '/404.html', `Unexpected noindex: ${path}`);
    assert.equal(canonicals.length, 0, '404 must not have a canonical');
    assert.ok(!sitemapURLs.includes(`${origin}${path}`), '404 leaked into sitemap');
  } else {
    assert.ok(path.endsWith('/'), `${path}: noncanonical route`);
    assert.equal(canonicals.length, 1, `${path}: expected one canonical`);
    assert.equal(attrs(canonicals[0]).href, `${origin}${path}`, `${path}: canonical mismatch`);
    assert.ok(sitemapURLs.includes(`${origin}${path}`), `${path}: missing from sitemap`);
    for (const name of ['og:url', 'twitter:url']) {
      assert.equal(attrs(meta(name)[0]).content, `${origin}${path}`, `${path}: ${name} mismatch`);
    }
    const image = new URL(attrs(meta('og:image')[0]).content);
    assert.equal(image.protocol, 'https:');
    assert.ok(!image.pathname.endsWith('.svg'), `${path}: SVG social preview is unsupported`);
    assert.equal(attrs(meta('og:image:type')[0]).content, 'image/png');
    assert.equal(attrs(meta('og:image:width')[0]).content, '1200');
    assert.equal(attrs(meta('og:image:height')[0]).content, '630');
  }
  const schema = tags('script').filter((node) => attrs(node).type === 'application/ld+json').map((node) => JSON.parse(text(node)));
  const organization = schema.find((node) => node['@id'] === `${origin}/#organization`);
  assert.equal(organization?.parentOrganization?.name, 'The Dash Studios', `${path}: missing parent organization`);
  assert.equal(organization.parentOrganization['@id'], 'https://thedashstudios.mx/#organization');
  if (!noindex) {
    assert.ok(schema.some((node) => node['@id'] === `${origin}${path}#webpage`), `${path}: missing WebPage`);
    const breadcrumb = schema.find((node) => node['@type'] === 'BreadcrumbList');
    if (path !== '/') {
      assert.ok(breadcrumb, `${path}: missing breadcrumbs`);
      assert.equal(breadcrumb.itemListElement.at(-1).item, `${origin}${path}`);
      for (const item of breadcrumb.itemListElement) assert.ok(sitemapURLs.includes(item.item), `${path}: breadcrumb points at noncanonical URL ${item.item}`);
    }
  }
  assert.ok(tags('footer').some((node) => text(node).includes('The Dash Studios')), `${path}: missing ownership attribution`);
  for (const node of tags('img')) {
    const a = attrs(node);
    assert.ok('alt' in a, `${path}: image has no alt`);
    assert.ok(a.width && a.height, `${path}: image has no dimensions`);
  }
  for (const node of nodes) {
    const a = attrs(node);
    const source = a.src || (node.tagName === 'link' && /^(stylesheet|preload|icon|apple-touch-icon)$/.test(a.rel) ? a.href : null);
    if (!source) continue;
    const asset = new URL(source, `${origin}${path}`);
    if (asset.origin === origin) assert.ok(existsSync(join(root, decodeURIComponent(asset.pathname))), `${path}: missing asset ${source}`);
  }
  pages.set(path, { nodes, tags, noindex });
}

assert.equal(pages.size - 1, sitemapURLs.length, 'Sitemap and built page counts differ');
const incoming = new Set(['/']);
for (const [path, page] of pages) {
  for (const node of page.tags('a')) {
    const a = attrs(node);
    assert.ok(a.href, `${path}: anchor without href`);
    if (/^(mailto:|tel:)/.test(a.href)) continue;
    const url = new URL(a.href, `${origin}${path}`);
    if (url.origin !== origin) continue;
    const target = pages.get(url.pathname);
    if (!target) {
      assert.ok(existsSync(join(root, decodeURIComponent(url.pathname))) && !url.pathname.endsWith('/'), `${path}: broken or noncanonical link ${a.href}`);
      continue;
    }
    assert.ok(!target.noindex || (url.pathname === path && url.hash), `${path}: link to excluded page ${a.href}`);
    if (!page.noindex) incoming.add(url.pathname);
    if (url.hash) assert.ok(target.nodes.some((n) => attrs(n).id === decodeURIComponent(url.hash.slice(1))), `${path}: broken fragment ${a.href}`);
  }
}
for (const [path, page] of pages) {
  if (!page.noindex) assert.ok(incoming.has(path), `${path}: orphan page`);
}
console.log(`SEO OK: ${sitemapURLs.length} canonical URLs, sitemap coverage, metadata, JSON-LD, ownership, headings, image attributes and all internal links/fragments.`);
