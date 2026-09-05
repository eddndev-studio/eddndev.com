/** Scroll-driven reveals; the complete gallery remains visible without motion. */
export function mountWorkMotion(root, gsap) {
  const media = gsap.matchMedia();
  media.add('(min-width: 960px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)', () => {
    root.dataset.workMotion = 'true';
    root.querySelectorAll('[data-work-project]').forEach((scene, index) => {
      const image = scene.querySelector('[data-work-image]');
      const title = scene.querySelector('[data-work-title]');
      const shutters = scene.querySelectorAll('[data-work-shutter]');
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: 'top 85%',
          end: 'top 12%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      timeline
        .fromTo(shutters, { scaleX: 1 }, {
          scaleX: 0, transformOrigin: index % 2 ? 'left center' : 'right center',
          duration: 0.8, stagger: { each: 0.08, from: index % 2 ? 'end' : 'start' }, ease: 'power2.inOut',
        }, 0)
        .fromTo(image, { scale: 1.12, yPercent: 4 }, { scale: 1, yPercent: 0, duration: 1.35, ease: 'none' }, 0)
        .fromTo(title, { x: index % 2 ? 36 : -36 }, { x: 0, duration: 1.35, ease: 'none' }, 0);
    });
    return () => { delete root.dataset.workMotion; };
  });
  return () => media.revert();
}
