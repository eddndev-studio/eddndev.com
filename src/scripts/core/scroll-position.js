import { ScrollTrigger } from './gsap-core';

const absoluteTop = element => element.getBoundingClientRect().top + window.scrollY;

/** Preserve the current scene and its progress when a resize changes its length. */
export function captureScrollPosition() {
  const y = window.scrollY;
  if (y < 2) return { y: 0 };
  const pin = ScrollTrigger.getAll().find(trigger => trigger.pin && y >= trigger.start && y < trigger.end);
  if (pin) return { y, kind: 'pin', element: pin.trigger, progress: (y - pin.start) / (pin.end - pin.start) };

  const hero = document.querySelector('[data-home-ensamble].is-pinned');
  if (hero) {
    const delay = -parseFloat(hero.style.getPropertyValue('--ensamble-pin-top')) || 0;
    const runway = parseFloat(hero.style.getPropertyValue('--ensamble-runway')) || 0;
    const start = absoluteTop(hero) + delay;
    if (y >= start && y < start + runway) return { y, kind: 'hero', element: hero, progress: (y - start) / runway };
  }

  const line = window.innerHeight * 0.25;
  const candidates = [...document.querySelectorAll('main section[id], main [data-service-chapter], main [data-services-method], footer')];
  const element = candidates.reverse().find(element => {
    const rect = element.getBoundingClientRect();
    return rect.height > 0 && rect.top <= line && rect.bottom > line;
  });
  return element
    ? { y, kind: 'content', element, progress: (line - element.getBoundingClientRect().top) / element.offsetHeight }
    : { y };
}

export function resolveScrollPosition(position) {
  const { element, kind, progress, hash } = position;
  if (hash) {
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { /* Invalid hashes are harmless. */ }
    if (target) return absoluteTop(target) - (parseFloat(getComputedStyle(target).scrollMarginTop) || 32);
  }
  if (!element?.isConnected) return position.y;
  if (kind === 'pin') {
    const pin = ScrollTrigger.getAll().find(trigger => trigger.pin && trigger.trigger === element);
    if (pin) return pin.start + progress * (pin.end - pin.start);
  }
  if (kind === 'hero') {
    const delay = -parseFloat(element.style.getPropertyValue('--ensamble-pin-top')) || 0;
    const runway = parseFloat(element.style.getPropertyValue('--ensamble-runway')) || 0;
    return absoluteTop(element) + delay + progress * runway;
  }
  return absoluteTop(element) + progress * element.offsetHeight - window.innerHeight * 0.25;
}
