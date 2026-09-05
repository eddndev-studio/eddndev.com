import { gsap } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { lenis } from '../core/lenis';
import { prefersReduced } from '../core/dom';
import { mountWorkIndex } from './work-index.js';
import { mountWorkMotion } from '../animations/work-motion.js';

export default function initWorkShowcase() {
  const root = document.querySelector('[data-work-showcase]');
  if (!root) return;
  onPageCleanup(mountWorkIndex(root, IntersectionObserver, scene => {
    lenis.scrollTo(scene, {
      offset: -(parseFloat(getComputedStyle(scene).scrollMarginTop) || 0),
      duration: 1.1,
      immediate: prefersReduced(),
      onComplete: () => {
        if (scene.isConnected) scene.querySelector('h3 a')?.focus({ preventScroll: true });
      },
    });
  }));
  onPageCleanup(mountWorkMotion(root, gsap));
}
