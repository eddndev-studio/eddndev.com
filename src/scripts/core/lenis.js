import { ScrollTrigger } from './gsap-core';
import Lenis from 'lenis';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let wasTextareaScroll = false;

function routeTextareaScroll({ deltaY, event }) {
  if (event.type !== 'wheel' || event.ctrlKey || lenis.isStopped || lenis.isLocked) return true;

  const textarea = event.composedPath().find((node) => node instanceof HTMLTextAreaElement);
  const canScroll = Boolean(textarea && (deltaY > 0
    ? textarea.scrollTop < textarea.scrollHeight - textarea.clientHeight - 1
    : deltaY < 0 && textarea.scrollTop > 0));

  // Stop page inertia before native field scrolling; resume from the real position.
  if (canScroll || wasTextareaScroll) lenis.reset();
  wasTextareaScroll = canScroll;
  return !canScroll;
}

const lenis = new Lenis({
  lerp: prefersReducedMotion ? 1 : 0.12,
  smoothWheel: !prefersReducedMotion,
  smoothTouch: false,
  virtualScroll: routeTextareaScroll,
});

function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
// Astro swaps page content while this scroller persists across routes.
ScrollTrigger.addEventListener('refresh', () => lenis.resize());

export { lenis };
