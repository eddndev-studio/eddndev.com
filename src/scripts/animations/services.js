import { gsap } from '../core/gsap-core';
import { prefersReduced } from '../core/dom';
import { maskReveal } from './reveals';

/**
 * /services choreography — the deck. Each service is a full screen that
 * slides over the previous one (CSS sticky stack); the covered panel
 * recedes and dims like a card being buried. Panel titles get maskReveal
 * via .reveal-text (reveals.js) and readouts scramble via home.js.
 */
export default function initServices() {
  const hero = document.querySelector('[data-services-hero]');
  const deck = document.querySelector('[data-services-deck]');
  if (!hero && !deck) return;
  const reduced = prefersReduced();

  // ── 1 · HERO power-on: matrix, rule, masked title, intro, index strip ──
  if (hero) {
    const matrix = hero.querySelector('#ledding-services-container');
    const rule = hero.querySelector('[data-services-rule]');
    const title = hero.querySelector('[data-services-title]');
    const intro = hero.querySelector('[data-services-intro]');
    const indexItems = hero.querySelectorAll('[data-index-item]');

    const tl = gsap.timeline({ defaults: { ease: 'panel' } });
    if (matrix) tl.fromTo(matrix, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 0.4, scale: 1, duration: 1.4, ease: 'power2.out' }, 0);
    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.15);
    if (title) maskReveal(title, { trigger: null, delay: 0.35, stagger: 0.1 });
    if (intro) {
      tl.fromTo(
        intro,
        { y: 24, autoAlpha: 0, filter: 'blur(6px)' },
        { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.9 },
        0.9
      );
    }
    if (indexItems.length) tl.fromTo(indexItems, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.07 }, 1.05);

    if (matrix && !reduced) {
      gsap.to(matrix, { scale: 1.012, duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.8 });
    }
  }

  // ── 2 · THE DECK ──
  if (deck) {
    const panels = gsap.utils.toArray('[data-service-panel]', deck);
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    panels.forEach((panel, i) => {
      const rule = panel.querySelector('[data-panel-rule]');
      const tagline = panel.querySelector('[data-panel-tagline]');
      const desc = panel.querySelector('[data-panel-desc]');
      const items = panel.querySelectorAll('[data-panel-highlight]');
      const cta = panel.querySelector('[data-panel-cta]');
      const ghost = panel.querySelector('[data-panel-ghost]');

      // Content power-on as the panel rises into view
      const tl = gsap.timeline({
        scrollTrigger: { trigger: panel, start: 'top 70%', once: true },
        defaults: { ease: 'panel' },
      });
      if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0);
      if (tagline) tl.fromTo(tagline, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.85 }, 0.4);
      if (desc) tl.fromTo(desc, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 }, 0.5);
      if (items.length) tl.fromTo(items, { x: 28, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, 0.55);
      if (cta) tl.fromTo(cta, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, 0.9);
      if (ghost) tl.fromTo(ghost, { x: 80, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1.2 }, 0.3);

      // Ghost numeral drifts while the panel approaches its stick point
      if (ghost && !reduced) {
        gsap.fromTo(ghost, { yPercent: 10 }, {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: { trigger: panel, start: 'top bottom', end: 'top top', scrub: 1 },
        });
      }

      // Deck recede: as this panel rises to cover, the previous one is buried.
      // The buried panel DIMS via its own black overlay — never via opacity,
      // which would let the panels underneath bleed through.
      if (i > 0 && isDesktop && !reduced) {
        const prev = panels[i - 1];
        const dimmer = prev.querySelector('[data-panel-dimmer]');
        const st = { trigger: panel, start: 'top bottom', end: 'top top', scrub: true };
        gsap.fromTo(prev, { scale: 1 }, { scale: 0.94, transformOrigin: '50% 40%', ease: 'none', scrollTrigger: st });
        if (dimmer) gsap.fromTo(dimmer, { opacity: 0 }, { opacity: 0.7, ease: 'none', scrollTrigger: { ...st } });
      }
    });
  }
}
