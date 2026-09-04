import { onPageCleanup } from '../core/lifecycle';
import { mountFooterSignal } from './footer-signal-runtime.js';

export default function initFooterSignal() {
  const signal = document.querySelector('[data-footer-signal]');
  if (signal) onPageCleanup(mountFooterSignal(signal));
}
