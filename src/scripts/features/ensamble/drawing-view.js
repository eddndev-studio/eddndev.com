import { matrix } from './model.js';
import { getDrawingLayout, getDrawingPhases } from './drawing-model.js';

export function createDrawingView(track) {
  const root = track.querySelector('.ensamble-drawing');
  const pathNames = ['datum', 'toEngineering', 'toProduct'];
  const paths = Object.fromEntries(pathNames.map(name => [name, root.querySelector(`[data-drawing-path="${name}"]`)]));
  const views = Object.fromEntries(['design', 'engineering', 'product'].map(name => [name, root.querySelector(`[data-drawing-view="${name}"]`)]));
  const labels = Object.fromEntries(['design', 'engineering', 'product'].map(name => [name, root.querySelector(`[data-drawing-label="${name}"]`)]));
  let painted = -1;
  return {
    measure({ width, height }) {
      const layout = getDrawingLayout({ width, height });
      root.setAttribute('viewBox', `0 0 ${width} ${height}`);
      root.style.height = `${height}px`;
      for (const [name, path] of Object.entries(paths)) path.setAttribute('d', layout.paths[name]);
      for (const [name, view] of Object.entries(views)) {
        view.setAttribute('transform', matrix(layout.transforms[name]));
        // Preserve stroke weight while letting normalized dash lengths scale with the drawing.
        view.style.setProperty('--drawing-stroke', String(0.8 / layout.transforms[name][0]));
      }
      for (const [name, label] of Object.entries(labels)) {
        label.setAttribute('x', layout.labels[name][0]);
        label.setAttribute('y', layout.labels[name][1]);
      }
    },
    paint(progress, enabled) {
      const position = enabled ? progress : 0;
      if (painted === position) return;
      const phases = getDrawingPhases(position);
      for (const [name, value] of Object.entries(phases)) root.style.setProperty(`--drawing-${name}`, String(value));
      painted = position;
    },
    destroy() {
      for (const name of ['opacity', 'design', 'engineering', 'product']) root.style.removeProperty(`--drawing-${name}`);
      root.style.removeProperty('height');
      for (const view of Object.values(views)) view.style.removeProperty('--drawing-stroke');
    },
  };
}
