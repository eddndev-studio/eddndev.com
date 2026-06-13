import { gsap } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { lenis } from '../core/lenis';
import { prefersReduced } from '../core/dom';

/**
 * Studio navigation — a black panel that expands from an 8px sliver to its full
 * height, pushing the white page card down (the card sits below it in normal
 * flow, so animating the panel's height reflows it for free).
 *
 * Replicates framer-motion's layout animation exactly: the height tween runs
 * framer's defaultLayoutTransition — 0.45s, cubic-bezier(0.4, 0, 0.1, 1).
 */
const COLLAPSED = '0.5rem';

export default function initStudioNav() {
  const panel = document.querySelector('[data-nav-panel]');
  const openBtn = document.querySelector('[data-nav-open]');
  const closeBtn = document.querySelector('[data-nav-close]');
  const bar = document.querySelector('[data-nav-bar]');
  if (!panel || !openBtn || !closeBtn || !bar) return;

  const html = document.documentElement;
  const duration = () => (prefersReduced() ? 0 : 0.45);
  let isOpen = false;

  function lockScroll(lock) {
    html.classList.toggle('nav-open', lock);
    document.body.classList.toggle('nav-open', lock);
    if (lock) lenis.stop(); else lenis.start();
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    panel.removeAttribute('inert');
    panel.setAttribute('aria-hidden', 'false');
    bar.setAttribute('inert', '');
    bar.setAttribute('aria-hidden', 'true');
    openBtn.setAttribute('aria-expanded', 'true');
    lockScroll(true);
    gsap.killTweensOf(panel);
    gsap.to(panel, { height: 'auto', duration: duration(), ease: 'framerLayout' });
    requestAnimationFrame(() => closeBtn.focus({ preventScroll: true }));
  }

  function settleClosed() {
    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
    bar.removeAttribute('inert');
    bar.removeAttribute('aria-hidden');
    openBtn.setAttribute('aria-expanded', 'false');
  }

  function close({ instant = false, focusOpen = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    lockScroll(false);
    gsap.killTweensOf(panel);
    if (instant) {
      gsap.set(panel, { height: COLLAPSED });
      settleClosed();
    } else {
      gsap.to(panel, { height: COLLAPSED, duration: duration(), ease: 'framerLayout', onComplete: settleClosed });
      if (focusOpen) requestAnimationFrame(() => openBtn.focus({ preventScroll: true }));
    }
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', () => close());

  // Links inside the panel: collapse instantly so the navigation's view-transition
  // snapshot is taken in the closed state. Same-page hashes scroll smoothly.
  panel.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const url = new URL(link.href, location.href);
      const samePage = url.pathname === location.pathname && url.hash;
      if (samePage) {
        const target = document.querySelector(url.hash);
        if (target) {
          e.preventDefault();
          close({ instant: true, focusOpen: false });
          lenis.scrollTo(target, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
          return;
        }
      }
      close({ instant: true, focusOpen: false });
    });
  });

  const onKey = (e) => {
    if (e.key === 'Escape' && isOpen) close();
  };
  window.addEventListener('keydown', onKey);

  onPageCleanup(() => {
    window.removeEventListener('keydown', onKey);
    // Never carry a locked scroll into the next page.
    html.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    lenis.start();
  });
}
