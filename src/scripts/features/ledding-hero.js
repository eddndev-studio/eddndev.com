import { Ledding, RightAligner, CenterAligner, CircleRenderer, Directions, Pattern } from 'ledding';
import { logoPattern, chatPattern, dbCylinderPattern } from '../ledding-patterns.js';
import { onPageCleanup } from '../core/lifecycle';
import { prefersReduced } from '../core/dom';

/**
 * LED matrix backgrounds (brand signature — keep these configs tuned).
 * Instances are registered and destroy()ed on page swap so their canvases,
 * rAF loops and window listeners never accumulate across navigations.
 */

const CONFIGS = {
  '#ledding-animation-container': {
    ledSize: 25, ledGap: 4, scaleToFit: false,
    artPattern: logoPattern, aligner: RightAligner, renderer: CircleRenderer,
    colors: {
      background: 'rgba(20, 24, 32, 0)',
      base: 'rgba(45, 55, 72, 1)',
      states: { 1: 'rgba(200, 149, 255, 1)', 2: 'rgba(167, 86, 255, 1)', 3: 'rgba(167, 86, 255, 1)' },
    },
    sizes: { states: { 1: 1.0, 2: 0.7, 3: 0.4 } },
    fps: 30,
    animation: {
      scroll: { direction: Directions.TO_LEFT, speed: 15 },
      ignition: { pattern: Pattern.CASCADE, direction: Directions.TO_BOTTOM, delay: 0.5 },
      extinction: { pattern: Pattern.CASCADE, delay: 1.1, direction: Directions.TO_TOP, step: 8 },
    },
    transitions: { ignition: { min: 0.05 }, extinction: { min: 0.1 }, morph: { min: 0.1 } },
    grid: { fill: false, lifespan: 60 },
  },

  '#ledding-cta-container': {
    ledSize: 26, ledGap: 7, scaleToFit: false,
    artPattern: chatPattern, aligner: CenterAligner, renderer: CircleRenderer,
    colors: {
      background: 'rgba(106, 13, 173, 1)', // #6A0DAD — section bg, the lib paints it opaque
      base: 'rgba(255, 255, 255, 0.10)',
      states: { 1: 'rgba(255, 255, 255, 1)', 2: 'rgba(233, 213, 255, 0.95)', 3: 'rgba(192, 132, 252, 0.9)' },
    },
    sizes: { states: { 1: 1.0, 2: 0.7, 3: 0.45 } },
    fps: 30,
    animation: {
      scroll: { direction: Directions.TO_LEFT, speed: 10 },
      ignition: { pattern: Pattern.CASCADE, direction: Directions.TO_BOTTOM, delay: 0.4 },
      extinction: { pattern: Pattern.CASCADE, delay: 1.0, direction: Directions.TO_TOP, step: 8 },
    },
    transitions: { ignition: { min: 0.05 }, extinction: { min: 0.1 }, morph: { min: 0.1 } },
    grid: { fill: false, lifespan: 60 },
  },

  '#ledding-project-container': {
    ledSize: 30, ledGap: 8, scaleToFit: false,
    artPattern: logoPattern, aligner: RightAligner, renderer: CircleRenderer,
    colors: {
      background: 'rgba(0, 0, 0, 0)',
      base: 'rgba(255, 255, 255, 0.03)',
      states: { 1: 'rgba(139, 92, 246, 1)', 2: 'rgba(168, 85, 247, 0.8)', 3: 'rgba(192, 132, 252, 0.5)' },
    },
    sizes: { states: { 1: 0.8, 2: 0.5, 3: 0.2 } },
    fps: 24,
    animation: {
      scroll: { direction: Directions.TO_LEFT, speed: 5 },
      ignition: { pattern: Pattern.RANDOM, delay: 0.2 },
      extinction: { pattern: Pattern.RANDOM, delay: 0.1 },
    },
    grid: { fill: true, lifespan: 120 },
  },

  '#ledding-work-container': {
    ledSize: 20, ledGap: 6, scaleToFit: false,
    artPattern: dbCylinderPattern, aligner: RightAligner, renderer: CircleRenderer,
    colors: {
      background: 'rgba(0, 0, 0, 0)',
      base: 'rgba(30, 20, 40, 1)',
      states: { 1: 'rgba(139, 92, 246, 1)', 2: 'rgba(168, 85, 247, 0.8)', 3: 'rgba(192, 132, 252, 0.5)' },
    },
    sizes: { states: { 1: 0.8, 2: 0.5, 3: 0.2 } },
    fps: 24,
    animation: {
      scroll: { direction: Directions.TO_BOTTOM, speed: 8 },
      ignition: { pattern: Pattern.WAVE, delay: 0.1, direction: Directions.TO_BOTTOM },
      extinction: { pattern: Pattern.RANDOM, delay: 0.1 },
    },
    grid: { fill: true, lifespan: 100 },
  },

  '#ledding-contact-container': {
    ledSize: 25, ledGap: 4, scaleToFit: false,
    artPattern: logoPattern, aligner: CenterAligner, renderer: CircleRenderer,
    colors: {
      background: 'rgba(20, 24, 32, 0)',
      base: 'rgba(45, 55, 72, 1)',
      states: { 1: 'rgba(200, 149, 255, 1)', 2: 'rgba(167, 86, 255, 1)', 3: 'rgba(167, 86, 255, 1)' },
    },
    sizes: { states: { 1: 1.0, 2: 0.7, 3: 0.4 } },
    fps: 30,
    animation: {
      scroll: { direction: Directions.TO_LEFT, speed: 15 },
      ignition: { pattern: Pattern.CASCADE, direction: Directions.TO_BOTTOM, delay: 0.5 },
      extinction: { pattern: Pattern.CASCADE, delay: 1.1, direction: Directions.TO_TOP, step: 8 },
    },
    transitions: { ignition: { min: 0.05 }, extinction: { min: 0.1 }, morph: { min: 0.1 } },
    grid: { fill: false, lifespan: 60 },
  },

  '#ledding-services-container': {
    ledSize: 22, ledGap: 5, scaleToFit: false,
    artPattern: logoPattern, aligner: RightAligner, renderer: CircleRenderer,
    colors: {
      background: 'rgba(0, 0, 0, 0)',
      base: 'rgba(35, 25, 55, 1)',
      states: { 1: 'rgba(168, 85, 247, 1)', 2: 'rgba(139, 92, 246, 0.8)', 3: 'rgba(192, 132, 252, 0.5)' },
    },
    sizes: { states: { 1: 0.9, 2: 0.6, 3: 0.3 } },
    fps: 28,
    animation: {
      scroll: { direction: Directions.TO_LEFT, speed: 12 },
      ignition: { pattern: Pattern.WAVE, direction: Directions.TO_RIGHT, delay: 0.3 },
      extinction: { pattern: Pattern.CASCADE, delay: 0.9, direction: Directions.TO_BOTTOM, step: 6 },
    },
    transitions: { ignition: { min: 0.05 }, extinction: { min: 0.08 }, morph: { min: 0.08 } },
    grid: { fill: false, lifespan: 70 },
  },

  '#ledding-profile-container': {
    ledSize: 22, ledGap: 5, scaleToFit: false,
    artPattern: logoPattern, aligner: RightAligner, renderer: CircleRenderer,
    colors: {
      background: 'rgba(0, 0, 0, 0)',
      base: 'rgba(40, 20, 60, 1)',
      states: { 1: 'rgba(168, 85, 247, 1)', 2: 'rgba(139, 92, 246, 0.9)', 3: 'rgba(192, 132, 252, 0.6)' },
    },
    sizes: { states: { 1: 1.0, 2: 0.7, 3: 0.35 } },
    fps: 30,
    animation: {
      scroll: { direction: Directions.TO_LEFT, speed: 10 },
      ignition: { pattern: Pattern.WAVE, direction: Directions.TO_RIGHT, delay: 0.3 },
      extinction: { pattern: Pattern.CASCADE, delay: 0.8, direction: Directions.TO_BOTTOM, step: 6 },
    },
    transitions: { ignition: { min: 0.05 }, extinction: { min: 0.08 }, morph: { min: 0.08 } },
    grid: { fill: false, lifespan: 80 },
  },

  '#ledding-hero-message': {
    ledSize: 20, ledGap: 4, scaleToFit: false,
    artPattern: chatPattern, aligner: CenterAligner, renderer: CircleRenderer,
    colors: {
      background: 'rgba(20, 24, 32, 0)',
      base: 'rgba(45, 55, 72, 1)',
      states: { 1: 'rgba(200, 149, 255, 1)', 2: 'rgba(167, 86, 255, 1)', 3: 'rgba(167, 86, 255, 1)' },
    },
    sizes: { states: { 1: 1.0, 2: 0.6, 3: 0.3 } },
    fps: 20,
    animation: {
      scroll: { direction: Directions.TO_LEFT, speed: 0 },
      ignition: { pattern: Pattern.RANDOM, delay: 0.5 },
      extinction: { pattern: Pattern.RANDOM, delay: 4.0, step: 2 },
    },
    grid: { fill: false },
  },
};

export default function initLeddingHero() {
  const instances = [];
  const reduced = prefersReduced();

  Object.entries(CONFIGS).forEach(([selector, config]) => {
    if (!document.querySelector(selector)) return;
    const opts = reduced
      ? {
          ...config,
          fps: 6,
          animation: { ...config.animation, scroll: { ...config.animation.scroll, speed: 0 } },
        }
      : config;
    instances.push(new Ledding(selector, opts));
  });

  if (instances.length) {
    onPageCleanup(() => instances.forEach((i) => { try { i.destroy(); } catch { /* already gone */ } }));
  }
}
