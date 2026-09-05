import { gsap, ScrollTrigger } from '../core/gsap-core';
import { lenis } from '../core/lenis';
import { onPageCleanup } from '../core/lifecycle';
import { mountServiceSignal } from '../features/service-signal.js';
import { createHeroTimeline, getHeroScrollConfig } from './services-hero-motion.js';

function animateHero(root) {
  const hero = root.querySelector('[data-services-hero]');
  const tiles = hero.querySelectorAll('[data-assembly-tile]');
  const assembly = hero.querySelector('[data-assembly]');
  const animation = createHeroTimeline(gsap, {
    tiles, assembly, asterisk: hero.querySelector('.services-hero__asterisk'),
  });
  ScrollTrigger.create({
    ...getHeroScrollConfig(hero, () => window.innerHeight),
    animation,
  });
}

function animateChapter(chapter, index, desktop) {
  const parts = chapter.querySelectorAll('[data-drawing-part]');
  const trace = chapter.querySelectorAll('[data-drawing-trace] path, path[data-drawing-trace]');
  const visual = chapter.querySelector('[data-chapter-visual]');
  const title = chapter.querySelector('[data-chapter-title]');
  const timeline = gsap.timeline({ scrollTrigger: {
    trigger: chapter, start: 'top 80%', end: 'bottom 75%', scrub: .7,
  }});
  timeline.from(title, { y: desktop ? 80 : 28, duration: .7 }, 0)
    .from(visual.querySelector('.service-chapter__drawing'), {
      clipPath: 'inset(16% 0% 16% 0%)', duration: .8, ease: 'power2.out',
    }, 0)
    .from(parts, { y: i => (i % 2 ? -1 : 1) * 48, opacity: .15, stagger: .13, duration: .8 }, .1)
    .fromTo(trace, { strokeDasharray: '1 1', strokeDashoffset: 1 }, {
      strokeDashoffset: 0, duration: 1.3, ease: 'none',
    }, .2);
  if (desktop) timeline.from(chapter.querySelector('[data-chapter-number]'), { y: 40, duration: 1.4 }, 0);

  if (index === 0) {
    timeline.from(chapter.querySelector('[data-drawing-rotor]'), {
      rotation: -135, scale: .7, svgOrigin: '300 260', duration: 1.8, ease: 'power2.inOut',
    }, 0).to(chapter.querySelector('[data-drawing-pulse]'), {
      keyframes: [{ attr: { cx: 200, cy: 120 } }, { attr: { cx: 200, cy: 260 } }, { attr: { cx: 300, cy: 260 } }],
      duration: 1.3, ease: 'none',
    }, .1);
  }
  if (index === 1) timeline.from(chapter.querySelector('[data-drawing-cursor]'), { x: 80, y: 90, duration: 1.5 }, .2);
  if (index === 2) timeline.from(parts, { rotation: i => (i - 1) * 12, transformOrigin: '50% 100%', duration: 1.4 }, 0);
  if (index === 3) timeline.from(chapter.querySelectorAll('[data-drawing-layer]'), {
    y: i => (i - 1) * 90, x: i => (i - 1) * 30,
    opacity: .35, duration: 1.8, ease: 'power2.inOut',
  }, 0);

  chapter.querySelectorAll('[data-scope-item]').forEach(item => {
    gsap.from(item, { x: 16, duration: .6, scrollTrigger: { trigger: item, start: 'top 93%', once: true } });
  });
}

function animateMethod(root, desktop) {
  const method = root.querySelector('[data-services-method]');
  const timeline = gsap.timeline({ scrollTrigger: {
    trigger: method, start: desktop ? 'top top' : 'top 75%',
    end: desktop ? '+=480' : 'bottom bottom',
    pin: desktop && method.offsetHeight < window.innerHeight,
    scrub: .7, invalidateOnRefresh: true,
  }});
  timeline.from(method.querySelectorAll('[data-method-line]'), {
    x: i => (i === 0 ? -1 : 1) * (desktop ? 24 : 8), duration: 1.2,
  }, 0).from(method.querySelectorAll('[data-method-stage]'), {
    y: 36, stagger: .18, duration: .8,
  }, 0).from(method.querySelectorAll('[data-method-progress]'), {
    scaleX: 0, stagger: .2, duration: .7, ease: 'none',
  }, 0);
}

export default function initServicesExperience() {
  const root = document.querySelector('[data-services-page]');
  if (!root) return;
  let media;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = root.querySelector('[data-services-motion-toggle]');
  const toggleLabel = toggle.querySelector('[data-services-motion-label]');
  let userReduced = false;
  try { userReduced = sessionStorage.getItem('services-reduced-motion') === 'true'; } catch { /* Storage is optional. */ }
  let disposed = false;
  let initialHashHandled = false;

  function setMotionState(reduced) {
    root.dataset.servicesMotion = reduced ? 'reduced' : 'full';
    toggle.hidden = false;
    toggle.disabled = motion.matches;
    toggle.setAttribute('aria-pressed', String(reduced));
    toggleLabel.textContent = reduced ? 'Movimiento reducido' : 'Reducir movimiento';
  }

  function bindMotion() {
    media?.revert();
    setMotionState(userReduced || motion.matches);
    if (userReduced) return;
    media = gsap.matchMedia();
    media.add({ desktop: '(min-width: 1024px) and (min-height: 700px)',
      reduce: '(prefers-reduced-motion: reduce)', normal: '(prefers-reduced-motion: no-preference)',
      forced: '(forced-colors: active)',
    }, ({ conditions }) => {
      setMotionState(conditions.reduce || conditions.forced);
      if (conditions.reduce || conditions.forced) return;
      animateHero(root);
      root.querySelectorAll('[data-service-chapter]').forEach((chapter, index) => animateChapter(chapter, index, conditions.desktop));
      animateMethod(root, conditions.desktop);

      const signals = [...root.querySelectorAll('[data-service-signal]')].map(element => ({ element, signal: mountServiceSignal(element) }));
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const { signal } = signals.find(item => item.element === entry.target);
          if (entry.isIntersecting && !document.hidden) signal.play();
          else signal.stop();
        });
      });
      signals.forEach(({ element }) => observer.observe(element));
      const onVisibility = () => { if (document.hidden) signals.forEach(({ signal }) => signal.stop()); };
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        signals.forEach(({ signal }) => signal.destroy());
      };
    });
  }
  bindMotion();

  function toggleMotion() {
    userReduced = !userReduced;
    try { sessionStorage.setItem('services-reduced-motion', String(userReduced)); } catch { /* Storage is optional. */ }
    bindMotion();
    ScrollTrigger.refresh();
  }
  toggle.addEventListener('click', toggleMotion);

  // Keep catalogue jumps keyboard-accessible and retain their shareable hash.
  // This capture handler precedes the session's generic smooth-anchor listener.
  function onAnchor(event) {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || !root.contains(link) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (location.hash !== link.hash) history.pushState(history.state, '', link.hash);
    target.focus({ preventScroll: true });
    const immediate = userReduced || motion.matches;
    lenis.scrollTo(target, { offset: -32, duration: immediate ? 0 : 1.1, immediate });
  }
  root.addEventListener('click', onAnchor, true);

  // Font metrics affect the pin and deep links. Refresh after the font settles.
  document.fonts.ready.then(() => {
    if (disposed) return;
    ScrollTrigger.refresh();
    if (!initialHashHandled && location.hash) {
      initialHashHandled = true;
      const target = document.getElementById(location.hash.slice(1));
      if (target && root.contains(target)) lenis.scrollTo(target, { immediate: true, offset: -32 });
    }
  });
  onPageCleanup(() => {
    disposed = true;
    root.removeEventListener('click', onAnchor, true);
    toggle.removeEventListener('click', toggleMotion);
    media?.revert();
  });
}
