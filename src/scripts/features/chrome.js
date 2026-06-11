import { gsap } from '../core/gsap-core';
import { lenis } from '../core/lenis';

/**
 * Persistent chrome: floating dock + full-screen menu.
 * Both elements are `transition:persist`, so everything here binds ONCE
 * per session. Per-page state (active link, project pill) is synced by
 * `syncChrome()` from the lifecycle.
 */
let started = false;

export function initChrome() {
  if (started) return;

  const trigger = document.getElementById('sidebar-menu-btn');
  const panel = document.getElementById('nav-panel');
  if (!trigger || !panel) return;
  started = true;

  const html = document.documentElement;
  const cards = [...panel.querySelectorAll('.nav-card')];
  const isOpen = () => html.classList.contains('menu-open');

  // Single source of truth: the `menu-open` class. Fresh tweens per
  // transition (killTweensOf first) — state and visuals can't desync.
  function setMenu(open, { instant = false } = {}) {
    if (isOpen() === open) return;
    html.classList.toggle('menu-open', open);
    html.classList.toggle('no-scroll', open);
    document.body.classList.toggle('no-scroll', open);
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    if (open) lenis.stop(); else lenis.start();

    gsap.killTweensOf([panel, ...cards]);

    if (open) {
      panel.setAttribute('aria-hidden', 'false');
      panel.removeAttribute('inert');
      gsap.set(panel, { pointerEvents: 'auto' });
      gsap.timeline()
        .fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, 0)
        .fromTo(
          cards,
          { y: 48, autoAlpha: 0, clipPath: 'inset(18% 0% 18% 0%)' },
          { y: 0, autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, stagger: 0.055, ease: 'panel' },
          0.08
        );
    } else {
      const finish = () => {
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('inert', '');
        gsap.set(panel, { autoAlpha: 0, pointerEvents: 'none' });
      };
      if (instant) {
        gsap.set(cards, { autoAlpha: 0 });
        finish();
      } else {
        gsap.timeline({ onComplete: finish })
          .to(cards, { y: 24, autoAlpha: 0, duration: 0.25, stagger: 0.02, ease: 'power2.in' }, 0)
          .to(panel, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0.1);
      }
    }
  }

  trigger.addEventListener('click', () => setMenu(!isOpen()));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setMenu(false);
      trigger.focus({ preventScroll: true });
    }
  });

  // Card clicks: navigation to another page closes the menu via
  // astro:before-swap (never during the click dispatch, so the link
  // activation is not suppressed). Same-page links close it manually.
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      if (new URL(card.href).pathname === location.pathname) setMenu(false);
    });
  });

  // Never carry an open menu (or a locked scroll) into the next page
  document.addEventListener('astro:before-swap', () => setMenu(false, { instant: true }));

  // ── Dock auto-hide: slips away while scrolling down, returns on scroll up ──
  const dockWrap = document.getElementById('dock-wrap');
  if (dockWrap) {
    let hidden = false;
    const setHidden = (v) => {
      if (hidden === v) return;
      hidden = v;
      gsap.to(dockWrap, {
        yPercent: v ? 160 : 0,
        duration: 0.55,
        ease: v ? 'power3.in' : 'panel',
        overwrite: 'auto',
      });
    };
    lenis.on('scroll', ({ velocity, scroll }) => {
      if (isOpen()) return setHidden(false);
      if (scroll < 120 || velocity < -2) setHidden(false);
      else if (velocity > 6) setHidden(true);
    });
    document.addEventListener('astro:page-load', () => setHidden(false));
  }

  // ── Smooth in-page anchors (e.g. hero → #work) through Lenis ──
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link || link.origin !== location.origin || link.pathname !== location.pathname) return;
    const target = document.querySelector(link.hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  });
}

/** Per-page sync: active dock link + project pill. Runs on every page-load. */
export function syncChrome() {
  const path = location.pathname;

  document.querySelectorAll('[data-dock-link]').forEach((link) => {
    const href = link.getAttribute('href');
    const active = href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const pill = document.getElementById('dock-project-pill');
  if (pill) {
    const title = document.getElementById('main-content')?.dataset.projectTitle;
    pill.textContent = title || '';
    pill.classList.toggle('hidden', !title);
  }
}
