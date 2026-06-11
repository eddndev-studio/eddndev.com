import { gsap, ScrollTrigger } from '../core/gsap-core';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

/**
 * /work archive — rows rise in, and on fine pointers a floating preview
 * of each case follows the cursor over the list, tilting with velocity.
 * Listeners bind to per-page elements, so the swap disposes them.
 */
export default function initWork() {
  const list = document.querySelector('[data-project-list]');
  if (!list) return;
  const reduced = prefersReduced();
  const rows = gsap.utils.toArray('[data-work-row]', list);

  // ── Rows: staggered rise ──
  if (rows.length) {
    gsap.set(rows, { y: 44, autoAlpha: 0 });
    ScrollTrigger.batch(rows, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.09, ease: 'panel', overwrite: true }),
    });
    onPageCleanup(() => gsap.set(rows, { clearProps: 'all' }));
  }

  // ── Floating cursor preview (desktop, fine pointer) ──
  const preview = document.querySelector('[data-work-preview]');
  const img = preview?.querySelector('[data-work-preview-img]');
  const finePointer = window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches;

  if (preview && img && finePointer && !reduced) {
    gsap.set(preview, { xPercent: -50, yPercent: -115, autoAlpha: 0, scale: 0.92, rotation: 0 });
    const xTo = gsap.quickTo(preview, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(preview, 'y', { duration: 0.45, ease: 'power3.out' });
    const rTo = gsap.quickTo(preview, 'rotation', { duration: 0.6, ease: 'power3.out' });
    let lastX = null;

    list.addEventListener('pointermove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
      if (lastX !== null) rTo(gsap.utils.clamp(-7, 7, (e.clientX - lastX) * 0.4));
      lastX = e.clientX;
    });

    rows.forEach((row) => {
      row.addEventListener('pointerenter', () => {
        const src = row.dataset.previewSrc;
        if (!src) return;
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
      });
    });

    list.addEventListener('pointerleave', () => {
      lastX = null;
      rTo(0);
      gsap.to(preview, { autoAlpha: 0, scale: 0.92, duration: 0.3, ease: 'power2.in' });
    });
  }
}
