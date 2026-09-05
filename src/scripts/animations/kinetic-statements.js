import { gsap } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

const MUTED = 'rgba(241, 237, 244, 0.18)';

function offsetWithin(element, section) {
  let top = 0;
  for (let node = element; node && node !== section; node = node.offsetParent) top += node.offsetTop;
  return top;
}

export default function initKineticStatements() {
  const sections = gsap.utils.toArray('[data-kinetic-statement]');
  if (!sections.length || prefersReduced()) return;

  const rootStyles = getComputedStyle(document.documentElement);
  const active = rootStyles.getPropertyValue('--signal-on-dark').trim() || '#b7a6ec';
  const complete = rootStyles.getPropertyValue('--starlight').trim() || '#f1edf4';

  sections.forEach((section) => {
    const words = gsap.utils.toArray('[data-kinetic-word]', section);
    const accentGroups = gsap.utils.toArray('[data-kinetic-accent-group]', section);
    const stages = gsap.utils.toArray('[data-kinetic-stage]', section);
    if (!words.length) return;

    const markedScrubStart = words.findIndex((word) => word.hasAttribute('data-kinetic-scrub-start'));
    const scrubStartIndex = markedScrubStart >= 0 ? markedScrubStart : 0;
    const leadWords = words.slice(0, scrubStartIndex);
    const scrubWords = words.slice(scrubStartIndex);
    const scrollStartWord = scrubWords[0] || section;

    section.dataset.karaokeReady = 'true';
    gsap.set(words, { color: MUTED });
    gsap.set(leadWords, { color: complete });

    const accentControllers = accentGroups.map((group) => {
      const accent = group.querySelector('[data-kinetic-accent]');
      const accentWord = group.querySelector('[data-kinetic-accent-word]');
      const accentWordIndex = words.indexOf(accentWord);
      const anchorIndex = Number.parseInt(group.dataset.kineticAccentAnchorIndex, 10);

      if (!accent || !accentWord || accentWordIndex < 0 || !Number.isInteger(anchorIndex)) return null;

      return {
        group,
        accent,
        accentWord,
        anchorIndex,
        tail: words.slice(accentWordIndex),
        layoutProgress: 0,
        push: 0,
        revealProgress: 1,
        visible: false,
        motion: null,
      };
    }).filter(Boolean);

    const applyTailOffsets = () => {
      const offsets = new Map();

      accentControllers.forEach((controller) => {
        const hiddenPush = controller.push * (1 - controller.layoutProgress);
        if (hiddenPush <= 0.01) return;

        const accentLine = controller.accentWord.getBoundingClientRect().top;
        controller.tail.forEach((word) => {
          if (Math.abs(word.getBoundingClientRect().top - accentLine) >= 1) return;
          offsets.set(word, (offsets.get(word) || 0) - hiddenPush);
        });
      });

      words.forEach((word) => gsap.set(word, { x: offsets.get(word) || 0 }));
    };

    const refreshAccentGeometry = () => {
      accentControllers.forEach((controller) => {
        controller.push = controller.accentWord.offsetLeft - controller.group.offsetLeft;
      });
      applyTailOffsets();
    };

    const syncAccents = (progress) => {
      accentControllers.forEach((controller) => {
        const shouldReveal = progress >= controller.revealProgress;
        const restoring = document.documentElement.hasAttribute('data-layout-loading');
        if (!controller.motion || (shouldReveal === controller.visible && !restoring)) return;

        controller.visible = shouldReveal;
        if (restoring) controller.motion.progress(shouldReveal ? 1 : 0).pause();
        else if (shouldReveal) controller.motion.play();
        else controller.motion.reverse();
      });
    };

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: `${section.id}-karaoke`,
        // Layout offsets exclude the animated track's scale and translation.
        trigger: section,
        start: () => `top+=${offsetWithin(scrollStartWord, section)} 80%`,
        endTrigger: section,
        end: 'bottom 80%',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: ({ progress }) => syncAccents(progress),
        onRefresh: ({ progress }) => {
          refreshAccentGeometry();
          syncAccents(progress);
        },
      },
    });

    scrubWords.forEach((word, index) => {
      timeline.to(word, { color: active, duration: 0.34 }, index);
      timeline.to(word, { color: complete, duration: 0.66 }, index + 0.34);
    });

    accentControllers.forEach((controller) => {
      gsap.set(controller.accent, { autoAlpha: 0, scale: 0.28, rotation: -8 });
      const revealAt = controller.anchorIndex - scrubStartIndex + 1;
      controller.revealProgress = Math.max(0.001, revealAt / timeline.duration());
      controller.motion = gsap.timeline({ paused: true })
        .fromTo(
          controller.accent,
          { scale: 0.28, rotation: -8 },
          { scale: 1, rotation: 0, duration: 0.92, ease: 'sine.inOut' },
          0,
        )
        .to(controller.accent, { autoAlpha: 1, duration: 0.48, ease: 'sine.out' }, 0.38)
        .to(
          controller,
          { layoutProgress: 1, duration: 0.56, ease: 'sine.inOut', onUpdate: applyTailOffsets },
          0,
        );
    });

    if (stages.length) {
      gsap.fromTo(
        stages,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.09,
          ease: 'power2.out',
          scrollTrigger: { trigger: stages[0], start: 'top 88%', once: true },
        },
      );
    }

    refreshAccentGeometry();
    syncAccents(timeline.scrollTrigger.progress);
  });

  onPageCleanup(() => {
    sections.forEach((section) => delete section.dataset.karaokeReady);
  });
}
