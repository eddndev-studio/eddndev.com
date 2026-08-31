import { gsap, ScrollTrigger } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

function setupConnector(section, circles) {
  const connector = section.querySelector('[data-service-connector]');
  const connectorPath = section.querySelector('[data-service-connector-path]');
  const desktop = window.matchMedia('(min-width: 640px)');

  if (!connector || !connectorPath || circles.length < 2) {
    return { refreshConnector: () => {}, cleanup: () => {} };
  }

  const refreshConnector = () => {
    if (!desktop.matches) {
      connectorPath.removeAttribute('d');
      return;
    }

    const sectionRect = section.getBoundingClientRect();
    if (!sectionRect.width || !sectionRect.height) return;

    const points = circles.map((circle) => {
      const circleRect = circle.getBoundingClientRect();
      return {
        x: circleRect.left - sectionRect.left + (circleRect.width / 2),
        y: circleRect.top - sectionRect.top + (circleRect.height / 2),
      };
    });
    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');

    connector.setAttribute('viewBox', `0 0 ${sectionRect.width} ${sectionRect.height}`);
    connectorPath.setAttribute('d', pathData);
  };

  window.addEventListener('resize', refreshConnector);
  desktop.addEventListener('change', refreshConnector);
  ScrollTrigger.addEventListener('refreshInit', refreshConnector);
  refreshConnector();

  return {
    refreshConnector,
    cleanup: () => {
      window.removeEventListener('resize', refreshConnector);
      desktop.removeEventListener('change', refreshConnector);
      ScrollTrigger.removeEventListener('refreshInit', refreshConnector);
    },
  };
}

function setupViewportIcons(scenes) {
  const pairs = scenes
    .map((scene) => ({
      circle: scene.querySelector('[data-service-perforation]'),
      layer: scene.querySelector('[data-service-viewport-icon]'),
    }))
    .filter(({ circle, layer }) => circle && layer);
  let frameId = null;

  const refreshViewportIcons = () => {
    frameId = null;
    pairs.forEach(({ circle, layer }) => {
      const circleRect = circle.getBoundingClientRect();
      const circleCenterX = `${circleRect.left + (circleRect.width / 2)}px`;
      layer.style.setProperty('--service-mask-x', circleCenterX);
      layer.style.setProperty('--service-mask-y', `${circleRect.top + (circleRect.height / 2)}px`);
      layer.style.setProperty('--service-mask-radius', `${circleRect.width / 2}px`);
      layer.style.setProperty('--service-icon-x', circleCenterX);
    });
  };
  const scheduleRefresh = () => {
    if (frameId !== null) return;
    frameId = window.requestAnimationFrame(refreshViewportIcons);
  };

  window.addEventListener('scroll', scheduleRefresh, { passive: true });
  window.addEventListener('resize', scheduleRefresh);
  ScrollTrigger.addEventListener('refreshInit', refreshViewportIcons);
  refreshViewportIcons();

  return {
    refreshViewportIcons,
    cleanup: () => {
      window.removeEventListener('scroll', scheduleRefresh);
      window.removeEventListener('resize', scheduleRefresh);
      ScrollTrigger.removeEventListener('refreshInit', refreshViewportIcons);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    },
  };
}

export default function initServicePerforations() {
  const sections = gsap.utils.toArray('[data-service-perforations]');
  if (!sections.length) return;

  const reducedMotion = prefersReduced();
  const connectorCleanups = [];

  sections.forEach((section) => {
    const scenes = gsap.utils.toArray('[data-service-scene]', section);
    if (!scenes.length) return;

    const circles = scenes
      .map((scene) => scene.querySelector('[data-service-perforation]'))
      .filter(Boolean);
    const { refreshConnector, cleanup } = setupConnector(section, circles);
    const {
      refreshViewportIcons,
      cleanup: cleanupViewportIcons,
    } = setupViewportIcons(scenes);
    const refreshVisuals = () => {
      refreshConnector();
      refreshViewportIcons();
    };
    connectorCleanups.push(cleanup, cleanupViewportIcons);

    if (reducedMotion) return;

    section.dataset.revealReady = 'true';

    scenes.forEach((scene) => {
      const circle = scene.querySelector('[data-service-perforation]');
      const iconLayer = scene.querySelector('[data-service-viewport-icon]');
      const icon = iconLayer?.querySelector('[data-service-perforation-icon]');
      const copy = scene.querySelector('[data-service-copy]');
      if (!circle || !copy) return;

      const direction = scene.dataset.perforationSide === 'left' ? 1 : -1;
      const parsedDepth = Number.parseFloat(circle.dataset.perforationDepth);
      const depth = Number.isFinite(parsedDepth) ? parsedDepth : 0.05;
      const travel = depth * 100;
      const iconDrift = 20;

      gsap.set(circle, { yPercent: -travel });
      if (icon) gsap.set(icon, { yPercent: iconDrift });
      gsap.set(copy, { autoAlpha: 0, xPercent: direction * 10 });

      const motionTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      motionTimeline.to(
        circle,
        { yPercent: travel, duration: 1, ease: 'none', onUpdate: refreshVisuals },
        0,
      );
      if (icon) {
        motionTimeline.to(icon, { yPercent: -iconDrift, duration: 1, ease: 'none' }, 0);
      }

      const revealTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: 'top 86%',
          end: 'center 48%',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      revealTimeline.to(
        copy,
        { autoAlpha: 1, xPercent: 0, duration: 0.62, ease: 'power2.out' },
        0.08,
      );
    });
  });

  onPageCleanup(() => {
    connectorCleanups.forEach((cleanup) => cleanup());
    sections.forEach((section) => delete section.dataset.revealReady);
  });
}
