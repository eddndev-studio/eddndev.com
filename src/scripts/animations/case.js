import { gsap, ScrollTrigger } from '../core/gsap-core';
import { prefersReduced } from '../core/dom';
import { maskReveal } from './reveals';

/**
 * Case study ("expediente") choreography — the home's LED grammar applied
 * to project detail pages: the hero powers on, spec values flip like LED
 * boards, figures ignite with a clip wipe, ghost numerals drift in the
 * margin and a project-colored rail tracks reading progress.
 *
 * Shared systems come free from other modules: [data-readout] scramble and
 * [data-magnetic] gravity are bound by animations/home.js, display headings
 * with .reveal-text get maskReveal from animations/reveals.js.
 */

const SCRAMBLE_CHARS = '█▓▒░01·';

export default function initCase() {
  const hero = document.querySelector('[data-case-hero]');
  const article = document.querySelector('[data-case-content]');
  if (!hero && !article) return;
  const reduced = prefersReduced();

  // ════════════════════════════════════════════════════════
  // 1 · HERO — dossier power-on
  // ════════════════════════════════════════════════════════
  if (hero) {
    const matrix = hero.querySelector('#ledding-project-container');
    const corners = hero.querySelectorAll('[data-case-corner]');
    const rule = hero.querySelector('[data-case-rule]');
    const title = hero.querySelector('[data-case-title]');
    const intro = hero.querySelector('[data-case-intro]');

    const tl = gsap.timeline({ defaults: { ease: 'panel' } });

    // The container carries opacity-40 by design — never brighten past it
    if (matrix) tl.fromTo(matrix, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 0.4, scale: 1, duration: 1.4, ease: 'power2.out' }, 0);
    if (corners.length) tl.fromTo(corners, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 0.5, duration: 0.9, stagger: 0.1 }, 0.2);
    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.15);
    if (title) maskReveal(title, { trigger: null, delay: 0.4, stagger: 0.1 });
    if (intro) {
      tl.fromTo(
        intro,
        { y: 26, autoAlpha: 0, filter: 'blur(6px)' },
        { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.95 },
        1.0
      );
    }
    // Matrix breathes while idle
    if (matrix && !reduced) {
      gsap.to(matrix, { scale: 1.012, duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.8 });
    }

    // Exit: content recedes and the matrix dims as you scroll into the article
    const inner = hero.querySelector('[data-case-heroinner]');
    if (!reduced) {
      const exit = gsap.timeline({
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: 0.8 },
      });
      if (inner) exit.to(inner, { yPercent: -12, autoAlpha: 0.25, ease: 'none' }, 0);
      if (matrix) exit.to(matrix, { autoAlpha: 0.1, scale: 1.04, ease: 'none' }, 0);
    }
  }

  // ════════════════════════════════════════════════════════
  // 2 · SPEC BAR — the LED board flips its values when reached
  // ════════════════════════════════════════════════════════
  const specs = document.querySelector('[data-case-specs]');
  if (specs) {
    const cells = specs.querySelectorAll('[data-spec-cell]');
    const values = specs.querySelectorAll('[data-spec-value]');
    const chips = specs.querySelectorAll('[data-spec-chip]');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: specs, start: 'top 92%', once: true },
      defaults: { ease: 'panel' },
    });
    if (cells.length) tl.fromTo(cells, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.09 }, 0);
    if (chips.length) tl.fromTo(chips, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05 }, 0.25);
    tl.add(() => {
      values.forEach((el) => {
        const text = el.textContent.trim();
        gsap.to(el, { duration: 1, scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.55 } });
      });
    }, 0.15);
  }

  // ════════════════════════════════════════════════════════
  // 3 · ACCESOS — link chips slide in
  // ════════════════════════════════════════════════════════
  const access = document.querySelector('[data-case-access]');
  if (access) {
    const accessChips = access.querySelectorAll('[data-access-chip]');
    if (accessChips.length) {
      gsap.fromTo(
        accessChips,
        { y: 16, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.06,
          ease: 'panel',
          scrollTrigger: { trigger: access, start: 'top 92%', once: true },
        }
      );
    }
  }

  // ════════════════════════════════════════════════════════
  // 4 · EXPEDIENTE — rail, hairlines, ghost numerals, stats
  // ════════════════════════════════════════════════════════
  if (article) {
    const rail = article.querySelector('[data-case-rail]');
    if (rail) {
      if (reduced) {
        gsap.set(rail, { scaleY: 1 });
      } else {
        gsap.fromTo(rail, { scaleY: 0 }, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: article, start: 'top 70%', end: 'bottom 75%', scrub: 0.8 },
        });
      }
    }

    article.querySelectorAll('[data-case-line]').forEach((line) => {
      gsap.fromTo(line, { scaleX: 0 }, {
        scaleX: 1,
        duration: 1.1,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: line.closest('[data-case-block]') || line, start: 'top 85%', once: true },
      });
    });

    article.querySelectorAll('[data-ghost-num]').forEach((ghost) => {
      const block = ghost.closest('[data-case-block]') || ghost;
      gsap.fromTo(ghost, { x: 48, autoAlpha: 0 }, {
        x: 0,
        autoAlpha: 1,
        duration: 1.1,
        ease: 'panel',
        scrollTrigger: { trigger: block, start: 'top 82%', once: true },
      });
      if (!reduced) {
        gsap.to(ghost, {
          yPercent: -30,
          ease: 'none',
          scrollTrigger: { trigger: block, start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
      }
    });

    article.querySelectorAll('[data-stats-grid]').forEach((grid) => {
      const statCells = grid.querySelectorAll('[data-case-stat]');
      const statValues = grid.querySelectorAll('[data-stat-value]');
      const tl = gsap.timeline({
        scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
        defaults: { ease: 'panel' },
      });
      if (statCells.length) {
        tl.fromTo(statCells, { y: 24, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.08 }, 0);
      }
      tl.add(() => {
        statValues.forEach((el) => {
          const text = el.textContent.trim();
          gsap.to(el, { duration: 1.1, scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.5 } });
        });
      }, 0.35);
    });
  }

  // ════════════════════════════════════════════════════════
  // 5 · FIGURES — screens power on with a clip wipe (article + next case)
  // ════════════════════════════════════════════════════════
  document.querySelectorAll('[data-case-media]').forEach((fig) => {
    const frame = fig.querySelector('[data-media-frame]');
    const inner = fig.querySelector('[data-media-inner]');
    const caption = fig.querySelector('[data-media-caption]');
    if (!frame) return;

    const tl = gsap.timeline({
      scrollTrigger: { trigger: fig, start: 'top 80%', once: true },
      defaults: { ease: 'panel' },
    });
    tl.fromTo(frame, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15 }, 0);
    if (inner) tl.fromTo(inner, { scale: 1.22 }, { scale: 1.08, duration: 1.5, ease: 'power2.out' }, 0);
    if (caption) tl.fromTo(caption, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.4);

    // Persistent inner parallax after power-on (scale 1.08 covers the travel)
    if (inner && !reduced) {
      gsap.fromTo(inner, { yPercent: -3.5 }, {
        yPercent: 3.5,
        ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    }
  });
}
