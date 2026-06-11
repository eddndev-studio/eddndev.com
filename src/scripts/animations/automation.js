import { gsap } from '../core/gsap-core';
import { prefersReduced } from '../core/dom';

/**
 * /automation page extras. Hero entrance, SVG stroke draws and .reveal-text
 * are handled generically in animations/reveals.js.
 */
export default function initAutomation() {
  if (!document.querySelector('[data-automation-hero]')) return;
  const reduced = prefersReduced();

  // ── Floating SVGs (scroll parallax + idle drift) ──
  gsap.utils.toArray('[data-automation-float]').forEach((el) => {
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
    gsap.utils.toArray('[data-automation-orb]').forEach((orb, i) => {
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

  // ── Process steps (opacity reveal) ──
  gsap.utils.toArray('[data-automation-step]').forEach((step, i) => {
    gsap.fromTo(
      step,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.4,
        delay: i * 0.03,
        ease: 'power2.out',
        scrollTrigger: { trigger: step, start: 'top 88%', once: true },
      }
    );
  });

  // ── Cards (opacity reveal on scroll) ──
  gsap.utils.toArray('[data-automation-card]').forEach((card, i) => {
    gsap.fromTo(
      card,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.4,
        delay: i * 0.04,
        ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 92%', once: true },
      }
    );
  });
}
