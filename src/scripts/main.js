import './core/gsap-core';
import { lenis } from './core/lenis';
import { startLifecycle } from './core/lifecycle';

import initStudioNav from './features/studio-nav';
import initKineticCanvas from './features/kinetic-canvas';
import initHomeEnsamble from './features/home-ensamble';
import initFooterSignal from './features/footer-signal';
import initWorkShowcase from './features/work-showcase';
import initContactForm from './features/contact-form';
import initStudioReveals from './animations/studio-reveals';
import initStudioServicesTransition from './animations/studio-services-transition';
import initKineticStatements from './animations/kinetic-statements';
import initServicePerforations from './animations/service-perforations';
import initServicesExperience from './animations/services-experience';

// Controls persist through resizes; scroll animations rebuild from a neutral layout.
startLifecycle({ features: [
  initStudioNav,
  initKineticCanvas,
  initHomeEnsamble,
  initFooterSignal,
  initContactForm,
], animations: [
  initWorkShowcase,
  initStudioServicesTransition,
  initKineticStatements,
  initServicePerforations,
  initServicesExperience,
  initStudioReveals,
] });

// Session singleton - smooth in-page anchor scrolling through Lenis.
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
