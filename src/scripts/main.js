import './core/gsap-core';
import { lenis } from './core/lenis';
import { startLifecycle } from './core/lifecycle';

import initStudioNav from './features/studio-nav';
import initStudioGridPattern from './features/studio-gridpattern';
import initStudioReveals from './animations/studio-reveals';

// Per-page modules — initialized once per page, reverted on view-transition swap.
startLifecycle([
  initStudioNav,
  initStudioGridPattern,
  initStudioReveals,
]);

// Session singleton — smooth in-page anchor scrolling through Lenis.
document.addEventListener('click', (e) => {
  const link = e.target.closest?.('a[href*="#"]');
  if (!link || link.origin !== location.origin || link.pathname !== location.pathname) return;
  const hash = link.hash;
  if (!hash || hash === '#') return;
  const target = document.querySelector(hash);
  if (!target) return;
  e.preventDefault();
  lenis.scrollTo(target, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
});
