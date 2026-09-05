/** Serialize layout work; an obsolete page or resize must never restore scroll. */
export function createLayoutCoordinator(driver) {
  let revision = 0;
  return {
    cancel() { revision++; },
    async run(request) {
      const current = ++revision;
      const stale = () => current !== revision;
      driver.show(request);
      try {
        await driver.ready();
        if (stale()) return;
        driver.rebuild(request);
        await driver.frame();
        if (stale()) return;
        driver.measure();
        await driver.frame();
        if (stale()) return;
        driver.restore(request);
        await driver.frame();
      } catch (error) {
        if (!stale()) driver.fail(error, request);
      } finally {
        if (!stale()) driver.reveal();
      }
    },
  };
}

export function isCriticalResize(previous, next, typing = false, coarsePointer = false) {
  if (Math.abs(next.width - previous.width) > 1) return true;
  if (typing) return false;
  if (!coarsePointer && Math.abs(next.height - previous.height) > 1) return true;
  if (Math.abs(next.height - previous.height) >= 120) return true;
  return [640, 700].some(height => (previous.height >= height) !== (next.height >= height));
}
