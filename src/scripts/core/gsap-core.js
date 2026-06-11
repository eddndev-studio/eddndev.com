import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

/* Master motion grammar — one easing family for the whole site */
gsap.defaults({ ease: 'power3.out', duration: 0.9 });
gsap.config({ nullTargetWarn: false });

// "panel" — heavy element settling into its slot (signature entrance ease)
gsap.registerEase('panel', (p) => 1 - Math.pow(1 - p, 5));

// A11y: collapse all GSAP motion when user prefers reduced motion.
// fromTo() patterns land on their visible end state instantly.
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(1000);
  gsap.defaults({ duration: 0 });
}

export { gsap, ScrollTrigger, SplitText };
