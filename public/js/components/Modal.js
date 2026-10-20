import { html } from '../utils/escapeHtml.js';
import { createElement } from '../utils/dom.js';
import { icon } from './icons.js';

/**
 * Opens an accessible modal built on <dialog>: focus is trapped and restored,
 * Escape and backdrop clicks close it.
 * @param {{ title: string, body: import('../utils/escapeHtml.js').SafeHtml, onClose?: () => void }} options
 * @returns {{ element: HTMLDialogElement, close: () => void }}
 */
export function openModal({ title, body, onClose }) {
  const previouslyFocused = document.activeElement;
  const dialog = createElement(html`
    <dialog class="modal" aria-labelledby="modal-title">
      <div class="modal__panel">
        <header class="modal__header">
          <h2 class="modal__title" id="modal-title">${title}</h2>
          <button class="icon-button" type="button" data-modal-close aria-label="Close">
            ${icon('close')}
          </button>
        </header>
        <div class="modal__body">${body}</div>
      </div>
    </dialog>
  `);

  const close = () => dialog.close();
  dialog.addEventListener('close', () => {
    dialog.remove();
    previouslyFocused?.focus?.();
    onClose?.();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-modal-close]')) close();
  });

  document.body.append(dialog);
  dialog.showModal();
  return { element: dialog, close };
}

/**
 * Asks the user to confirm a destructive action.
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', isDanger = true }) {
  return new Promise((resolve) => {
    let isConfirmed = false;
    const { element, close } = openModal({
      title,
      body: html`<p class="text-muted">${message}</p>
        <div class="modal__actions">
          <button class="button button--secondary" type="button" data-modal-close>Cancel</button>
          <button
            class="button ${isDanger ? 'button--danger' : 'button--primary'}"
            type="button"
            data-confirm
          >
            ${confirmLabel}
          </button>
        </div>`,
      onClose: () => resolve(isConfirmed),
    });
    const confirmButton = element.querySelector('[data-confirm]');
    confirmButton.focus();
    confirmButton.addEventListener('click', () => {
      isConfirmed = true;
      close();
    });
  });
}
