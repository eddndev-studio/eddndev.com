import { gsap } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

export default function initStudioServicesTransition() {
  const section = document.querySelector('[data-kinetic-pin-target]');
  if (!section || prefersReduced()) return;

  const target = document.querySelector(section.dataset.kineticPinTarget);
  const track = section.querySelector('.kinetic-statement__track');
  if (!target || !track) return;

  const media = gsap.matchMedia();
  media.add('(min-height: 640px)', () => {
    gsap.fromTo(
      track,
      { yPercent: 0, scale: 1, autoAlpha: 1 },
      {
        yPercent: () => (window.matchMedia('(max-width: 639px)').matches ? -6 : -10),
        scale: () => (window.matchMedia('(max-width: 639px)').matches ? 0.985 : 0.96),
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          endTrigger: target,
          end: 'top top',
          scrub: 0.55,
          pin: section,
          pinSpacing: false,
          refreshPriority: 1,
          invalidateOnRefresh: true,
        },
      },
    );
  });

  onPageCleanup(() => media.revert());
}
