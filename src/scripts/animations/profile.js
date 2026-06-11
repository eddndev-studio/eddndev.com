import { gsap } from '../core/gsap-core';

/**
 * /profile page extras. Hero entrance, .reveal-text and the portrait's
 * clip-wipe ([data-case-media]) are handled by the shared systems —
 * only the value cards and process steps are unique to this page.
 */
export default function initProfile() {
  if (!document.querySelector('[data-profile-hero]')) return;

  // ── Process steps: numerals slide in ──
  gsap.utils.toArray('[data-profile-step]').forEach((step, i) => {
    const num = step.querySelector('span');
    if (!num) return;
    gsap.fromTo(
      num,
      { x: -20, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        duration: 0.6,
        delay: i * 0.05,
        scrollTrigger: { trigger: step, start: 'top 85%', once: true },
      }
    );
  });

  // ── Value cards: power on ──
  gsap.utils.toArray('[data-profile-card]').forEach((card, i) => {
    gsap.fromTo(
      card,
      { scale: 0.95, y: 30, autoAlpha: 0 },
      {
        scale: 1,
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        delay: i * 0.08,
        ease: 'panel',
        scrollTrigger: { trigger: card, start: 'top 90%', once: true },
      }
    );
  });
}
