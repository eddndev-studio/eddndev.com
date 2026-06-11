import { gsap, ScrollTrigger } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';
import { lenis } from '../core/lenis';
import { maskReveal } from './reveals';

/**
 * Home choreography. One idea, executed everywhere:
 * the whole page behaves like the LED matrix in the hero —
 * type ignites in cascades, the ticker is a live signal that feeds on
 * scroll velocity, cards power on like screens, stats flip like LED boards.
 */

const SCRAMBLE_CHARS = '█▓▒░01·';

export default function initHome() {
  const reduced = prefersReduced();
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // ════════════════════════════════════════════════════════
  // 1 · HERO — power-on sequence
  // ════════════════════════════════════════════════════════
  const hero = document.querySelector('[data-hero-entrance]');
  if (hero) {
    const eyebrow = hero.querySelectorAll('[data-hero-eyebrow] > *');
    const title = hero.querySelector('[data-hero-title]');
    const intro = hero.querySelector('[data-hero-intro]');
    const rule = hero.querySelector('[data-hero-rule]');
    const ctas = hero.querySelectorAll('[data-hero-cta]');
    const matrix = document.querySelector('#ledding-animation-container');

    const tl = gsap.timeline({ defaults: { ease: 'panel' } });

    if (matrix) {
      tl.fromTo(matrix, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0);
    }
    if (eyebrow.length) {
      tl.fromTo(
        eyebrow,
        { y: 14, autoAlpha: 0, filter: 'blur(6px)' },
        { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.09 },
        0.15
      );
    }
    if (title) {
      maskReveal(title, { trigger: null, delay: 0.35, stagger: 0.11 });
    }
    if (rule) {
      tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power3.inOut', transformOrigin: 'left center' }, 0.7);
    }
    if (intro) {
      tl.fromTo(intro, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 }, 0.85);
    }
    if (ctas.length) {
      tl.fromTo(ctas, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08 }, 0.95);
    }

    // Matrix breathes while idle + drifts slightly as you leave
    if (matrix && !reduced) {
      gsap.to(matrix, {
        scale: 1.01,
        rotate: 0.2,
        transformOrigin: '50% 50%',
        duration: 6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 1.5,
      });
    }
  }

  // ════════════════════════════════════════════════════════
  // 2 · TICKER — a signal that feeds on scroll velocity
  // ════════════════════════════════════════════════════════
  const tickerRows = gsap.utils.toArray('[data-marquee-row]');
  if (tickerRows.length && !reduced) {
    const loops = tickerRows.map((row) => {
      const dir = Number(row.dataset.marqueeDir || 1);
      const speed = Number(row.dataset.marqueeSpeed || 30);
      return gsap.fromTo(
        row,
        { xPercent: dir === 1 ? 0 : -33.3333 },
        { xPercent: dir === 1 ? -33.3333 : 0, duration: speed, ease: 'none', repeat: -1 }
      );
    });

    const skews = tickerRows.map((row) => gsap.quickTo(row, 'skewX', { duration: 0.5, ease: 'power2.out' }));
    let current = 1;

    const onTick = () => {
      const v = lenis?.velocity || 0;
      const target = gsap.utils.clamp(0.35, 8, 1 + Math.abs(v) * 0.12);
      current += (target - current) * 0.08;
      loops.forEach((loop) => loop.timeScale(current));
      const skew = gsap.utils.clamp(-8, 8, v * 0.28);
      skews.forEach((to, i) => to(i % 2 ? -skew : skew));
    };
    gsap.ticker.add(onTick);
    onPageCleanup(() => gsap.ticker.remove(onTick));
  }

  // ════════════════════════════════════════════════════════
  // 3 · Section readouts — [ 01 · PRUEBA ] flips in like an LED board
  // ════════════════════════════════════════════════════════
  document.querySelectorAll('[data-readout]').forEach((el) => {
    const text = el.textContent.trim();
    gsap.fromTo(
      el,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.01,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onComplete: () => {
          gsap.to(el, { duration: 1, scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.6 } });
        },
      }
    );
  });

  // ════════════════════════════════════════════════════════
  // 4 · MANIFESTO — rows ignite line by line, ghost numbers drift
  // ════════════════════════════════════════════════════════
  document.querySelectorAll('[data-manifesto-row]').forEach((row) => {
    const line = row.querySelector('[data-row-line]');
    const copy = row.querySelector('p');
    const ghost = row.querySelector('[data-ghost-num]');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: row, start: 'top 85%', once: true },
    });
    if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.inOut', transformOrigin: 'left center' }, 0);
    if (copy) tl.fromTo(copy, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'panel' }, 0.15);
    if (ghost) tl.fromTo(ghost, { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1.1, ease: 'panel' }, 0.1);

    if (ghost && !reduced) {
      gsap.to(ghost, {
        yPercent: -28,
        ease: 'none',
        scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    }
  });

  // ════════════════════════════════════════════════════════
  // 5 · WORK — cards power on like screens, covers parallax, stats flip
  // ════════════════════════════════════════════════════════
  document.querySelectorAll('[data-work-card]').forEach((card) => {
    const media = card.querySelector('[data-work-media]');
    const stat = card.querySelector('[data-work-stat]');
    const meta = card.querySelectorAll('[data-work-meta]');

    gsap.timeline({
      scrollTrigger: { trigger: card, start: 'top 82%', once: true },
      defaults: { ease: 'panel' },
    })
      .fromTo(card, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15 }, 0)
      .fromTo(media, { scale: 1.28 }, { scale: 1.06, duration: 1.5, ease: 'power2.out' }, 0)
      .fromTo(meta, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, 0.45)
      .add(() => {
        if (stat) {
          const text = stat.dataset.workStat || stat.textContent.trim();
          gsap.to(stat, { duration: 1.1, scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.5 } });
        }
      }, 0.5);

    // Persistent inner parallax after power-on
    if (media && !reduced) {
      gsap.fromTo(
        media,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
        }
      );
    }
  });

  // ════════════════════════════════════════════════════════
  // 6 · SERVICES — index rows assemble, arrows are magnetic
  // ════════════════════════════════════════════════════════
  const serviceRows = gsap.utils.toArray('[data-service-card]');
  serviceRows.forEach((row, i) => {
    const line = row.querySelector('[data-row-line]');
    const content = row.querySelectorAll('[data-row-reveal]');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: row, start: 'top 88%', once: true },
      defaults: { ease: 'panel' },
    });
    if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'power3.inOut', transformOrigin: 'left center' }, 0);
    if (content.length) tl.fromTo(content, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.85, stagger: 0.06 }, 0.12);
  });

  // ════════════════════════════════════════════════════════
  // 7 · Magnetic elements (CTAs + arrow chips) — pointer gravity
  // ════════════════════════════════════════════════════════
  if (finePointer && !reduced) {
    document.querySelectorAll('#main-content [data-magnetic]').forEach((el) => {
      const zone = el.closest('[data-magnetic-zone]') || el;
      const strength = Number(el.dataset.magnetic || 0.35);
      const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });

      zone.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const radius = zone === el ? 90 : 160;
        const dist = Math.hypot(dx, dy);
        const pull = dist < radius ? 1 - dist / radius : 0;
        xTo(dx * strength * pull * 1.6);
        yTo(dy * strength * pull * 1.6);
      });
      zone.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }
}
