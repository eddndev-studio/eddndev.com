import { gsap, ScrollTrigger } from '../core/gsap-core';

export default function initCaseContent() {
  const container = document.querySelector('[data-case-content]');
  if (!container) return;

  // .reveal-text is handled generically in animations/reveals.js

  // 1. Stats stagger (profile-card pattern)
  gsap.utils.toArray('[data-case-stat]').forEach((stat, i) => {
    gsap.fromTo(stat,
      { scale: 0.95, y: 20, autoAlpha: 0 },
      {
        scale: 1,
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        delay: i * 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: stat,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        }
      }
    );
  });

  // 3. Next project reveal
  const nextProject = document.querySelector('[data-next-project]');
  if (nextProject) {
    gsap.fromTo(nextProject,
      { y: 40, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: nextProject,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      }
    );
  }
}
