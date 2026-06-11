import { gsap } from '../core/gsap-core';
import { prefersReduced } from '../core/dom';

/**
 * /profile page extras. Hero entrance, SVG stroke draws and .reveal-text
 * are handled generically in animations/reveals.js.
 */
export default function initProfile() {
  if (!document.querySelector('[data-profile-hero]')) return;
  const reduced = prefersReduced();

  // ── Floating SVGs (scroll parallax + idle drift) ──
  gsap.utils.toArray('[data-profile-float]').forEach((el) => {
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
    gsap.utils.toArray('[data-profile-orb]').forEach((orb, i) => {
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

  // ── Dashed line draw (scroll-driven) ──
  document.querySelectorAll('.profile-line-draw').forEach((line) => {
    const section = line.closest('section');
    if (!section) return;
    const len = section.offsetHeight;
    if (reduced) {
      gsap.set(line, { strokeDashoffset: 0 });
      return;
    }
    gsap.fromTo(
      line,
      { strokeDashoffset: len },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'center center', scrub: 0.6 },
      }
    );
  });

  // ── Orbital rotation (continuous + scroll boost) ──
  const orbital = document.querySelector('[data-profile-orbital]');
  if (orbital && !reduced) {
    gsap.to(orbital, {
      rotation: 360,
      duration: 40,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%',
    });
    gsap.to(orbital, {
      rotation: '+=180',
      scrollTrigger: {
        trigger: orbital.closest('section'),
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
    });
  }

  // ── Process steps (staggered scroll reveal) ──
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

  // ── Cards (scale reveal on scroll) ──
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
