import { createFooterFilm, getFooterFilmProfile } from './footer-film.js';

export function mountFooterSignal(signal, loadLedding = () => import('ledding')) {
  const surface = signal.querySelector('[data-footer-signal-surface]');
  const toggle = signal.parentElement.querySelector('[data-footer-motion]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = window.matchMedia('(forced-colors: active)');
  let profile = getFooterFilmProfile(surface.getBoundingClientRect().width);
  let instance = null;
  let pending = false;
  let disposed = false;
  let nearby = false;
  let visible = false;
  let userPaused = false;

  const staticOnly = () => motion.matches || contrast.matches;

  function syncPlayback() {
    if (disposed) return;
    toggle.hidden = !instance || staticOnly();
    toggle.setAttribute('aria-pressed', String(userPaused));
    if (staticOnly()) {
      instance?.pause();
      signal.classList.remove('is-enhanced');
      signal.dataset.signalState = 'static';
    } else if (instance) {
      const playing = visible && !document.hidden && !userPaused;
      if (playing) instance.resume();
      else instance.pause();
      signal.dataset.signalState = playing ? 'running' : 'paused';
    } else if (nearby || visible) {
      createInstance();
    }
  }

  function revealCanvas() {
    if (!disposed && !staticOnly()) signal.classList.add('is-enhanced');
  }

  // Ledding clears and rebuilds its canvas on resize, even while paused.
  function showFallback() {
    signal.classList.remove('is-enhanced');
  }

  function destroyInstance() {
    instance?.off('afterDraw', revealCanvas);
    instance?.off('resize', showFallback);
    instance?.destroy();
    instance = null;
    showFallback();
  }

  async function createInstance() {
    if (instance || pending || disposed || staticOnly()) return;
    pending = true;
    try {
      const { Ledding, CircleRenderer, CenterAligner, Directions, Pattern } = await loadLedding();
      if (disposed || staticOnly()) return;
      profile = getFooterFilmProfile(surface.getBoundingClientRect().width);
      instance = new Ledding(`#${surface.id}`, {
        artPattern: createFooterFilm(profile),
        ledSize: profile.ledSize,
        ledGap: profile.pitch - profile.ledSize,
        scaleToFit: true,
        pixelRatio: 'auto',
        renderer: CircleRenderer,
        aligner: CenterAligner,
        colors: {
          background: null,
          base: profile.colors[1],
          states: profile.colors,
        },
        sizes: { states: profile.sizes },
        opacities: { base: { min: 0, max: 0 }, active: 1 },
        fps: 30,
        // Ledding measures delays in update frames. Keep both sequences bounded
        // so moving LEDs can finish their transitions before crossing the film.
        animation: {
          scroll: { direction: Directions.TO_LEFT, speed: profile.speed },
          ignition: {
            pattern: Pattern.CASCADE,
            direction: Directions.TO_BOTTOM,
            delay: profile.ignitionDelay,
          },
          extinction: {
            pattern: Pattern.CASCADE,
            direction: Directions.TO_TOP,
            delay: profile.extinctionDelay,
          },
        },
        transitions: {
          ignition: { duration: profile.ignitionDuration, easing: 'ease-out-cubic' },
          extinction: { duration: profile.extinctionDuration, easing: 'ease-out-quad' },
          morph: { duration: profile.morphDuration, easing: 'ease-in-out-cubic' },
        },
        grid: { fill: true },
      });
      instance.canvas.setAttribute('aria-hidden', 'true');
      instance.on('afterDraw', revealCanvas);
      instance.on('resize', showFallback);
      syncPlayback();
    } catch {
      destroyInstance();
      toggle.hidden = true;
    } finally {
      pending = false;
    }
  }

  const loadObserver = new IntersectionObserver(([entry]) => {
    nearby = Boolean(entry?.isIntersecting);
    if (nearby) syncPlayback();
  }, { rootMargin: '400px 0px' });
  const playObserver = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    syncPlayback();
  }, { threshold: 0 });
  const resizeObserver = new ResizeObserver(() => {
    if (disposed) return;
    const nextProfile = getFooterFilmProfile(surface.getBoundingClientRect().width);
    if (nextProfile === profile) return;
    profile = nextProfile;
    destroyInstance();
    syncPlayback();
  });

  function togglePlayback() {
    userPaused = !userPaused;
    syncPlayback();
  }

  loadObserver.observe(signal);
  playObserver.observe(signal);
  resizeObserver.observe(surface);
  motion.addEventListener('change', syncPlayback);
  contrast.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  toggle.addEventListener('click', togglePlayback);
  syncPlayback();

  return () => {
    if (disposed) return;
    disposed = true;
    loadObserver.disconnect();
    playObserver.disconnect();
    resizeObserver.disconnect();
    motion.removeEventListener('change', syncPlayback);
    contrast.removeEventListener('change', syncPlayback);
    document.removeEventListener('visibilitychange', syncPlayback);
    toggle.removeEventListener('click', togglePlayback);
    destroyInstance();
    toggle.hidden = true;
  };
}
