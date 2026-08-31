import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

test('the homepage places a kinetic process statement between work and pricing', () => {
  const componentPath = 'src/components/studio/ProcessStatement.astro';

  assert.ok(existsSync(join(projectRoot, componentPath)));

  const home = read('src/pages/index.astro');
  const process = read(componentPath);
  const processPosition = home.indexOf('<ProcessStatement />');

  assert.ok(processPosition > home.indexOf('<ProjectGrid'));
  assert.ok(processPosition < home.indexOf('<SectionIntro id="pricing"'));
  assert.match(process, /Cada proyecto empieza por entender el problema\./);
  assert.match(process, /Después definimos el alcance, damos forma al sistema, probamos sus recorridos y publicamos con una operación clara\./);
  assert.match(process, /01[\s\S]*Entender/);
  assert.match(process, /02[\s\S]*Diseñar/);
  assert.match(process, /03[\s\S]*Construir/);
  assert.match(process, /04[\s\S]*Publicar/);
});

test('studio and process statements share one accessible kinetic primitive', () => {
  const primitivePath = 'src/components/studio/KineticStatement.astro';
  const iconPath = 'src/components/studio/KineticStatementIcon.astro';

  assert.ok(existsSync(join(projectRoot, primitivePath)));
  assert.ok(existsSync(join(projectRoot, iconPath)));

  const primitive = read(primitivePath);
  const icon = read(iconPath);
  const studio = read('src/components/studio/StudioStatement.astro');
  const process = read('src/components/studio/ProcessStatement.astro');

  assert.match(studio, /<KineticStatement/);
  assert.match(process, /<KineticStatement/);
  assert.match(primitive, /data-kinetic-statement/);
  assert.match(primitive, /data-kinetic-word/);
  assert.match(primitive, /class="sr-only"/);
  assert.match(primitive, /aria-hidden="true"/);
  assert.match(primitive, /<slot name="footer"/);
  assert.match(studio, /kind: 'light-bulb'/);
  assert.match(studio, /kind: 'user-group'/);
  assert.match(process, /kind: 'viewfinder-circle'/);
  assert.match(process, /kind: 'squares-plus'/);
  assert.match(process, /kind: 'rocket-launch'/);
  assert.match(primitive, /idPrefix={`\$\{id\}-\$\{index\}`}/);
  assert.match(icon, /data-icon-family="heroicons"/);
  assert.match(icon, /idPrefix/);
  assert.match(icon, /kind === 'light-bulb'/);
  assert.match(icon, /kind === 'user-group'/);
  assert.match(icon, /kind === 'viewfinder-circle'/);
  assert.match(icon, /kind === 'squares-plus'/);
  assert.match(icon, /kind === 'rocket-launch'/);
  assert.match(icon, /M6 3a3 3 0 0 0-3 3v1\.5/);
  assert.match(icon, /M9\.315 7\.584C12\.195 3\.883/);
  assert.match(icon, /<linearGradient/);
  assert.match(icon, /#49adff[\s\S]*?var\(--signal-on-dark\)[\s\S]*?var\(--signal\)/);
  assert.match(icon, /#3ea8ff[\s\S]*?#53dfc3[\s\S]*?#a7f3d0/);
  assert.match(icon, /<feGaussianBlur stdDeviation="1\.35"/);
  assert.match(icon, /opacity="0\.68"/);
  assert.match(icon, /filter={`url\(#\$\{glowId\}\)`}/);
  assert.doesNotMatch(icon, /stroke=/);
});

test('copied Heroicons retain their license without adding a client dependency', () => {
  const noticePath = 'THIRD_PARTY_NOTICES.md';

  assert.ok(existsSync(join(projectRoot, noticePath)));

  const notice = read(noticePath);
  const packageJson = read('package.json');

  assert.match(notice, /Heroicons/);
  assert.match(notice, /Copyright \(c\) Tailwind Labs, Inc\./);
  assert.match(notice, /MIT License/);
  assert.match(notice, /github\.com\/tailwindlabs\/heroicons/);
  assert.doesNotMatch(packageJson, /@heroicons/);
});

test('kinetic statements animate as a group and remain legible with reduced motion', () => {
  const animationPath = 'src/scripts/animations/kinetic-statements.js';

  assert.ok(existsSync(join(projectRoot, animationPath)));

  const animation = read(animationPath);
  const main = read('src/scripts/main.js');
  const styles = read('src/styles/interactions.css');

  assert.match(animation, /\[data-kinetic-statement\]/);
  assert.match(animation, /\[data-kinetic-word\]/);
  assert.match(animation, /scrub:\s*true/);
  assert.match(animation, /prefersReduced/);
  assert.match(main, /initKineticStatements/);
  assert.match(styles, /\.kinetic-statement__layout/);
  assert.match(styles, /\.kinetic-statement--process/);
  assert.match(styles, /\.kinetic-statement__stages/);
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?\.kinetic-statement__layout/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.kinetic-statement__accent/);
});
