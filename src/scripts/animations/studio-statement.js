import { gsap } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

const MUTED = 'rgba(241, 237, 244, 0.18)';

export default function initStudioStatement() {
  const sections = gsap.utils.toArray('[data-studio-statement]');
  if (!sections.length) return;

  if (prefersReduced()) return;

  const rootStyles = getComputedStyle(document.documentElement);
  const active = rootStyles.getPropertyValue('--signal-on-dark').trim() || '#b7a6ec';
  const complete = rootStyles.getPropertyValue('--starlight').trim() || '#f1edf4';

  sections.forEach((section) => {
    const words = gsap.utils.toArray('[data-studio-word]', section);
    if (!words.length) return;

    section.dataset.karaokeReady = 'true';
    gsap.set(words, { color: MUTED });

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top 82%',
        end: 'bottom 60%',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    words.forEach((word, index) => {
      timeline.to(word, { color: active, duration: 0.34 }, index);
      timeline.to(word, { color: complete, duration: 0.66 }, index + 0.34);
    });
  });

  onPageCleanup(() => {
    sections.forEach((section) => delete section.dataset.karaokeReady);
  });
}
