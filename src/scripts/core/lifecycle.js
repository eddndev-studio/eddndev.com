import { gsap, ScrollTrigger } from './gsap-core';

/**
 * Page lifecycle for Astro view transitions.
 *
 * Guarantees:
 * - init runs exactly ONCE per rendered page, even if `astro:page-load`
 *   fires multiple times (it does in dev).
 * - every GSAP tween/ScrollTrigger created inside init is reverted on
 *   `astro:before-swap`, and registered cleanups (Ledding, listeners,
 *   SplitText) run before the next page initializes.
 */

let ctx = null;
let armed = true; // first astro:page-load must init
const cleanups = [];

/** Register a cleanup to run when the current page is swapped out. */
export function onPageCleanup(fn) {
  cleanups.push(fn);
}

function cleanup() {
  while (cleanups.length) {
    try { cleanups.pop()(); } catch { /* never block the swap */ }
  }
  if (ctx) {
    ctx.revert();
    ctx = null;
  }
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

/**
 * Wire the page lifecycle. `initFns` run inside a gsap.context so all
 * animation state they create is reverted automatically between pages.
 */
export function startLifecycle(initFns) {
  document.addEventListener('astro:before-swap', () => {
    cleanup();
    armed = true;
  });

  document.addEventListener('astro:page-load', () => {
    if (!armed) return; // dedupe multi-dispatch on the same page
    armed = false;
    ctx = gsap.context(() => {
      initFns.forEach((fn) => {
        try { fn(); } catch (e) { console.error('[init]', e); }
      });
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
}
