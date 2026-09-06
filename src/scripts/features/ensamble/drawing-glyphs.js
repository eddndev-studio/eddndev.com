/** Generate tooth outlines once at build time; the page only draws their strokes. */
function gear(cx, cy, root, tip, teeth, phase) {
  const pitch = Math.PI * 2 / teeth;
  const points = Array.from({ length: teeth }, (_, index) =>
    [[-.5, root], [-.3, root], [-.2, tip], [.2, tip], [.3, root]].map(([offset, radius]) => {
      const angle = phase + (index + offset) * pitch;
      return `${(cx + Math.cos(angle) * radius).toFixed(2)} ${(cy + Math.sin(angle) * radius).toFixed(2)}`;
    }),
  ).flat();
  return `M${points.join('L')}Z`;
}

export const driveGear = gear(-34, -22, 49, 61, 10, Math.PI / 6);
export const drivenGear = gear(42.21, 22, 27, 39, 6, Math.PI * 4 / 3);
