import { gsap } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { lenis } from '../core/lenis';
import { prefersReduced } from '../core/dom';

export default function initStudioNav() {
  const panel = document.querySelector('[data-nav-panel]');
  const openBtn = document.querySelector('[data-nav-open]');
  const closeBtn = document.querySelector('[data-nav-close]');
  const bar = document.querySelector('[data-nav-bar]');
  if (!panel || !openBtn || !closeBtn || !bar) return;

  const html = document.documentElement;
  const body = document.body;
  const duration = () => (prefersReduced() ? 0 : 0.45);
  let isOpen = false;
  let lockedScrollY = 0;

  function collapsedOffset() {
    return -panel.clientHeight;
  }

  function lockScroll(lock) {
    if (lock) {
      lockedScrollY = window.scrollY;
      body.style.setProperty('--nav-scroll-offset', `-${lockedScrollY}px`);
      html.classList.add('nav-open');
      body.classList.add('nav-open');
      lenis.stop();
      return;
    }

    html.classList.remove('nav-open');
    body.classList.remove('nav-open');
    body.style.removeProperty('--nav-scroll-offset');
    window.scrollTo(0, lockedScrollY);
    lenis.start();
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
    panel.scrollTop = 0;
    gsap.killTweensOf(panel);
    gsap.to(panel, { y: 0, duration: duration(), ease: 'framerLayout' });
    requestAnimationFrame(() => closeBtn.focus({ preventScroll: true }));
  }

  function settleClosed() {
    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
    bar.removeAttribute('inert');
    bar.removeAttribute('aria-hidden');
    openBtn.setAttribute('aria-expanded', 'false');
  }

  function focusOpenButton() {
    requestAnimationFrame(() => openBtn.focus({ preventScroll: true }));
  }

  function close({ instant = false, focusOpen = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    lockScroll(false);
    gsap.killTweensOf(panel);
    if (instant) {
      gsap.set(panel, { y: collapsedOffset() });
      panel.scrollTop = 0;
      settleClosed();
      if (focusOpen) focusOpenButton();
    } else {
      gsap.to(panel, {
        y: collapsedOffset(),
        duration: duration(),
        ease: 'framerLayout',
        onComplete: () => {
          panel.scrollTop = 0;
          settleClosed();
          if (focusOpen) focusOpenButton();
        },
      });
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

  const onResize = () => {
    if (!isOpen) gsap.set(panel, { y: collapsedOffset() });
  };
  window.addEventListener('resize', onResize);

  onPageCleanup(() => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    gsap.killTweensOf(panel);
    if (isOpen) lockScroll(false);
  });
}
