import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

test('homepage marketing copy uses the larger readable type ramp', () => {
  const home = read('src/pages/index.astro');
  const space = read('src/styles/space.css');
  const services = read('src/styles/service-perforations.css');

  assert.match(space, /\.home-hero__intro\s*\{[^}]*font-size:\s*clamp\(1\.125rem, 1\.15vw, 1\.25rem\)/s);
  assert.match(home, /service-section__intro[^"\n]*text-xl/);
  assert.match(services, /\.service-scene__tagline\s*\{[^}]*font-size:\s*1\.25rem[^}]*line-height:\s*1\.8rem/s);
  assert.match(services, /@media \(max-width: 639px\)[\s\S]*?\.service-scene__tagline\s*\{[^}]*font-size:\s*1\.125rem/s);
  assert.match(services, /@media \(max-width: 639px\)[\s\S]*?\.service-scene__highlights\s*\{[^}]*font-size:\s*0\.75rem/s);
});

test('shared marketing surfaces increase prose without enlarging editorial labels', () => {
  const global = read('src/styles/global.css');
  const sectionIntro = read('src/components/studio/SectionIntro.astro');
  const projects = read('src/components/work/ProjectGrid.astro');
  const contact = read('src/components/studio/ContactSection.astro');
  const footer = read('src/components/studio/Footer.astro');
  const button = read('src/components/studio/Button.astro');

  assert.match(global, /--text-base:\s*1rem/);
  assert.match(global, /--text-lg:\s*1\.125rem/);
  assert.match(global, /--text-xl:\s*1\.25rem/);
  assert.match(sectionIntro, /mt-10 text-xl text-neutral-700/);
  assert.match(projects, /mt-7 max-w-xl text-xl text-neutral-700/);
  assert.match(contact, /mt-8 max-w-xl text-xl text-neutral-300/);
  assert.match(contact, /gap-8 text-base text-neutral-300/);
  assert.match(footer, /mt-7 max-w-md text-lg text-neutral-300/);
  assert.match(footer, /mt-10 text-base text-neutral-300/);
  assert.match(footer, /type-narrow text-base text-neutral-300/);
  assert.match(button, /font-display text-sm font-bold/);
  assert.match(global, /\.section-code\s*\{[^}]*font-size:\s*0\.72rem/s);
});
