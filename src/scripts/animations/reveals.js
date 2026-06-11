import { gsap, ScrollTrigger, SplitText } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

/**
 * Sitewide reveal grammar — every element "ignites" like the LED matrix:
 * display headings rise out of masked line slots, supporting copy fades up,
 * hairlines draw themselves, SVG strokes trace with scroll.
 */

const DISPLAY = 'h1, h2, h3';

export function maskReveal(el, { trigger = el, start = 'top 88%', delay = 0, stagger = 0.09 } = {}) {
  const split = SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    onSplit(self) {
      return gsap.fromTo(
        self.lines,
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: 1.1,
          delay,
          stagger,
          ease: 'panel',
          scrollTrigger: trigger ? { trigger, start, once: true } : undefined,
        }
      );
    },
  });
  onPageCleanup(() => split.revert());
  return split;
}

/**
 * Generic hero power-on for subpages (the home hero choreographs its own).
 * Anatomy shared by /services, /profile, /work, /automation:
 * #hero > … > header > [eyebrow, h1, meta grid] + a ledding matrix behind.
 */
function initPageHero(hero) {
  if (!hero || hero.querySelector('[data-hero-entrance]')) return;

  const matrix = hero.querySelector('[id^="ledding-"]');
  const header = hero.querySelector('header');

  const tl = gsap.timeline({ defaults: { ease: 'panel' } });
  if (matrix) {
    tl.fromTo(matrix, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0);
    if (!prefersReduced()) {
      gsap.to(matrix, {
        scale: 1.015,
        rotate: 0.25,
        transformOrigin: '50% 50%',
        duration: 7,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 1.6,
      });
    }
  }

  if (header) {
    let slot = 0;
    [...header.children].forEach((child) => {
      const h1 = child.matches('h1') ? child : child.querySelector?.('h1');
      if (h1) {
        maskReveal(h1, { trigger: null, delay: 0.3, stagger: 0.1 });
        if (child !== h1) {
          const siblings = [...child.children].filter((c) => c !== h1);
          if (siblings.length) tl.fromTo(siblings, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08 }, 0.75);
        }
        slot = 0.75;
        return;
      }
      const at = slot === 0 ? 0.12 : slot + 0.1;
      tl.fromTo(
        child,
        { y: 18, autoAlpha: 0, filter: 'blur(6px)' },
        { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.85 },
        at
      );
      slot = at;
    });
  }
}

export default function initReveals() {
  const reduced = prefersReduced();

  // ── 0. Subpage hero entrance ──
  initPageHero(document.querySelector('#hero'));

  // ── 1. Hero exit: pins and dims as the next section slides over ──
  const hero = document.querySelector('#hero');
  if (hero && !reduced) {
    gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'bottom bottom',
        end: '+=65%',
        scrub: true,
        pin: true,
        pinSpacing: false,
        anticipatePin: 0,
      },
    }).to(hero, { yPercent: -20, autoAlpha: 0, ease: 'none' }, 0);
  }

  // ── 2. Hero vignette breathes in ──
  const vignette = document.getElementById('hero-vignette');
  if (vignette) {
    gsap.fromTo(vignette, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.2 });
  }

  // ── 3. Text reveals: masked line-rise for display type, fade-up for copy ──
  const seen = new Set();
  document.querySelectorAll('.reveal-text').forEach((el) => {
    if (el.closest('[data-hero-entrance]')) return; // hero choreographs its own
    if (el.matches(DISPLAY)) {
      maskReveal(el);
      seen.add(el);
    }
  });

  const fades = [...document.querySelectorAll('.reveal-text, [data-panel-reveal]')].filter(
    (el) => !seen.has(el) && !el.closest('[data-hero-entrance]')
  );
  if (fades.length) {
    gsap.set(fades, { y: 28, autoAlpha: 0 });
    ScrollTrigger.batch(fades, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: 'panel', overwrite: true }),
    });
    // Safety net: anything still hidden when scrolling ends becomes visible
    onPageCleanup(() => gsap.set(fades, { clearProps: 'all' }));
  }

  // ── 4. Vertical hairlines draw down ──
  gsap.utils.toArray('[data-line-vertical]').forEach((line) => {
    gsap.fromTo(
      line,
      { scaleY: 0 },
      {
        scaleY: 1,
        duration: 1.5,
        ease: 'power3.out',
        scrollTrigger: { trigger: line.closest('section') || line, start: 'top 85%', once: true },
      }
    );
  });

  // ── 5. Decorative SVG strokes trace with scroll ──
  document.querySelectorAll('[data-index-draw], [data-service-draw], [data-profile-draw], [data-automation-draw]').forEach((svg) => {
    const paths = svg.querySelectorAll('.draw-path');
    if (!paths.length) return;
    const trigger = svg.closest('section') || svg.closest('#hero') || svg.closest('div');

    paths.forEach((path, i) => {
      let len;
      try { len = path.getTotalLength(); } catch { return; }
      if (reduced) {
        gsap.set(path, { strokeDasharray: 'none', strokeDashoffset: 0 });
        return;
      }
      gsap.fromTo(
        path,
        { strokeDasharray: len, strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger, start: 'top 95%', end: 'center 70%', scrub: 0.6 + i * 0.15 },
        }
      );
    });
  });

  // ── 6. Footer: LET'S BUILD ignition + staggered meta ──
  const footer = document.querySelector('#site-footer');
  if (footer) {
    const reveals = footer.querySelectorAll('.reveal-footer');
    if (reveals.length) {
      gsap.fromTo(
        reveals,
        { y: 40, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          stagger: 0.06,
          ease: 'panel',
          scrollTrigger: { trigger: footer, start: 'top 75%', once: true },
        }
      );
    }
  }
}
