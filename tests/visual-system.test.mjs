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

test('section boundaries use whitespace while lists retain separators', () => {
  const sectionShells = [
    'src/components/blocks/TextBlock.astro',
    'src/components/studio/ContactSection.astro',
    'src/components/studio/Footer.astro',
    'src/components/studio/PageIntro.astro',
    'src/components/studio/SectionIntro.astro',
    'src/components/studio/SiteNav.astro',
    'src/components/work/NextProject.astro',
  ].map(read).join('\n');
  const sectionPages = [
    'src/pages/contact.astro',
    'src/pages/index.astro',
    'src/pages/profile.astro',
    'src/pages/work/[slug].astro',
  ].map(read).join('\n');
  const global = read('src/styles/global.css');
  const interactions = read('src/styles/interactions.css');

  assert.doesNotMatch(sectionShells, /\bborder-(?:t|b|y)\b|scroll-rule/);
  assert.doesNotMatch(sectionPages, /\bborder-t\b/);
  assert.doesNotMatch(global, /\.section-plane\s*\{[^}]*border-/s);
  assert.doesNotMatch(interactions, /\.kinetic-statement__track\s*\{[^}]*border-/s);
  assert.match(global, /\.editorial-grid,[\s\S]*?border-top/);
  assert.match(global, /\[data-editorial-row\][\s\S]*?border-bottom/);
  assert.match(read('src/components/work/ProjectGrid.astro'), /<dl[^>]*border-t/);
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
  assert.match(script, /const repelX = pointerDx \* repulsionInfluence/);
  assert.match(script, /foldX \* fold \+ repelX \* pointer\.active/);
  assert.doesNotMatch(script, /pointerPull/);
  assert.match(electricity, /const path = rowPaths\[pulse\.index\];\s*if \(!path\) return;/);
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

test('alternating project media uses one desktop column start at a time', () => {
  const projectGrid = read('src/components/work/ProjectGrid.astro');

  assert.match(projectGrid, /index % 2 === 1 \? 'lg:col-start-1' : 'lg:col-start-8'/);
  assert.doesNotMatch(projectGrid, /lg:col-start-8'\s*,\s*index % 2 === 1/);
});

test('the homepage communicates the offer through an editorial perforated field', () => {
  const home = read('src/pages/index.astro');
  const perforations = read('src/components/studio/ServicePerforations.astro');
  const space = read('src/styles/space.css');

  assert.match(home, />Estudio de diseño<\/span>/);
  assert.match(home, />e ingeniería<\/span>/);
  assert.match(home, />digital\.<\/span>/);
  assert.match(home, /Somos un equipo de ingenieros y diseñadores\./);
  assert.match(home, /Creamos sitios, sistemas y automatizaciones para proyectos y organizaciones/);
  assert.match(home, /para que el diseño y la ingeniería sean su ventaja\./);
  assert.doesNotMatch(home, />Sitios\.|>Sistemas\.|>Automatización\./);
  assert.match(home, /<section class="home-hero">/);
  assert.doesNotMatch(home, /<Container class="mt-24 sm:mt-32 lg:mt-40">/);
  assert.match(space, /\.home-hero\s*\{[^}]*min-height:\s*calc\(100dvh - 6\.25rem\)/s);
  assert.match(space, /\.home-hero__copy\s*\{[^}]*align-self:\s*center/s);
  assert.match(space, /\.home-hero__title\s*\{[^}]*clamp\(3\.75rem, min\(9vw, 22dvh\), 11rem\)/s);
  assert.doesNotMatch(space, /\.home-hero__title-(?:accent|tail)/);
  assert.match(space, /@media \(min-width: 900px\)[\s\S]*?\.home-hero__intro\s*\{[^}]*grid-column:\s*9 \/ -1/s);
  assert.match(space, /\.kinetic-canvas\s*\{[^}]*height:\s*clamp\(24rem, max\(44vw, 62dvh\), 44rem\)/s);
  assert.match(space, /@media \(max-width: 720px\)[\s\S]*?\.kinetic-canvas\s*\{[^}]*height:\s*clamp\(24rem, 62dvh, 40rem\)/s);
  assert.match(home, /<h2[^>]*>Qué hacemos<\/h2>/);
  assert.match(home, /data-services-section[\s\S]*<Container[\s\S]*<ServicePerforations services={services} \/>/);
  assert.doesNotMatch(home, /<ServiceField \/>/);
  assert.match(perforations, /data-service-perforations/);
  assert.match(perforations, /data-service-scene/);
  assert.match(perforations, /data-service-row/);
  assert.match(perforations, /data-service-copy/);
  assert.match(perforations, /data-perforation-depth/);
  assert.doesNotMatch(perforations, /canvas|img|picture|video/);
});

test('directional links use the shared SVG arrow instead of text glyphs', () => {
  const arrow = read('src/components/studio/ArrowRightIcon.astro');
  const sources = [
    'src/components/studio/Button.astro',
    'src/components/studio/SiteNav.astro',
    'src/pages/index.astro',
  ].map(read).join('\n');

  assert.match(arrow, /inline-flex shrink-0 items-center justify-center/);
  assert.match(arrow, /size === 'sm' \? 'size-4' : 'size-5'/);
  assert.match(arrow, /M16\.72 7\.72a\.75\.75/);
  assert.match(arrow, /fill="currentColor"/);
  assert.match(sources, /<ArrowRightIcon/);
  assert.doesNotMatch(sources, />-&gt;<|>-&gt;</);
});

test('the homepage introduces the studio with a scroll-driven statement before services', () => {
  const componentPath = 'src/components/studio/KineticStatement.astro';
  const iconPath = 'src/components/studio/KineticStatementIcon.astro';
  const animationPath = 'src/scripts/animations/kinetic-statements.js';

  assert.ok(existsSync(join(projectRoot, componentPath)));
  assert.ok(existsSync(join(projectRoot, iconPath)));
  assert.ok(existsSync(join(projectRoot, animationPath)));

  const home = read('src/pages/index.astro');
  const component = read(componentPath);
  const icons = read(iconPath);
  const studio = read('src/components/studio/StudioStatement.astro');
  const animation = read(animationPath);
  const main = read('src/scripts/main.js');
  const layout = read('src/layouts/Layout.astro');
  const interactions = read('src/styles/interactions.css');
  const statement = "edd n'dev nació para desarrollar ideas propias. Hoy es también un estudio para construir productos y colaborar con otros equipos desde la idea hasta su publicación.";

  assert.ok(home.indexOf('<StudioStatement />') < home.indexOf('<section id="services"'));
  assert.ok(studio.includes(statement));
  assert.match(component, /data-kinetic-statement/);
  assert.match(component, /data-kinetic-word/);
  assert.match(component, /data-kinetic-accent-anchor/);
  assert.match(component, /kinetic-statement__accent-group/);
  assert.match(studio, /anchor: 'equipos', kind: 'user-group'/);
  assert.match(component, /data-kinetic-accent/);
  assert.match(component, /data-kinetic-accent-word/);
  assert.match(component, /data-kinetic-scrub-start/);
  assert.match(component, /idPrefix={`\$\{id\}-\$\{index\}`}/);
  assert.match(icons, /viewBox="0 0 24 24"/);
  assert.match(icons, /fill="none"/);
  assert.match(icons, /data-icon-family="heroicons"/);
  assert.match(icons, /M12 \.75a8\.25 8\.25/);
  assert.match(icons, /M8\.25 6\.75a3\.75 3\.75/);
  assert.match(icons, /<linearGradient/);
  assert.match(icons, /<feGaussianBlur stdDeviation="1\.35"/);
  assert.match(icons, /#49adff[\s\S]*?#3ea8ff[\s\S]*?#53dfc3[\s\S]*?#a7f3d0/);
  assert.doesNotMatch(icons, /stroke=/);
  assert.match(component, /class="sr-only"/);
  assert.match(animation, /gsap\.timeline/);
  assert.match(animation, /scrub:\s*true/);
  assert.match(animation, /trigger:\s*scrollStartWord/);
  assert.match(animation, /start:\s*'top 80%'/);
  assert.match(animation, /endTrigger:\s*section/);
  assert.match(animation, /end:\s*'bottom 80%'/);
  assert.match(animation, /prefersReduced/);
  assert.match(animation, /accentGroups\.map/);
  assert.match(animation, /const leadWords = words\.slice\(0, scrubStartIndex\)/);
  assert.match(animation, /const scrubWords = words\.slice\(scrubStartIndex\)/);
  assert.match(animation, /const scrollStartWord = scrubWords\[0\] \|\| section/);
  assert.match(animation, /gsap\.set\(leadWords, \{ color: complete \}\)/);
  assert.match(animation, /scrubWords\.forEach/);
  assert.match(animation, /words\.slice\(accentWordIndex\)/);
  assert.match(animation, /controller\.anchorIndex - scrubStartIndex \+ 1/);
  assert.match(animation, /Math\.max\(0\.001, revealAt \/ timeline\.duration\(\)\)/);
  assert.match(animation, /applyTailOffsets/);
  assert.match(animation, /offsets\.set\(word, \(offsets\.get\(word\) \|\| 0\) - hiddenPush\)/);
  assert.match(animation, /controller\.accentWord\.offsetLeft - controller\.group\.offsetLeft/);
  assert.match(animation, /gsap\.timeline\(\{ paused: true \}\)/);
  assert.match(animation, /onUpdate:\s*\(\{ progress \}\) => syncAccents\(progress\)/);
  assert.match(animation, /controller\.motion\.play\(\)/);
  assert.match(animation, /controller\.motion\.reverse\(\)/);
  assert.match(animation, /refreshAccentGeometry/);
  assert.match(animation, /scale:\s*1, rotation:\s*0, duration:\s*0\.92, ease:\s*'sine\.inOut'/);
  assert.match(animation, /autoAlpha:\s*1, duration:\s*0\.48, ease:\s*'sine\.out'[\s\S]*?0\.38\)/);
  assert.match(animation, /layoutProgress:\s*1, duration:\s*0\.56, ease:\s*'sine\.inOut'/);
  assert.match(main, /initKineticStatements/);
  assert.match(layout, /page-surface[^"\n]*overflow-x-clip/);
  assert.doesNotMatch(layout, /page-surface[^"\n]*overflow-hidden/);
  assert.match(interactions, /\.kinetic-statement__layout/);
  assert.match(interactions, /\.kinetic-statement__accent-group\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(interactions, /\.kinetic-statement__word\s*\{[^}]*display:\s*inline-block/s);
  assert.match(interactions, /\.kinetic-statement__accent\s*\{[^}]*inline-size:[^}]*opacity:\s*0/s);
  assert.doesNotMatch(interactions, /\.kinetic-statement__accent\s*\{[^}]*margin-inline-end/s);
  assert.match(interactions, /\.kinetic-statement__accent\s*\{[^}]*inline-size:\s*0\.84em/s);
  assert.match(interactions, /\.kinetic-statement__accent-symbol\s*\{[^}]*overflow:\s*visible/s);
  assert.doesNotMatch(interactions, /\.kinetic-statement__[^{]+\{[^}]*position:\s*sticky/);
});

test('focused interface files remain maintainable', () => {
  const files = [
    'src/styles/global.css',
    'src/styles/space.css',
    'src/components/studio/KineticCanvas.astro',
    'src/components/studio/ArrowRightIcon.astro',
    'src/components/studio/StudioStatement.astro',
    'src/components/studio/ProcessStatement.astro',
    'src/components/studio/ServicePerforations.astro',
    'src/components/studio/KineticStatement.astro',
    'src/components/studio/KineticStatementIcon.astro',
    'src/scripts/features/kinetic-canvas.js',
    'src/scripts/animations/kinetic-statements.js',
    'src/scripts/animations/studio-services-transition.js',
    'src/scripts/animations/service-perforations.js',
    'src/components/work/ProjectGrid.astro',
    'src/pages/index.astro',
  ];

  for (const file of files) {
    assert.ok(read(file).split('\n').length < 400, `${file} must stay below 400 lines`);
  }
});
