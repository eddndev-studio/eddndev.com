import { gsap } from '../core/gsap-core';

/**
 * Custom LED-dot cursor. The #custom-cursor element is `transition:persist`,
 * so this runs ONCE per session — listeners and quickTo tweens never stack.
 */
let started = false;

export function initCursor() {
  if (started) return;

  const isDesktop = window.matchMedia('(pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isDesktop || prefersReducedMotion) return;

  const cursor = document.getElementById('custom-cursor');
  const label = document.getElementById('cursor-label');
  if (!cursor || !label) return;

  started = true;
  document.documentElement.classList.add('custom-cursor-active');

  let mouseX = 0;
  let mouseY = 0;
  let currentTarget = null;

  const baseSize = 16;
  const hoverSize = 80;

  gsap.set(cursor, { xPercent: -50, yPercent: -50, backgroundColor: '#ffffff', mixBlendMode: 'difference' });

  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.2, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.2, ease: 'power3' });
  const press = gsap.quickTo(cursor, 'scale', { duration: 0.25, ease: 'power3.out' });

  function updateCursorState(target) {
    if (currentTarget === target) return;
    currentTarget = target;

    if (target) {
      const actionText = target.getAttribute('data-cursor-text') || 'CLICK';
      gsap.killTweensOf(label);
      gsap.to(cursor, {
        width: hoverSize,
        height: hoverSize,
        backgroundColor: '#8b5cf6',
        mixBlendMode: 'normal',
        duration: 0.3,
        ease: 'back.out(1.7)',
        overwrite: 'auto',
      });
      label.innerText = actionText;
      gsap.to(label, { opacity: 1, duration: 0.2, delay: 0.05 });
    } else {
      gsap.killTweensOf(label);
      gsap.to(cursor, {
        width: baseSize,
        height: baseSize,
        backgroundColor: '#ffffff',
        mixBlendMode: 'difference',
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      gsap.to(label, {
        opacity: 0,
        duration: 0.1,
        onComplete: () => { if (!currentTarget) label.innerText = ''; },
      });
    }
  }

  function checkInteractivity() {
    const el = document.elementFromPoint(mouseX, mouseY);
    if (!el) return;
    const target = el.closest('a, button, .interactive, [data-cursor-text]');
    updateCursorState(target);
  }

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    xTo(mouseX);
    yTo(mouseY);
    checkInteractivity();
  }, { passive: true });

  window.addEventListener('scroll', checkInteractivity, { passive: true });

  // Physical press feedback
  window.addEventListener('mousedown', () => press(0.8), { passive: true });
  window.addEventListener('mouseup', () => press(1), { passive: true });

  document.addEventListener('mouseleave', () => gsap.to(cursor, { opacity: 0, duration: 0.25 }));
  document.addEventListener('mouseenter', () => gsap.to(cursor, { opacity: 1, duration: 0.25 }));

  // Reset hover state after a page swap (old target node is gone)
  document.addEventListener('astro:page-load', () => {
    currentTarget = null;
    updateCursorState(null);
  });
}
