import {
  clamp,
  getLayout,
  getProgress,
  getLayerTransform,
  matrix,
} from './model.js';
import { createExitView } from './exit-view.js';

export function mountEnsamble(
  track,
  {
    onLayoutChange = () => {},
    next,
    getViewportHeight = () => window.innerHeight,
    onRequestScroll = (y) => window.scrollTo(0, y),
  } = {},
) {
  if (!track || track.dataset.mounted) return null;
  track.dataset.mounted = 'true';
  const stage = track.querySelector('.ensamble-stage');
  const art = track.querySelector('.ensamble-sculpture');
  const exitView = createExitView(track, next);
  const layers = Array.from(track.querySelectorAll('.ensamble-lamina'));
  const faces = layers.map((layer) =>
    Array.from(layer.querySelectorAll('use')),
  );
  const pause = track.querySelector('.ensamble-pause');
  const structureButton = track.querySelector('.ensamble-structure');
  const pauseLabel = pause.querySelector('.ensamble-pause-label');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forced = window.matchMedia('(forced-colors: active)');
  const mobile = window.matchMedia('(max-width: 600px)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const abort = new AbortController();
  const on = (target, event, callback, options = {}) =>
    target.addEventListener(event, callback, {
      signal: abort.signal,
      ...options,
    });
  let paused = false,
    visible = true,
    alive = true,
    raf = 0,
    layoutRaf = 0;
  let last = 0,
    lastPaint = 0,
    time = 0,
    progress = 0,
    frames = 0;
  let pointer = { x: 0, y: 0 },
    aim = { x: 0, y: 0 };
  let showStructure = false,
    structure = 0,
    paintedStructure = -1;
  let structureSelected = false,
    hovered = false;
  let height = 0,
    runway = 0,
    top = 0,
    delay = 0,
    overlap = 0;
  let measurePending = false,
    dirty = true;
  const noMotion = () => reduced.matches || forced.matches;
  let lastMotionPreference = noMotion();
  const canAnimate = () =>
    alive &&
    visible &&
    !document.hidden &&
    !paused &&
    !noMotion() &&
    progress < 0.02;

  function requestTick() {
    if (alive && !raf) raf = requestAnimationFrame(frame);
  }

  function readScroll() {
    progress = getProgress({
      scroll: window.scrollY,
      top,
      runway,
      delay,
      reduced: noMotion(),
    });
  }

  function measure() {
    measurePending = false;
    // A menu overlay fixes the body temporarily; it is not a new page geometry.
    if (document.documentElement.classList.contains('nav-open')) return;
    const previousSize = height + runway - overlap;
    height = stage.offsetHeight;
    top = track.getBoundingClientRect().top + window.scrollY;
    const layout = getLayout({
      height,
      viewport: getViewportHeight(),
      mobile: mobile.matches,
      reduced: noMotion(),
    });
    runway = layout.runway;
    delay = layout.delay;
    overlap = layout.overlap;
    track.classList.toggle('is-pinned', layout.pinned);
    track.style.setProperty('--ensamble-stage-h', `${height}px`);
    track.style.setProperty('--ensamble-runway', `${runway}px`);
    track.style.setProperty('--ensamble-pin-top', `${layout.pinTop}px`);
    track.style.setProperty('--ensamble-overlap', `${overlap}px`);
    exitView.measure({ pinTop: layout.pinTop, height: window.innerHeight });
    readScroll();
    dirty = true;
    if (previousSize !== height + runway - overlap && !layoutRaf) {
      layoutRaf = requestAnimationFrame(() => {
        layoutRaf = 0;
        if (alive) onLayoutChange();
      });
    }
  }

  function scheduleMeasure() {
    measurePending = true;
    requestTick();
  }

  function paint() {
    for (let index = 0; index < layers.length; index++) {
      const transform = getLayerTransform({
        index,
        time,
        structure,
        pointer,
        progress,
      });
      const departure = exitView.layer(index, progress);
      transform[4] += departure.x;
      transform[5] += departure.y;
      layers[index].setAttribute('transform', matrix(transform));
    }
    if (
      Math.abs(paintedStructure - structure) > 0.002 ||
      structure === 0 ||
      structure === 1
    ) {
      if (paintedStructure !== structure) {
        layers.forEach((layer, index) => {
          const front = index === layers.length - 1;
          layer.style.opacity = String(
            index % 3 === 0 || front ? 1 : 1 - structure * 0.91,
          );
          for (const face of faces[index]) {
            face.setAttribute(
              'fill-opacity',
              (1 - structure * (front ? 0.985 : 0.96)).toFixed(3),
            );
            face.setAttribute(
              'stroke-opacity',
              (0.67 + structure * 0.21).toFixed(3),
            );
            face.setAttribute('stroke', showStructure ? '#a398e8' : '#a58fce');
          }
        });
        paintedStructure = structure;
      }
    }
    exitView.paint(progress, runway > 0);
    dirty = false;
    frames++;
  }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    if (noMotion() !== lastMotionPreference) {
      lastMotionPreference = noMotion();
      time = 0;
      aim = { x: 0, y: 0 };
      pointer = { x: 0, y: 0 };
      measurePending = true;
    }
    if (measurePending) measure();
    const dt = Math.min((now - (last || now)) / 1000, 0.045);
    last = now;
    const active = canAnimate();
    if (active) {
      time += dt;
      pointer.x += (aim.x - pointer.x) * Math.min(1, dt * 5);
      pointer.y += (aim.y - pointer.y) * Math.min(1, dt * 5);
    }
    const target = showStructure ? 1 : 0;
    if (noMotion() || Math.abs(target - structure) <= 0.001) structure = target;
    else structure += (target - structure) * Math.min(1, dt * 6);
    const changing = Math.abs(target - structure) > 0;
    const interval = mobile.matches ? 1000 / 30 : 1000 / 60;
    if (dirty || now - lastPaint >= interval - 0.7) {
      paint();
      lastPaint = now;
    }
    if (active || (changing && visible && !document.hidden)) requestTick();
  }

  function sync() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    dirty = true;
    requestTick();
  }

  function setPaused(value) {
    paused = Boolean(value);
    pause.setAttribute('aria-pressed', String(paused));
    pauseLabel.textContent = paused ? 'Reanudar' : 'Pausar';
    pause.setAttribute(
      'aria-label',
      paused ? 'Reanudar animación automática' : 'Pausar animación automática',
    );
    sync();
  }

  function syncStructure() {
    showStructure = structureSelected || hovered;
    structureButton.setAttribute('aria-pressed', String(structureSelected));
    track.classList.toggle('is-structure', showStructure);
    if (noMotion()) structure = showStructure ? 1 : 0;
    dirty = true;
    requestTick();
  }

  function setStructure(value) {
    structureSelected = Boolean(value);
    syncStructure();
  }

  on(pause, 'click', () => setPaused(!paused));
  on(structureButton, 'click', () => setStructure(!structureSelected));
  on(art, 'pointerenter', (event) => {
    if (!fine.matches || event.pointerType === 'touch' || progress > 0.08)
      return;
    hovered = true;
    syncStructure();
  });
  on(art, 'pointerleave', () => {
    hovered = false;
    syncStructure();
  });
  on(
    stage,
    'pointermove',
    (event) => {
      if (!fine.matches || event.pointerType === 'touch' || !canAnimate())
        return;
      aim.x = clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
      aim.y = clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1);
    },
    { passive: true },
  );
  on(
    stage,
    'pointerleave',
    () => {
      aim = { x: 0, y: 0 };
    },
    { passive: true },
  );
  on(
    window,
    'scroll',
    () => {
      if (document.documentElement.classList.contains('nav-open')) return;
      readScroll();
      if (hovered && progress > 0.08) {
        hovered = false;
        syncStructure();
      }
      dirty = true;
      if (visible) requestTick();
    },
    { passive: true },
  );
  on(track, 'focusin', (event) => {
    if (progress > 0.05 && event.target.matches?.(':focus-visible')) {
      // Restore the control before native focus scrolling reads its bounds.
      progress = 0;
      exitView.paint(0, runway > 0);
      onRequestScroll(top + delay);
      dirty = true;
      requestTick();
    }
  });
  on(window, 'resize', scheduleMeasure, { passive: true });
  on(document, 'visibilitychange', sync);
  for (const query of [reduced, forced, mobile])
    on(query, 'change', scheduleMeasure);
  const observer = new IntersectionObserver(
    (entries) => {
      visible = Boolean(
        entries[0]?.isIntersecting && entries[0].intersectionRatio > 0.01,
      );
      if (visible) readScroll();
      sync();
    },
    { threshold: [0, 0.01] },
  );
  observer.observe(stage);
  const resize = new ResizeObserver(scheduleMeasure);
  resize.observe(stage);
  pause.hidden = structureButton.hidden = false;
  measure();
  paint();
  requestTick();
  document.fonts?.ready.then(() => {
    if (alive) scheduleMeasure();
  });

  return {
    setPaused,
    setStructure,
    getState: () => ({
      paused,
      visible,
      reduced: noMotion(),
      showStructure,
      progress,
      pinned: runway > 0,
      height,
      runway,
      delay,
      overlap,
      frames,
    }),
    destroy() {
      if (!alive) return;
      alive = false;
      abort.abort();
      observer.disconnect();
      resize.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(layoutRaf);
      delete track.dataset.mounted;
      track.classList.remove('is-pinned', 'is-structure');
      track.style.removeProperty('--ensamble-stage-h');
      track.style.removeProperty('--ensamble-runway');
      track.style.removeProperty('--ensamble-pin-top');
      track.style.removeProperty('--ensamble-overlap');
      exitView.destroy();
      pause.hidden = structureButton.hidden = true;
    },
  };
}
