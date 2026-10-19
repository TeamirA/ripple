import { html } from '../utils/escapeHtml.js';
import { createElement } from '../utils/dom.js';
import { icon } from './icons.js';

const DEFAULT_DURATION_MS = 4000;

function dismissToast(toast) {
  toast.classList.add('is-leaving');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  setTimeout(() => toast.remove(), 400);
}

/**
 * Shows a transient message in the polite live region.
 * @param {string} message
 * @param {{ type?: 'info' | 'success' | 'error', durationMs?: number }} [options]
 */
export function showToast(message, { type = 'info', durationMs = DEFAULT_DURATION_MS } = {}) {
  const region = document.getElementById('toast-region');
  const toast = createElement(html`
    <div class="toast toast--${type}">
      <span class="toast__message">${message}</span>
      <button class="toast__close" type="button" aria-label="Dismiss notification">
        ${icon('close')}
      </button>
    </div>
  `);
  toast.querySelector('.toast__close').addEventListener('click', () => dismissToast(toast));
  region.append(toast);
  setTimeout(() => dismissToast(toast), durationMs);
}

export function showErrorToast(error) {
  showToast(error?.message ?? 'Something went wrong. Please try again.', { type: 'error' });
}
