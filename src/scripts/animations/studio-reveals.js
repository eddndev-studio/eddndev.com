import { gsap, ScrollTrigger } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

/**
 * Studio FadeIn reveal grammar, faithful to framer-motion's <FadeIn>:
 *   hidden { opacity: 0, y: 24 } → visible { opacity: 1, y: 0 }
 *   duration 0.5s, ease cubic-bezier(0.25,0.1,0.35,1), viewport once at margin -200px.
 * A <FadeInStagger> sequences its child FadeIns (stagger 0.2, or 0.12 "faster").
 */
const START = 'top bottom-=200';

export default function initStudioReveals() {
  const all = gsap.utils.toArray('[data-fade-in]');
  if (!all.length) return;

  // Reduced motion: everything is already visible via CSS — leave it.
  if (prefersReduced()) {
    gsap.set(all, { clearProps: 'opacity,transform' });
    return;
  }

  const claimed = new Set();

  // Stagger groups — children sequence when the group scrolls in.
  gsap.utils.toArray('[data-fade-in-stagger]').forEach((group) => {
    const faster = group.getAttribute('data-fade-in-stagger') === 'faster';
    const items = gsap.utils.toArray('[data-fade-in]', group);
    if (!items.length) return;
    items.forEach((el) => claimed.add(el));
    gsap.fromTo(
      items,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'framerFade',
        stagger: faster ? 0.12 : 0.2,
        scrollTrigger: { trigger: group, start: START, once: true },
      }
    );
  });

  // Standalone FadeIns — each triggers itself.
  const standalone = all.filter((el) => !claimed.has(el) && !el.closest('[data-fade-in-stagger]'));
  if (standalone.length) {
    ScrollTrigger.batch(standalone, {
      start: START,
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.5, ease: 'framerFade', stagger: 0.08, overwrite: true }),
    });
  }

  // Never leave anything stuck hidden across a page swap.
  onPageCleanup(() => gsap.set(all, { clearProps: 'opacity,transform' }));
}
