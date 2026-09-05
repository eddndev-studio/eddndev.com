import assert from 'node:assert/strict';
import test from 'node:test';
import { gsap } from 'gsap';
import { createHeroTimeline, getHeroTilePose, getHeroScrollConfig } from '../src/scripts/animations/services-hero-motion.js';

function scene(t) {
  const tiles = Array.from({ length: 16 }, (_, i) => ({ ...getHeroTilePose(i), x: 0, y: 0 }));
  const assembly = { rotation: 0 };
  const asterisk = { rotation: 0 };
  const timeline = createHeroTimeline(gsap, { tiles, assembly, asterisk });
  t.after(() => { timeline.kill(); gsap.ticker.sleep(); });
  return { tiles, assembly, asterisk, timeline };
}

const snapshot = ({ tiles, assembly, asterisk }) => [
  ...tiles.flatMap(tile => [tile.xPercent, tile.yPercent, tile.rotation]),
  assembly.rotation, asterisk.rotation,
];

test('the first pixels of scroll retain exactly the server-rendered composition', (t) => {
  const s = scene(t);
  s.timeline.progress(0);
  const initial = snapshot(s);
  s.timeline.progress(.015);
  assert.deepEqual(snapshot(s), initial);
  s.tiles.forEach((tile, i) => {
    const pose = getHeroTilePose(i);
    assert.equal(tile.xPercent, pose.xPercent);
    assert.equal(tile.yPercent, pose.yPercent);
    assert.equal(tile.rotation, pose.rotation);
  });
});

test('refreshing midway does not turn the current pose into a new starting pose', (t) => {
  const s = scene(t);
  s.timeline.progress(.47);
  const before = snapshot(s);
  s.timeline.invalidate().progress(.47);
  assert.deepEqual(snapshot(s), before);
  s.timeline.progress(0);
  s.tiles.forEach((tile, i) => assert.equal(tile.rotation, getHeroTilePose(i).rotation));
  assert.equal(s.assembly.rotation, 0);
});

test('assembly finishes before release and its final pose stays still during the exit', (t) => {
  const s = scene(t);
  s.timeline.progress(.85);
  const complete = snapshot(s);
  assert.equal(s.assembly.rotation, 90);
  s.tiles.forEach(tile => {
    assert.equal(tile.xPercent, 0);
    assert.equal(tile.yPercent, 0);
  });
  s.timeline.progress(1);
  assert.deepEqual(snapshot(s), complete);
  s.timeline.progress(.99);
  assert.deepEqual(snapshot(s), complete);
});

test('a hero taller than the viewport still holds its composition until the animation ends', () => {
  const hero = { offsetHeight: 956 };
  let height = 900;
  const config = getHeroScrollConfig(hero, () => height);
  assert.equal(config.pin, true);
  assert.equal(config.start, 'clamp(bottom bottom)');
  assert.equal(config.scrub, true);
  assert.equal(config.invalidateOnRefresh, undefined);
  assert.equal(config.end(), '+=990');
  height = 740;
  assert.equal(config.end(), '+=814');
  assert.equal(config.pin, true);
});
