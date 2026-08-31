import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

test('the studio statement pins while the services surface moves above it', () => {
  const animationPath = 'src/scripts/animations/studio-services-transition.js';

  assert.ok(existsSync(join(projectRoot, animationPath)));

  const studio = read('src/components/studio/StudioStatement.astro');
  const statement = read('src/components/studio/KineticStatement.astro');
  const animation = read(animationPath);
  const main = read('src/scripts/main.js');
  const interactions = read('src/styles/interactions.css');
  const services = read('src/styles/service-perforations.css');

  assert.match(studio, /pinTarget="#services"/);
  assert.match(statement, /pinTarget\?: string/);
  assert.match(statement, /data-kinetic-pin-target={pinTarget}/);
  assert.match(animation, /\[data-kinetic-pin-target\]/);
  assert.match(animation, /section\.dataset\.kineticPinTarget/);
  assert.match(animation, /prefersReduced\(\)/);
  assert.match(animation, /gsap\.matchMedia\(\)/);
  assert.match(animation, /media\.add\('\(min-height: 640px\)'/);
  assert.match(animation, /pin:\s*section/);
  assert.match(animation, /pinSpacing:\s*false/);
  assert.doesNotMatch(animation, /anticipatePin/);
  assert.match(animation, /start:\s*'top top'/);
  assert.match(animation, /endTrigger:\s*target/);
  assert.match(animation, /end:\s*'top top'/);
  assert.match(animation, /scrub:\s*0\.55/);
  assert.match(animation, /refreshPriority:\s*1/);
  assert.match(animation, /yPercent:/);
  assert.match(animation, /scale:/);
  assert.match(animation, /autoAlpha:\s*0/);
  assert.match(main, /initStudioServicesTransition/);
  assert.ok(main.indexOf('initStudioServicesTransition,') < main.indexOf('initKineticStatements,'));
  assert.match(interactions, /\.kinetic-statement\[data-kinetic-pin-target\]\s*\{[^}]*z-index:\s*1/s);
  assert.match(services, /\.service-section\s*\{[^}]*z-index:\s*2/s);
});

test('the studio transition stays decorative and leaves reduced motion static', () => {
  const animation = read('src/scripts/animations/studio-services-transition.js');
  const statement = read('src/components/studio/KineticStatement.astro');

  assert.match(animation, /if \(!section \|\| prefersReduced\(\)\) return/);
  assert.match(animation, /onPageCleanup\(\(\) => media\.revert\(\)\)/);
  assert.doesNotMatch(animation, /addEventListener|onclick|tabindex/);
  assert.match(statement, /aria-labelledby={labelId}/);
});
