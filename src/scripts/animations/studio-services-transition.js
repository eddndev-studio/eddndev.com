import { gsap, ScrollTrigger } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';
import { createStudioExit } from './studio-transition-motion.js';

export default function initStudioServicesTransition() {
  const section = document.querySelector('[data-kinetic-pin-target]');
  if (!section || prefersReduced()) return;

  const target = document.querySelector(section.dataset.kineticPinTarget);
  const track = section.querySelector('.kinetic-statement__track');
  if (!target || !track) return;

  const media = gsap.matchMedia();
  media.add('(min-height: 640px)', () => {
    const animation = createStudioExit(gsap, track, () => window.matchMedia('(max-width: 639px)').matches);
    ScrollTrigger.create({
      id: 'studio-pin',
      animation,
      trigger: section,
      start: 'top top',
      endTrigger: target,
      end: 'top top',
      scrub: 0.55,
      pin: section,
      pinSpacing: false,
      refreshPriority: 1,
      invalidateOnRefresh: true,
    });
  });

  onPageCleanup(() => media.revert());
}
