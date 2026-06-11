import { gsap } from '../core/gsap-core';
import { prefersReduced } from '../core/dom';

/**
 * /services page extras. Hero entrance, SVG stroke draws and .reveal-text
 * are handled generically in animations/reveals.js.
 */
export default function initServices() {
  if (!document.querySelector('[data-services-hero]')) return;
  const reduced = prefersReduced();

  // ── Floating SVGs (scroll parallax + idle drift) ──
  gsap.utils.toArray('[data-service-float]').forEach((el) => {
    const speed = parseFloat(el.dataset.speed) || 1;
    if (!reduced) {
      gsap.to(el, {
        y: () => -80 * speed,
        rotation: () => 15 * speed,
        scrollTrigger: {
          trigger: el.closest('section') || el.closest('div'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      });
      gsap.to(el, {
        y: `+=${6 * speed}`,
        x: `+=${3 * speed}`,
        duration: 3 + speed * 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: Math.random() * 2,
      });
    }
  });

  // ── Gradient Orbs (slow scroll drift) ──
  if (!reduced) {
    gsap.utils.toArray('[data-service-orb]').forEach((orb, i) => {
      gsap.to(orb, {
        y: () => (i % 2 === 0 ? -120 : 80),
        x: () => (i % 2 === 0 ? 40 : -60),
        scrollTrigger: {
          trigger: orb.closest('section') || orb.closest('div'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        },
      });
    });
  }

  // ── Highlights staggered reveal ──
  gsap.utils.toArray('[data-service-highlight]').forEach((item, i) => {
    const section = item.closest('section');
    gsap.fromTo(
      item,
      { x: -20, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        duration: 0.5,
        delay: (i % 4) * 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: section || item, start: 'top 70%', once: true },
      }
    );
  });
}
