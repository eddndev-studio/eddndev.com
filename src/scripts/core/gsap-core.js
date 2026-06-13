import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* Cubic-bezier → easing function (WebKit UnitBezier, Newton-Raphson + bisection).
   Lets us register framer-motion's exact curves as native GSAP eases. */
function cubicBezier(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  const solveX = (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const xx = sampleX(t) - x;
      if (Math.abs(xx) < 1e-6) return t;
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= xx / d;
    }
    let lo = 0, hi = 1;
    t = x;
    while (lo < hi) {
      const xx = sampleX(t);
      if (Math.abs(xx - x) < 1e-6) break;
      if (x > xx) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sampleY(solveX(x)));
}

// framer-motion default layout transition (the push-down nav): cubic-bezier(0.4, 0, 0.1, 1)
gsap.registerEase('framerLayout', cubicBezier(0.4, 0, 0.1, 1));
// framer-motion default tween ease (FadeIn): cubic-bezier(0.25, 0.1, 0.35, 1)
gsap.registerEase('framerFade', cubicBezier(0.25, 0.1, 0.35, 1));

gsap.defaults({ ease: 'framerFade', duration: 0.5 });
gsap.config({ nullTargetWarn: false });

// A11y: collapse all GSAP motion when the user prefers reduced motion.
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(1000);
  gsap.defaults({ duration: 0 });
}

export { gsap, ScrollTrigger };
