import { smooth } from './model.js';

export function getMaterialReveal({ structure = 0, progress = 0 }) {
  return Math.max(structure, smooth(0.12, 0.65, progress));
}

export function createLayerMaterial(layers) {
  const faces = layers.map(layer => Array.from(layer.querySelectorAll('use')));
  let painted = -1;
  return {
    paint(state) {
      const reveal = getMaterialReveal(state);
      if (reveal === painted || (Math.abs(reveal - painted) <= 0.002 && reveal !== 0 && reveal !== 1)) return;
      layers.forEach((layer, index) => {
        const front = index === layers.length - 1;
        layer.style.opacity = String(index % 3 === 0 || front ? 1 : 1 - reveal * 0.91);
        for (const face of faces[index]) {
          face.setAttribute('fill-opacity', (1 - reveal * (front ? 0.985 : 0.96)).toFixed(3));
          face.setAttribute('stroke-opacity', (0.67 + reveal * 0.21).toFixed(3));
          face.setAttribute('stroke', reveal > 0 ? '#a398e8' : '#a58fce');
        }
      });
      painted = reveal;
    },
  };
}
