/** Leave a reading interval before Services covers the completed statement. */
export function createStudioExit(gsap, track, mobile) {
  return gsap.timeline({ paused: true })
    .to({}, { duration: 0.4 })
    .fromTo(track, { yPercent: 0, scale: 1, autoAlpha: 1 }, {
      yPercent: () => mobile() ? -6 : -10,
      scale: () => mobile() ? 0.985 : 0.96,
      autoAlpha: 0,
      duration: 0.6,
      ease: 'none',
    }, 0.4);
}
