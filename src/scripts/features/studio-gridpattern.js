import { gsap } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BLOCK_D =
  'M45.119 4.5a11.5 11.5 0 0 0-11.277 9.245l-25.6 128C6.82 148.861 12.262 155.5 19.52 155.5h63.366a11.5 11.5 0 0 0 11.277-9.245l25.6-128c1.423-7.116-4.02-13.755-11.277-13.755H45.119Z';

/** Studio GridPattern hover-pulse: as the cursor crosses a honeycomb cell, it lights up. */
export default function initStudioGridPattern() {
  if (prefersReduced()) return;
  const svg = document.querySelector('[data-grid-pattern="interactive"]');
  const layer = svg?.querySelector('[data-grid-blocks]');
  if (!svg || !layer) return;

  const yOffset = Number(svg.getAttribute('data-y-offset')) || 0;
  let current = null;

  function onMove(event) {
    const rect = svg.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    x = x - rect.width / 2 - 32;
    y = y - yOffset;
    x += Math.tan(32 / 160) * y;
    x = Math.floor(x / 96);
    y = Math.floor(y / 160);

    if (current && current[0] === x && current[1] === y) return;
    current = [x, y];

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', BLOCK_D);
    path.setAttribute('transform', `translate(${-32 * y + 96 * x} ${160 * y})`);
    path.style.opacity = '0';
    layer.appendChild(path);
    gsap.timeline({ onComplete: () => path.remove() })
      .to(path, { opacity: 1, duration: 0.01 })
      .to(path, { opacity: 0, duration: 1, ease: 'none' });
  }

  window.addEventListener('mousemove', onMove);
  onPageCleanup(() => window.removeEventListener('mousemove', onMove));
}
