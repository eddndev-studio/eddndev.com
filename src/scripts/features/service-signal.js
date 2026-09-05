const patterns = [
  [[1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 1, 0], [1, 0, 0, 1]],
  [[0, 1, 1, 0], [1, 0, 0, 1], [1, 0, 0, 1], [0, 1, 1, 0]],
];

/** A small, lazy Ledding accent. Each scroll entry plays one bounded burst. */
export function mountServiceSignal(root, loadLedding = () => import('ledding')) {
  let instance;
  let pending;
  let disposed = false;
  let playing = false;
  let timer;
  let phase = 0;

  function stop() {
    playing = false;
    clearTimeout(timer);
    instance?.pause();
  }

  async function play() {
    if (disposed) return;
    playing = true;
    if (!instance) {
      pending ??= loadLedding();
      try {
        const { Ledding, CircleRenderer, CenterAligner, Pattern } = await pending;
        if (disposed || !playing) return;
        // Multiple observer notifications may await the same module.
        if (!instance) {
          const color = getComputedStyle(root).color;
          instance = new Ledding(`#${root.id}`, {
            artPattern: patterns[0],
            ledSize: 5,
            ledGap: 5,
            scaleToFit: true,
            pixelRatio: 'auto',
            renderer: CircleRenderer,
            aligner: CenterAligner,
            colors: { background: null, base: color, states: { 1: color } },
            opacities: { base: { min: .18, max: .18 }, active: 1 },
            animation: {
              scroll: { speed: 0 },
              ignition: { pattern: Pattern.CASCADE, delay: 0 },
              extinction: { pattern: Pattern.CASCADE, delay: 0 },
            },
            transitions: {
              ignition: { duration: 280, easing: 'ease-out-cubic' },
              extinction: { duration: 280, easing: 'ease-out-cubic' },
              morph: { duration: 280, easing: 'ease-out-cubic' },
            },
            fps: 30,
            grid: { fill: true },
          });
          instance.canvas.setAttribute('aria-hidden', 'true');
          instance.on('afterDraw', () => root.setAttribute('data-enhanced', ''));
          instance.on('resize', () => root.removeAttribute('data-enhanced'));
        }
      } catch {
        root.removeAttribute('data-enhanced');
        return;
      }
    }
    phase = (phase + 1) % patterns.length;
    instance.setPattern(patterns[phase], { strategy: 'morph', duration: 400 });
    instance.resume();
    clearTimeout(timer);
    timer = setTimeout(stop, 900);
  }

  return {
    play,
    stop,
    destroy() {
      disposed = true;
      stop();
      instance?.destroy();
      root.removeAttribute('data-enhanced');
    },
  };
}
