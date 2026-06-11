import './core/gsap-core';
import './core/lenis';
import { startLifecycle } from './core/lifecycle';

import { initCursor } from './features/cursor';
import { initChrome, syncChrome } from './features/chrome';
import initLeddingHero from './features/ledding-hero';

import initReveals from './animations/reveals';
import initHome from './animations/home';
import initServices from './animations/services';
import initProfile from './animations/profile';
import initProjectHero from './animations/project-hero';
import initCaseContent from './animations/case-content';
import initAutomation from './animations/automation';

// Session singletons — bound once, survive view transitions
initCursor();
initChrome();

// Per-page modules — initialized once per page, fully reverted on swap
startLifecycle([
  syncChrome,
  initLeddingHero,
  initReveals,
  initHome,
  initServices,
  initProfile,
  initProjectHero,
  initCaseContent,
  initAutomation,
]);
