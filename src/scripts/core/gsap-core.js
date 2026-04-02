import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// A11y: Skip all GSAP animations when user prefers reduced motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(1000);
  gsap.defaults({ duration: 0 });
}

export { gsap, ScrollTrigger, MotionPathPlugin };
