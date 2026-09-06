import { getExitPhases, getLayerDeparture, getSceneDeparture } from './exit.js';
import { createDrawingView } from './drawing-view.js';

export function createExitView(track, next) {
  const stage = track.querySelector('.ensamble-stage');
  const art = track.querySelector('.ensamble-sculpture');
  const object = track.querySelector('.ensamble-object-stage');
  const copy = ['.ensamble-eyebrow', '.ensamble-title', '.ensamble-bottom'].map(
    (selector) => track.querySelector(selector),
  );
  const details = ['.ensamble-details', '.ensamble-foot'].map((selector) =>
    track.querySelector(selector),
  );
  const rule = track.querySelector('.ensamble-exit-rule');
  const drawing = createDrawingView(track);
  if (next) next.dataset.ensambleNext = 'true';
  let geometry;

  return {
    measure({ pinTop, height }) {
      const stageRect = stage.getBoundingClientRect();
      const artRect = art.getBoundingClientRect();
      const scale = Math.min(object.offsetWidth, object.offsetHeight) / 720;
      geometry = {
        width: stage.clientWidth,
        height,
        svg: {
          x:
            artRect.left -
            stageRect.left +
            object.offsetLeft +
            (object.offsetWidth - scale * 720) / 2,
          y:
            artRect.top -
            stageRect.top +
            pinTop +
            object.offsetTop +
            (object.offsetHeight - scale * 720) / 2,
          scale,
        },
      };
      drawing.measure(geometry);
    },
    layer(index, progress, count) {
      return getLayerDeparture({ ...geometry, index, progress, count });
    },
    paint(progress, enabled) {
      drawing.paint(progress, enabled);
      const phases = getExitPhases(progress);
      const motion = getSceneDeparture({ ...geometry, progress });
      for (const element of copy)
        element.style.transform = `translate3d(${motion.copyX}px, 0, 0)`;
      for (const element of details)
        element.style.transform = `translate3d(${motion.detailsX}px, ${motion.detailsY}px, 0)`;
      object.style.transform = `translate3d(${motion.objectX}px, ${motion.objectY}px, 0)`;
      rule.style.opacity = String(1 - phases.copy);
      track.style.setProperty(
        '--ensamble-guides-exit',
        String(1 - phases.details),
      );
      track.classList.toggle('is-departing', enabled && progress > 0.08);
      if (next) next.style.opacity = String(enabled ? phases.next : 1);
    },
    destroy() {
      drawing.destroy();
      for (const element of [...copy, ...details, object])
        element.style.removeProperty('transform');
      rule.style.removeProperty('opacity');
      track.style.removeProperty('--ensamble-guides-exit');
      track.classList.remove('is-departing');
      next?.style.removeProperty('opacity');
      if (next) delete next.dataset.ensambleNext;
    },
  };
}
