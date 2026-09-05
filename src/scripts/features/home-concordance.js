import { gsap } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { mountMosaic } from './concordance/controller.js';

export default function initHomeConcordance() {
  const root = document.querySelector('[data-home-concordance]');
  if (!root) return;
  const scope = root.closest('.home-hero');
  const breakpoint = window.matchMedia('(max-width: 899px)');
  const mosaics = [...root.querySelectorAll('[data-concordance-state]')].map(element => {
    const state = JSON.parse(element.dataset.concordanceState);
    return mountMosaic({
      svg: element.querySelector('[data-concordance-svg]'), state, scope, gsap,
    });
  });
  const resize = () => {
    mosaics[0].suspend(breakpoint.matches);
    mosaics[1].suspend(!breakpoint.matches);
  };
  resize();
  breakpoint.addEventListener('change', resize);
  const button = root.querySelector('[data-concordance-toggle]');
  let paused = false;
  const toggle = () => {
    paused = !paused;
    mosaics.forEach(mosaic => mosaic.setPaused(paused));
    button.setAttribute('aria-pressed', String(paused));
    button.querySelector('[data-concordance-label]').textContent = paused ? 'Reanudar animación' : 'Pausar animación';
  };
  button.hidden = false;
  button.addEventListener('click', toggle);
  onPageCleanup(() => {
    button.removeEventListener('click', toggle);
    breakpoint.removeEventListener('change', resize);
    mosaics.forEach(mosaic => mosaic.destroy());
  });
}
