import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

test('the homepage services alternate masked icons and readable copy', () => {
  const componentPath = 'src/components/studio/ServicePerforations.astro';
  const iconPath = 'src/components/studio/ServicePerforationIcon.astro';

  assert.ok(existsSync(join(projectRoot, componentPath)));
  assert.ok(existsSync(join(projectRoot, iconPath)));

  const home = read('src/pages/index.astro');
  const component = read(componentPath);
  const icon = read(iconPath);
  const servicesStart = home.indexOf('<section id="services"');
  const contentPosition = home.indexOf('<Container class="service-section__content">');
  const perforationsPosition = home.indexOf('<ServicePerforations services={services} />');

  assert.ok(contentPosition > servicesStart);
  assert.ok(perforationsPosition > contentPosition);
  assert.doesNotMatch(home, /<ServiceField \/>/);
  assert.match(component, /data-service-perforations/);
  assert.match(component, /index % 2 === 0 \? 'left' : 'right'/);
  assert.match(component, /data-service-scene/);
  assert.match(component, /data-perforation-side={side}/);
  assert.match(component, /<svg[^>]*data-service-connector[^>]*aria-hidden="true"[^>]*focusable="false"/s);
  assert.match(component, /<path[^>]*data-service-connector-path/);
  assert.match(component, /aria-hidden="true"/);
  assert.match(component, /data-service-perforation/);
  assert.match(component, /data-service-viewport-icon/);
  assert.match(component, /data-service-viewport-anchor/);
  assert.match(component, /ServicePerforationIcon/);
  assert.match(component, /'agentes-de-automatizacion': 'cpu-chip'/);
  assert.match(component, /'sitios-web': 'window'/);
  assert.match(component, /'e-commerce': 'shopping-bag'/);
  assert.match(component, /'software-a-medida': 'command-line'/);
  assert.match(icon, /data-service-perforation-icon/);
  assert.match(icon, /data-icon-family="heroicons"/);
  assert.match(icon, /fill="currentColor"/);
  assert.match(icon, /aria-hidden="true"/);
  assert.match(icon, /kind === 'cpu-chip'/);
  assert.match(icon, /kind === 'window'/);
  assert.match(icon, /kind === 'shopping-bag'/);
  assert.match(icon, /kind === 'command-line'/);
  assert.match(component, /data-service-copy/);
  assert.match(component, /data-perforation-depth/);
  assert.doesNotMatch(component, /canvas|img|picture|video/);
});

test('service perforations reveal alternating copy with transform-only motion', () => {
  const animationPath = 'src/scripts/animations/service-perforations.js';

  assert.ok(existsSync(join(projectRoot, animationPath)));

  const animation = read(animationPath);
  const main = read('src/scripts/main.js');
  const styles = read('src/styles/service-perforations.css');

  assert.match(animation, /\[data-service-perforations\]/);
  assert.match(animation, /\[data-service-scene\]/);
  assert.match(animation, /\[data-service-perforation\]/);
  assert.match(animation, /\[data-service-viewport-icon\]/);
  assert.match(animation, /\[data-service-perforation-icon\]/);
  assert.match(animation, /\[data-service-copy\]/);
  assert.match(animation, /\[data-service-connector\]/);
  assert.match(animation, /\[data-service-connector-path\]/);
  assert.match(animation, /prefersReduced/);
  assert.match(animation, /gsap\.timeline/);
  assert.match(animation, /autoAlpha:\s*0/);
  assert.match(animation, /autoAlpha:\s*1/);
  assert.match(animation, /dataset\.perforationSide/);
  assert.match(animation, /xPercent/);
  assert.match(animation, /yPercent/);
  assert.match(animation, /const iconDrift = 20/);
  assert.match(animation, /--service-mask-x/);
  assert.match(animation, /--service-mask-y/);
  assert.match(animation, /--service-mask-radius/);
  assert.match(animation, /--service-icon-x/);
  assert.match(animation, /window\.addEventListener\('scroll', scheduleRefresh/);
  assert.match(animation, /yPercent:\s*iconDrift[\s\S]*?yPercent:\s*-iconDrift/s);
  assert.match(animation, /start:\s*'top bottom'[\s\S]*?end:\s*'bottom top'/s);
  assert.match(animation, /const revealTimeline = gsap\.timeline/);
  assert.match(animation, /scrub:\s*true/);
  assert.match(animation, /getBoundingClientRect/);
  assert.match(animation, /setAttribute\('viewBox'/);
  assert.match(animation, /setAttribute\('d'/);
  assert.match(animation, /matchMedia\('\(min-width: 640px\)'\)/);
  assert.match(animation, /const refreshVisuals = \(\) => \{[\s\S]*?refreshConnector\(\)[\s\S]*?refreshViewportIcons\(\)/s);
  assert.match(animation, /onUpdate:\s*refreshVisuals/);
  assert.doesNotMatch(animation, /gsap\.set\([^;]+\b(?:width|height|top|left):/s);
  assert.doesNotMatch(animation, /\.to\(\s*[^,]+,\s*\{[^}]*\b(?:width|height|top|left):/s);
  assert.match(main, /initServicePerforations/);
  assert.doesNotMatch(main, /initServiceFields/);
  assert.match(styles, /\.service-perforations__circle\s*\{[^}]*border-radius:\s*50%/s);
  assert.match(styles, /\.service-perforations__circle\s*\{[^}]*background:\s*var\(--void\)/s);
  assert.match(styles, /\.service-perforations__circle\s*\{[^}]*border:\s*0/s);
  assert.match(styles, /\.service-perforations__viewport-icon\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0/s);
  assert.match(styles, /\.service-perforations__viewport-icon\s*\{[^}]*clip-path:\s*circle\(/s);
  assert.match(styles, /\.service-perforations__viewport-anchor\s*\{[^}]*left:\s*var\(--service-icon-x\)[^}]*top:\s*50%[^}]*transform:\s*translate\(-50%, -50%\)/s);
  assert.match(styles, /\.service-perforations__icon\s*\{[^}]*color:\s*var\(--color-brand\)/s);
  assert.match(styles, /\.service-perforations__icon\s*\{[^}]*inline-size:\s*clamp\(18rem, 30vw, 25rem\)/s);
  assert.match(styles, /\.service-perforations__connector-path\s*\{[^}]*fill:\s*none[^}]*stroke:\s*var\(--service-heading\)[^}]*vector-effect:\s*non-scaling-stroke/s);
  assert.doesNotMatch(styles, /\.service-section\s*\{[^}]*overflow:\s*(?:hidden|clip)/s);
  assert.doesNotMatch(styles, /\.service-scene\s*\{[^}]*overflow:\s*(?:hidden|clip)/s);
  assert.match(styles, /\.service-scene\[data-perforation-side='left'\][\s\S]*?\.service-scene__copy/s);
  assert.match(styles, /\.service-scene\[data-perforation-side='right'\][\s\S]*?\.service-scene__copy/s);
  assert.match(styles, /data-perforation-side='left'[^}]*\{[^}]*left:\s*clamp\(0rem,/s);
  assert.match(styles, /data-perforation-side='right'[^}]*\{[^}]*right:\s*clamp\(0rem,/s);
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?\.service-scene\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?\.service-scene__copy\s*\{[^}]*order:\s*1/s);
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?\.service-perforations__circle\s*\{[^}]*--perforation-size:\s*clamp\(19rem, 88vw, 28rem\)/s);
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?\.service-perforations__circle\s*\{[^}]*position:\s*relative[^}]*order:\s*2/s);
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?left:\s*auto[^}]*right:\s*auto/s);
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?\.service-perforations__connector\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.service-scene__copy/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.service-perforations__icon[\s\S]*?transform:\s*none !important/s);
});

test('the services section uses a luminous primary surface and local dark contrast colors', () => {
  const home = read('src/pages/index.astro');
  const global = read('src/styles/global.css');
  const styles = read('src/styles/service-perforations.css');
  const servicesStart = home.indexOf('<section id="services"');
  const servicesEnd = home.indexOf('</section>', servicesStart);
  const servicesMarkup = home.slice(servicesStart, servicesEnd);

  assert.doesNotMatch(servicesMarkup, /section-plane/);
  assert.match(servicesMarkup, /service-section__title/);
  assert.match(servicesMarkup, /service-section__intro/);
  assert.doesNotMatch(servicesMarkup, /text-neutral-700|text-white/);
  assert.match(styles, /\.service-section\s*\{[^}]*--service-heading:\s*var\(--void\)[^}]*--service-body:\s*var\(--color-brand-deep\)[^}]*--service-meta:\s*var\(--night\)[^}]*background:\s*var\(--color-brand\)/s);
  assert.match(styles, /\.service-section__title\s*\{[^}]*color:\s*var\(--service-heading\)/s);
  assert.match(styles, /\.service-section__intro\s*\{[^}]*color:\s*var\(--service-body\)/s);
  assert.match(styles, /\.service-scene__tagline\s*\{[^}]*color:\s*var\(--service-body\)/s);
  assert.match(styles, /\.service-scene__highlights\s*\{[^}]*color:\s*var\(--service-meta\)/s);
  assert.match(global, /--color-brand:\s*#9c7ae6/);
  assert.match(global, /--color-brand-button:\s*#9c7ae6/);
});

test('copied service Heroicons retain their source license', () => {
  const notices = read('THIRD_PARTY_NOTICES.md');

  assert.match(notices, /ServicePerforationIcon\.astro/);
  assert.match(notices, /Heroicons 24px solid collection/);
  assert.match(notices, /MIT License/);
  assert.match(notices, /Copyright \(c\) Tailwind Labs/);
});
