/** One initial pose for the server-rendered mosaic and the scroll timeline. */
export function getHeroTilePose(index) {
  return {
    xPercent: ((index % 4) - 1.5) * 30,
    yPercent: (Math.floor(index / 4) - 1.5) * 30,
    rotation: (index % 3 - 1) * 24,
  };
}

export function createHeroTimeline(gsap, { tiles, assembly, asterisk }) {
  const initial = {
    x: 0,
    y: 0,
    scale: 1,
    xPercent: i => getHeroTilePose(i).xPercent,
    yPercent: i => getHeroTilePose(i).yPercent,
    rotation: i => getHeroTilePose(i).rotation,
  };
  gsap.set(tiles, initial);
  gsap.set([assembly, asterisk], { rotation: 0 });

  // Build the complete timeline before ScrollTrigger measures its duration.
  // Explicit endpoints keep refreshes and reverse scrolling on the same path.
  const timeline = gsap.timeline({ paused: true });
  timeline.set(tiles, initial, 0)
    .set([assembly, asterisk], { rotation: 0 }, 0)
    .fromTo(tiles, initial, {
    x: 0, y: 0, xPercent: 0, yPercent: 0, rotation: i => i % 4 * 90,
    stagger: { amount: .35, from: 'center', grid: [4, 4] },
    duration: 1.25, ease: 'power2.inOut', immediateRender: false,
  }, .2).fromTo(assembly, { rotation: 0 }, {
    rotation: 90, duration: 1.6, ease: 'power2.inOut', immediateRender: false,
  }, .2).fromTo(asterisk, { rotation: 0 }, {
    rotation: 180, duration: 1.6, ease: 'none', immediateRender: false,
  }, .2).addLabel('assembled', 1.8)
    // Leave the completed mosaic on screen before releasing the hero.
    .to({}, { duration: .45 }, 'assembled');
  return timeline;
}

export function getHeroScrollConfig(hero, viewportHeight) {
  return {
    id: 'services-hero',
    trigger: hero,
    // Tall heroes first scroll into position. Their last composition then
    // stays in view for the full assembly, including on small screens.
    start: 'clamp(bottom bottom)',
    end: () => `+=${Math.round(viewportHeight() * 1.1)}`,
    pin: true,
    pinSpacing: true,
    scrub: true,
    refreshPriority: 1,
  };
}
