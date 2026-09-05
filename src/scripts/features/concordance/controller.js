import { createDrift, planDriftFrame } from './drift.js';
import { MosaicView } from './view.js';
import { VisibleTimers } from './visible-timers.js';
import { coverGeometry, visibleRoots, randomRoot } from './ambient.js';

const mounted = new WeakMap();
const interactive = 'a,button,input,textarea,select,[contenteditable="true"]';

/** One visible clock carries a conserved pair of defects from cell to cell. */
export function mountMosaic({ svg, state, scope, gsap }) {
  if (mounted.has(svg)) return mounted.get(svg);
  let flow = createDrift(state);
  const view = new MosaicView(svg, state);
  const timers = new VisibleTimers();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)');
  const abort = new AbortController();
  const options = { passive: true, signal: abort.signal };
  let alive = true, visible = false, suspended = false, paused = false, tween = null;
  let plan = null, hover = -1, press = null, focus = -1, focusSteps = 0, started = false;
  let lastRequest = -Infinity;
  const sourceCount = state.config.width > 8 ? 3 : 2;

  const allowed = () => alive && visible && !document.hidden && !suspended && !paused;
  function synchronize() {
    const active = allowed() && !reduced.matches;
    timers.setActive(active);
    if (active) {
      if (tween) tween.play();
      else if (started) advance();
    }
    else tween?.pause();
  }

  function visibleCells() {
    const rect = svg.getBoundingClientRect();
    const clip = { left: Math.max(0, rect.left), top: Math.max(0, rect.top),
      right: Math.min(window.innerWidth, rect.right), bottom: Math.min(window.innerHeight, rect.bottom) };
    return visibleRoots(coverGeometry(rect, state.config), state.config, clip);
  }

  function recompose() {
    return request(randomRoot(visibleCells(), focus));
  }

  function finish() {
    if (!alive || !plan) return;
    state = plan.target;
    flow = plan.flow;
    tween?.kill();
    tween = null;
    plan = null;
    view.commit(state);
    if (focusSteps > 0) focusSteps--;
    advance();
  }

  function advance(origin) {
    if (!allowed() || reduced.matches || plan) return false;
    const roots = visibleCells();
    if (!roots.length) return false;
    const root = origin ?? (flow.defects.length ? 0 : randomRoot(roots, -1));
    const next = planDriftFrame(flow, { root, roots, sourceCount,
      focus: focusSteps > 0 ? focus : -1 });
    if (!next.accepted) return false;
    timers.clear('ambient');
    started = true;
    plan = next;
    svg.dataset.origin = next.root;
    const duration = view.prepare(next);
    const cursor = { time: 0 };
    tween = gsap.to(cursor, {
      time: duration, duration, paused: true, ease: 'none',
      onUpdate: () => view.paint(cursor.time), onComplete: finish,
    });
    tween.play();
    return true;
  }

  function request(root) {
    if (!allowed() || reduced.matches || !Number.isInteger(root) || root < 0 || root >= state.cells.length) return false;
    if (performance.now() - lastRequest < 600) return false;
    lastRequest = performance.now();
    focus = root;
    focusSteps = 14;
    if (!plan) advance(root);
    return true;
  }

  function hit(event) {
    if (event.target.closest?.(interactive)) return -1;
    // Leave copy selection and normal page interactions untouched.
    if (event.target.closest?.('.home-hero__title, .home-hero__intro')) return -1;
    const rect = svg.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return -1;
    if (event.clientX < rect.left || event.clientX >= rect.right || event.clientY < rect.top || event.clientY >= rect.bottom) return -1;
    const geometry = coverGeometry(rect, state.config);
    const x = Math.floor((event.clientX - geometry.left) / geometry.cell);
    const y = Math.floor((event.clientY - geometry.top) / geometry.cell);
    return y * state.config.width + x;
  }

  scope.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || event.buttons || reduced.matches || !allowed()) return;
    const root = hit(event);
    if (root === hover) return;
    hover = root;
    timers.clear('hover');
    if (root >= 0) timers.set('hover', () => request(root), 110);
  }, options);
  scope.addEventListener('pointerleave', () => {
    hover = -1;
    timers.clear('hover');
  }, options);
  scope.addEventListener('pointerdown', event => {
    press = { x: event.clientX, y: event.clientY, id: event.pointerId, root: hit(event) };
  }, options);
  scope.addEventListener('pointerup', event => {
    if (press && press.id === event.pointerId && press.root >= 0 &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) < 9 && hit(event) === press.root) {
      request(press.root);
    }
    press = null;
  }, options);
  scope.addEventListener('pointercancel', () => { press = null; }, options);
  document.addEventListener('visibilitychange', synchronize, { signal: abort.signal });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      for (const key of ['ambient', 'hover']) timers.clear(key);
      focusSteps = 0;
      if (plan) finish();
    } else if (!started) timers.set('ambient', advance, 2000 + Math.random() * 1000);
    synchronize();
  }, { signal: abort.signal });

  const observer = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting && entries[0].intersectionRatio >= .35;
    if (!visible) { hover = -1; timers.clear('hover'); }
    synchronize();
  }, { threshold: [0, .35] });
  observer.observe(svg);

  if (!reduced.matches) timers.set('ambient', advance, 2000 + Math.random() * 1000);

  const api = {
    recompose,
    setPaused(value) { paused = Boolean(value); synchronize(); },
    suspend(value) { suspended = Boolean(value); synchronize(); },
    destroy() {
      if (!alive) return;
      alive = false;
      abort.abort();
      observer.disconnect();
      timers.destroy();
      tween?.kill();
      tween = null;
      plan = null;
      view.commit(state);
      mounted.delete(svg);
    },
  };
  mounted.set(svg, api);
  return api;
}
