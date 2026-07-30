import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

function collectInterfaceFiles(directory = 'src') {
  return readdirSync(join(projectRoot, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = join(directory, entry.name);
      if (entry.isDirectory()) return collectInterfaceFiles(relativePath);
      return ['.astro', '.css', '.js'].includes(extname(entry.name)) ? [relativePath] : [];
    });
}

test('the visual system stays open and restrained', () => {
  const source = collectInterfaceFiles().map(read).join('\n');

  assert.doesNotMatch(source, /orbit-panel|panel-brand|hairline-grid|cosmic-band/);
  assert.doesNotMatch(source, /hero-celestial|page-intro__halo/);
  assert.doesNotMatch(source, /radial-gradient|box-shadow|\bblur(?:\(|-|:)/);
  assert.doesNotMatch(source, /rounded-full|rounded-\[50%\]/);
  assert.doesNotMatch(source, /(?:h-2 w-2|w-2 h-2)[^"\n]*bg-brand/);
});

test('section labels use a rule without a decorative marker', () => {
  const styles = read('src/styles/global.css');

  assert.match(styles, /\.section-code::after/);
  assert.doesNotMatch(styles, /\.section-code::before/);
});

test('the background is a deforming kinetic canvas', () => {
  const componentPath = 'src/components/studio/KineticCanvas.astro';
  const scriptPath = 'src/scripts/features/kinetic-canvas.js';
  const electricityPath = 'src/scripts/features/electric-pulses.js';

  assert.ok(existsSync(join(projectRoot, componentPath)));
  assert.ok(existsSync(join(projectRoot, scriptPath)));
  assert.ok(existsSync(join(projectRoot, electricityPath)));

  const component = read(componentPath);
  const script = read(scriptPath);
  const electricity = read(electricityPath);
  const space = read('src/styles/space.css');

  assert.match(component, /<canvas[^>]+data-kinetic-canvas/);
  assert.match(component, /data-kinetic-foreground/);
  assert.match(component, /path === '\/'/);
  assert.doesNotMatch(component, /fallback|radial-gradient/);
  assert.match(script, /function buildRow/);
  assert.match(script, /function buildColumn/);
  assert.match(script, /function deformPoint/);
  assert.match(script, /function drawForegroundPath/);
  assert.match(script, /foregroundContext/);
  assert.match(script, /const foregroundLifts =[\s\S]*?electricPulses\.render/);
  assert.match(script, /electricPulses\.renderForeground/);
  assert.doesNotMatch(script, /FOREGROUND_CYCLE|FOREGROUND_ACTIVE/);
  assert.match(script, /createElectricPulses/);
  assert.match(electricity, /function createPulse/);
  assert.match(electricity, /function updatePulses/);
  assert.match(electricity, /function drawChargedCable/);
  assert.match(electricity, /function drawElectricPulse/);
  assert.match(electricity, /function foregroundLift/);
  assert.match(electricity, /allowForeground/);
  assert.match(electricity, /renderForeground/);
  assert.doesNotMatch(electricity, /forks|drawElectricForks/);
  assert.match(electricity, /const ELECTRIC_FILAMENTS = \[/);
  assert.match(electricity, /ELECTRIC_FILAMENTS[\s\S]*?\.map/);
  assert.match(electricity, /57, 214, 255/);
  assert.match(electricity, /73, 173, 255/);
  assert.match(electricity, /139, 76, 255/);
  assert.match(electricity, /state\.items\.length < \(mobile \? 2 : 3\)/);
  assert.doesNotMatch(electricity, /columnCount|columnPaths|kind: ['"]column['"]/);
  assert.match(script, /setLineDash/);
  assert.match(script, /prefersReduced/);
  assert.match(space, /\.kinetic-canvas--foreground/);
  assert.match(space, /z-index:\s*20/);
  assert.match(space, /pointer-events:\s*none/);
  assert.doesNotMatch(`${script}\n${electricity}`, /\bstars?\b|nebula|shadowBlur|globalCompositeOperation/);
});

test('primary collections are rendered as editorial rows', () => {
  const sources = [
    read('src/components/work/ProjectGrid.astro'),
    read('src/pages/index.astro'),
    read('src/pages/services.astro'),
    read('src/components/automation/ProcessSection.astro'),
  ].join('\n');

  assert.match(sources, /data-editorial-row/);
  assert.doesNotMatch(sources, /rounded-|shadow-|bg-white\/\[/);
});

test('the homepage communicates the offer through a pointer-driven ASCII fluid field', () => {
  const home = read('src/pages/index.astro');
  const field = read('src/scripts/features/service-field.js');

  assert.match(home, />Sitios\.<\/span>/);
  assert.match(home, />Sistemas\.<\/span>/);
  assert.match(home, />Automatización\.<\/span>/);
  assert.match(home, /<h2[^>]*>Qué ofrezco<\/h2>/);
  assert.match(home, /data-services-section[\s\S]*<ServiceField \/>[\s\S]*<Container/);
  assert.match(home, /data-service-explorer/);
  assert.match(home, /data-service-row/);
  assert.match(field, /ASCII_GLYPHS/);
  assert.match(field, /function advect/);
  assert.match(field, /function project/);
  assert.match(field, /function renderAscii/);
  assert.match(field, /pointermove/);
  assert.match(field, /IntersectionObserver/);
  assert.doesNotMatch(field, /pointerenter|focusin|targetMode|setMode/);
});

test('the homepage introduces the studio with a scroll-driven statement before services', () => {
  const componentPath = 'src/components/studio/StudioStatement.astro';
  const animationPath = 'src/scripts/animations/studio-statement.js';

  assert.ok(existsSync(join(projectRoot, componentPath)));
  assert.ok(existsSync(join(projectRoot, animationPath)));

  const home = read('src/pages/index.astro');
  const component = read(componentPath);
  const animation = read(animationPath);
  const main = read('src/scripts/main.js');
  const layout = read('src/layouts/Layout.astro');
  const interactions = read('src/styles/interactions.css');
  const statement = "edd n'dev nació para desarrollar ideas propias. Hoy seguimos uniendo al equipo adecuado para hacer realidad soluciones.";

  assert.ok(home.indexOf('<StudioStatement />') < home.indexOf('<section id="services"'));
  assert.ok(component.includes(statement));
  assert.match(component, /data-studio-statement/);
  assert.match(component, /data-studio-word/);
  assert.match(component, /class="sr-only"/);
  assert.match(animation, /gsap\.timeline/);
  assert.match(animation, /scrub:\s*true/);
  assert.match(animation, /end:\s*'bottom 60%'/);
  assert.match(animation, /prefersReduced/);
  assert.match(main, /initStudioStatement/);
  assert.match(layout, /page-surface[^"\n]*overflow-x-clip/);
  assert.doesNotMatch(layout, /page-surface[^"\n]*overflow-hidden/);
  assert.match(interactions, /\.studio-statement__layout/);
  assert.doesNotMatch(interactions, /\.studio-statement__[^{]+\{[^}]*position:\s*sticky/);
});

test('focused interface files remain maintainable', () => {
  const files = [
    'src/styles/global.css',
    'src/styles/space.css',
    'src/components/studio/KineticCanvas.astro',
    'src/components/studio/StudioStatement.astro',
    'src/scripts/features/kinetic-canvas.js',
    'src/scripts/animations/studio-statement.js',
    'src/components/work/ProjectGrid.astro',
    'src/pages/index.astro',
  ];

  for (const file of files) {
    assert.ok(read(file).split('\n').length < 400, `${file} must stay below 400 lines`);
  }
});
