import { gsap, ScrollTrigger } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

/**
 * Studio FadeIn reveal grammar:
 *   a short vertical settle with no opacity, rotation, or scale treatment.
 *   Duration 0.68s, ease cubic-bezier(0.16,1,0.3,1), once at margin -160px.
 * A <FadeInStagger> sequences its child FadeIns (stagger 0.2, or 0.12 "faster").
 * Opacity stays untouched so an interrupted trigger cannot hide content.
 */
const START = 'top bottom-=160';

export default function initStudioReveals() {
  const all = gsap.utils.toArray('[data-fade-in]');
  if (!all.length) return;

  // Reduced motion: everything is already visible via CSS.
  if (prefersReduced()) {
    gsap.set(all, { clearProps: 'transform' });
    return;
  }

  const claimed = new Set();

  // Stagger groups - children sequence when the group scrolls in.
  gsap.utils.toArray('[data-fade-in-stagger]').forEach((group) => {
    const faster = group.getAttribute('data-fade-in-stagger') === 'faster';
    const items = gsap.utils.toArray('[data-fade-in]', group);
    if (!items.length) return;
    items.forEach((el) => claimed.add(el));
    gsap.fromTo(
      items,
      { y: 22 },
      {
        y: 0,
        duration: 0.68,
        ease: 'organicFade',
        stagger: faster ? 0.09 : 0.14,
        scrollTrigger: { trigger: group, start: START, once: true },
      }
    );
  });

  // Standalone FadeIns - each triggers itself.
  const standalone = all.filter((el) => !claimed.has(el) && !el.closest('[data-fade-in-stagger]'));
  if (standalone.length) {
    gsap.set(standalone, { y: 22 });
    ScrollTrigger.batch(standalone, {
      start: START,
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { y: 0, duration: 0.68, ease: 'organicFade', stagger: 0.08, overwrite: true }),
    });
  }

  // Never leave anything stuck hidden across a page swap.
  onPageCleanup(() => gsap.set(all, { clearProps: 'transform' }));
}
