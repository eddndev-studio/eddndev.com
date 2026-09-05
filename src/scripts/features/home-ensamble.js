import { lenis } from '../core/lenis';
import { onPageCleanup } from '../core/lifecycle';
import { mountEnsamble } from './ensamble/controller.js';

export default function initHomeEnsamble() {
  const track = document.querySelector('[data-home-ensamble]');
  if (!track) return;
  const stage = track.querySelector('.ensamble-stage');
  // The shared lifecycle measures downstream pins after this native sticky scene.
  const scene = mountEnsamble(track, {
    // 100svh stays stable while mobile browser chrome opens and closes.
    getViewportHeight: () => parseFloat(getComputedStyle(stage).minHeight) || window.innerHeight,
    onRequestScroll: (y) => lenis.scrollTo(y, { immediate: true }),
    next: document.getElementById('studio'),
  });
  if (scene) onPageCleanup(() => scene.destroy());
}
