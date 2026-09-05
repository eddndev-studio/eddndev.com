import { gsap, ScrollTrigger } from './gsap-core';
import { lenis } from './lenis';
import { createLayoutCoordinator, isCriticalResize } from './layout-coordinator.js';
import { captureScrollPosition, resolveScrollPosition } from './scroll-position.js';

let featureContext = null;
let motionContext = null;
const featureCleanups = [];
const motionCleanups = [];
let cleanups = featureCleanups;
let refreshPage = () => {};

/** Cleanups belong to the context that initialized them. Forms survive resizes. */
export function onPageCleanup(fn) { cleanups.push(fn); }
export function requestLayoutRefresh() { refreshPage(); }

function drain(bucket) {
  while (bucket.length) {
    try { bucket.pop()(); } catch (error) { console.error('[cleanup]', error); }
  }
}

function destroyMotion() {
  drain(motionCleanups);
  motionContext?.revert();
  motionContext = null;
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
}

function mount(initializers, bucket) {
  cleanups = bucket;
  const context = gsap.context(() => initializers.forEach(init => init()));
  cleanups = featureCleanups;
  return context;
}

// Two rendered frames let ResizeObserver, native sticky geometry and queued pins settle.
const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
async function waitForAssets() {
  const images = [...document.images].filter(image => image.loading !== 'lazy' && !image.complete);
  let timeout;
  await Promise.race([
    Promise.all([document.fonts.ready, ...images.map(image => image.decode().catch(() => {}))]),
    new Promise(resolve => { timeout = setTimeout(resolve, 3000); }),
  ]);
  clearTimeout(timeout);
  await frame();
}

/** Measure from a neutral scroll position, then restore only the completed layout. */
export function startLifecycle({ features, animations }) {
  let armed = true;
  let active = false;
  let busy = false;
  let firstPage = true;
  let navigationType = 'push';
  let timer = 0;
  let pending = null;
  let reading = { y: window.scrollY };
  const size = () => ({ width: window.innerWidth, height: window.innerHeight });
  let viewport = size();
  let inertElements = [];
  let focusedElement = null;
  const boot = window.__pageLayout;

  const show = ({ position, reason } = {}) => {
    busy = true;
    if (boot && position) boot.position = position;
    document.documentElement.setAttribute('data-layout-loading', '');
    document.querySelector('main')?.setAttribute('aria-busy', 'true');
    const label = document.querySelector('[data-page-loader-label]');
    if (label) label.textContent = reason === 'resize' ? 'Ajustando la página' : 'Preparando la página';
    if (!inertElements.length) {
      focusedElement = document.activeElement;
      inertElements = [...document.body.children]
        .filter(element => !element.matches('[data-page-loader], script, astro-route-announcer'))
        .map(element => [element, element.inert]);
      inertElements.forEach(([element]) => { element.inert = true; });
    }
    lenis.stop();
    if (boot) {
      clearTimeout(boot.watchdog);
      boot.watchdog = setTimeout(() => boot.release(), 8000);
    }
  };
  const reveal = () => {
    document.documentElement.removeAttribute('data-layout-loading');
    document.querySelector('main')?.removeAttribute('aria-busy');
    inertElements.forEach(([element, inert]) => { element.inert = inert; });
    inertElements = [];
    if (focusedElement?.isConnected && document.activeElement !== focusedElement) focusedElement.focus({ preventScroll: true });
    focusedElement = null;
    if (!document.documentElement.classList.contains('nav-open')) lenis.start();
    busy = false;
    pending = null;
    viewport = size();
    reading = captureScrollPosition();
    if (boot) { clearTimeout(boot.watchdog); boot.position = reading; }
  };

  const scrollTo = y => lenis.scrollTo(Math.max(0, y || 0), { immediate: true, force: true });
  const coordinator = createLayoutCoordinator({
    show,
    ready: waitForAssets,
    rebuild() {
      destroyMotion();
      scrollTo(0);
      if (!featureContext) featureContext = mount(features, featureCleanups);
      motionContext = mount(animations, motionCleanups);
    },
    frame,
    measure() {
      scrollTo(0);
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      lenis.resize();
    },
    restore({ position }) {
      scrollTo(resolveScrollPosition(position));
      ScrollTrigger.update(true);
      // A restored page must show the current frame without a scrub catch-up tween.
      ScrollTrigger.getAll().forEach(trigger => trigger.getTween()?.progress?.(1));
      window.dispatchEvent(new Event('scroll'));
    },
    reveal,
    fail(error, { position }) {
      console.error('[page layout]', error);
      destroyMotion();
      lenis.resize();
      scrollTo(position.y);
    },
  });
  if (boot) boot.release = () => { coordinator.cancel(); reveal(); };

  function schedule(reason = 'resize') {
    if (!active) return;
    pending ||= reading;
    clearTimeout(timer);
    if (document.documentElement.classList.contains('nav-open')) return;
    coordinator.cancel();
    show({ position: pending, reason });
    timer = setTimeout(() => coordinator.run({ position: pending, reason }), 140);
  }
  refreshPage = () => { if (!busy) schedule('layout'); };

  document.addEventListener('astro:before-preparation', event => { navigationType = event.navigationType; });
  document.addEventListener('astro:before-swap', event => {
    coordinator.cancel();
    clearTimeout(timer);
    active = false;
    destroyMotion();
    drain(featureCleanups);
    featureContext?.revert();
    featureContext = null;
    inertElements = [];
    focusedElement = null;
    pending = null;
    armed = true;
    event.newDocument.documentElement.setAttribute('data-layout-loading', '');
  });
  document.addEventListener('astro:page-load', () => {
    if (!armed) return;
    armed = false;
    active = true;
    const restore = firstPage ? boot?.restoring : navigationType === 'traverse';
    const y = firstPage && boot ? boot.position.y : window.scrollY;
    reading = { y: restore ? y : 0, hash: restore ? '' : location.hash };
    firstPage = false;
    pending = reading;
    coordinator.run({ position: reading, reason: 'page' });
  });

  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (busy || scrollFrame || document.documentElement.classList.contains('nav-open')) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (!busy) reading = captureScrollPosition();
    });
  }, { passive: true });
  window.addEventListener('resize', () => {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const typing = coarse && document.activeElement?.matches('input, textarea, [contenteditable="true"]');
    if (isCriticalResize(viewport, size(), typing, coarse)) schedule();
  }, { passive: true });
  // Body locking by the menu is temporary; measure once it has been released.
  new MutationObserver(() => {
    if (pending && !busy && !document.documentElement.classList.contains('nav-open')) schedule();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  for (const query of ['(prefers-reduced-motion: reduce)', '(forced-colors: active)']) {
    matchMedia(query).addEventListener('change', () => schedule('layout'));
  }
  document.fonts.addEventListener('loadingdone', () => refreshPage());
  window.addEventListener('pageshow', event => { if (event.persisted) schedule('layout'); });
}
