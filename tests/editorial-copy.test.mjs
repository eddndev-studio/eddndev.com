import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const publicCopyRoots = [
  'src/components',
  'src/content/work',
  'src/data',
  'src/layouts',
  'src/pages',
];

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function collectCopyFiles(directory) {
  return readdirSync(join(projectRoot, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = join(directory, entry.name);
      if (entry.isDirectory()) return collectCopyFiles(relativePath);
      return ['.astro', '.mdx', '.ts'].includes(extname(entry.name)) ? [relativePath] : [];
    });
}

const copyFiles = publicCopyRoots.flatMap(collectCopyFiles);
const publicCopy = copyFiles.map((file) => `${file}\n${read(file)}`).join('\n');

test('public copy avoids canned marketing formulas and unsupported claims', () => {
  const bannedPatterns = [
    /[—–]/u,
    /\bno (?:es|son|solo|sólo)\b/iu,
    /avance revolucionario|cambio de paradigma/iu,
    /\bpremium\b|\bobsesi[oó]n\b|\blegado\b|hacer realidad/iu,
    /al instante|control total|100\s*%|0\s*%|impecable|sin fricciones|durante años/iu,
    /cargan rápido|Calificación de leads|Data entry|Workflows internos/iu,
    /4[,.]400\+|sin confiar en terceros|https:\/\/docs\.achrony\.me/iu,
    /Yatagarasu/iu,
  ];

  for (const pattern of bannedPatterns) {
    assert.doesNotMatch(publicCopy, pattern);
  }
});

test('the commercial site speaks as a studio instead of an individual provider', () => {
  const individualPhrases = [
    /\bSoy Eduardo\b/iu,
    /\buna persona a cargo\b|\bla misma persona\b/iu,
    /\bPuedo ayudarte\b|\bQué ofrezco\b|\bLo que resuelvo\b/iu,
    /\bPrimero reviso\b|\bCuéntame\b|\bEscríbeme\b|\bSígueme\b/iu,
    /\bConstruyo agentes\b|\bDesarrollo sitios\b|\bConstruyo catálogos\b|\bDesarrollo backends\b/iu,
    /\bReúno productos\b|\bMi trabajo abarca\b|\bAtaulfo es mi producto\b/iu,
  ];

  for (const pattern of individualPhrases) {
    assert.doesNotMatch(publicCopy, pattern);
  }

  const home = read('src/pages/index.astro');
  const profile = read('src/pages/profile.astro');
  const layout = read('src/layouts/Layout.astro');
  const navigation = read('src/components/studio/SiteNav.astro');
  const statement = read('src/components/studio/StudioStatement.astro');

  assert.match(home, /<StudioStatement \/>/);
  assert.match(statement, /es también un estudio/);
  assert.match(home, />Qué hacemos<\/h2>/);
  assert.match(profile, /Quienes proponen también construyen/);
  assert.match(profile, /Eduardo Alonso[\s\S]*?dirección técnica del estudio/);
  assert.match(layout, /const organizationLD/);
  assert.match(layout, /"@type": "Organization"/);
  assert.doesNotMatch(layout, /const personLD/);
  assert.match(navigation, /label: 'Estudio', href: '\/profile\/'/);
});

test('the Achronyme case cites the current release and technical evidence', () => {
  const source = read('src/content/work/achronyme.mdx');

  assert.match(source, /Versión pública v0\.1\.2/);
  assert.match(source, /https:\/\/github\.com\/achronyme\/achronyme/);
  assert.match(source, /https:\/\/achrony\.me\/docs\/getting-started\/introduction\//);
  assert.match(source, /https:\/\/eddn\.dev\/es\/articles\/achronyme-three-vms\//);
  assert.match(source, /https:\/\/eddn\.dev\/es\/articles\/achronyme-prove-ir\//);
  assert.match(source, /https:\/\/github\.com\/achronyme\/achronyme\/releases\/tag\/v0\.1\.2/);
  assert.match(source, /\bAkron\b/);
  assert.match(source, /\bArtik\b/);
  assert.match(source, /\bLysis\b/);
  assert.match(source, /\bProveIR\b/);
  assert.doesNotMatch(source, /4[,.]400\+/);
});

test('the Syle case presents both sites as parallel parts of the collaboration', () => {
  const source = read('src/content/work/sylestudio.mdx');

  assert.match(source, /https:\/\/sylestudio\.com/);
  assert.match(source, /https:\/\/syle\.studio/);
  assert.doesNotMatch(source, /https:\/\/github\.com\/sylestudio\/syle\.studio/);
  assert.match(source, /estudio más personal/);
  assert.match(source, /continúan evolucionando en paralelo/);
  assert.match(source, /La tienda sigue en desarrollo/);
  assert.match(source, /comisiones y condiciones/);
});

test('the portfolio contains the current product cases', () => {
  const workFiles = readdirSync(join(projectRoot, 'src/content/work'));

  assert.ok(workFiles.includes('ataulfo.mdx'));
  assert.ok(workFiles.includes('achronyme.mdx'));
  assert.ok(workFiles.includes('sylestudio.mdx'));
  assert.ok(!workFiles.some((file) => /yatagarasu/i.test(file)));
});
