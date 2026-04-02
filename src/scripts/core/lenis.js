import { ScrollTrigger } from './gsap-core';
import Lenis from 'lenis';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const lenis = new Lenis({
  lerp: prefersReducedMotion ? 1 : 0.12,
  smoothWheel: !prefersReducedMotion,
  smoothTouch: false,
});

function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);

export { lenis };
