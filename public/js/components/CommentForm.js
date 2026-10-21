import { commentsApi } from '../api/commentsApi.js';
import { getCurrentUser } from '../state/session.js';
import { html } from '../utils/escapeHtml.js';
import { createElement, setBusy } from '../utils/dom.js';
import { Avatar } from './Avatar.js';
import { showErrorToast } from './Toast.js';

const COMMENT_MAX_LENGTH = 500;
let formCount = 0;

function CommentFormMarkup({ id, placeholder, hasCancel, submitLabel }) {
  return html`<form class="comment-form" novalidate>
    ${Avatar(getCurrentUser(), 'sm')}
    <label class="visually-hidden" for="${id}">${placeholder}</label>
    <textarea
      class="textarea comment-form__input"
      id="${id}"
      name="content"
      rows="1"
      maxlength="${COMMENT_MAX_LENGTH}"
      placeholder="${placeholder}"
    ></textarea>
    <div class="comment-form__actions">
      ${hasCancel ? html`<button class="button button--ghost button--sm" type="button" data-cancel>Cancel</button>` : ''}
      <button class="button button--primary button--sm" type="submit" disabled>
        ${submitLabel}
      </button>
    </div>
  </form>`;
}

/**
 * Comment or reply form.
 * @param {HTMLElement} container
 * @param {{ postId: string, parentId?: string, initialText?: string, placeholder: string,
 *   autofocus?: boolean, onCreated: (comment: object) => void, onCancel?: () => void }} options
 */
export function mountCommentForm(
  container,
  { postId, parentId, initialText = '', placeholder, autofocus = false, onCreated, onCancel },
) {
  formCount += 1;
  const form = createElement(
    CommentFormMarkup({
      id: `comment-input-${formCount}`,
      placeholder,
      hasCancel: Boolean(onCancel),
      submitLabel: parentId ? 'Reply' : 'Comment',
    }),
  );
  container.append(form);

  const textarea = form.elements.content;
  const submitButton = form.querySelector('[type="submit"]');
  const syncSubmitState = () => {
    submitButton.disabled = textarea.value.trim().length === 0;
  };

  textarea.value = initialText;
  syncSubmitState();
  textarea.addEventListener('input', syncSubmitState);
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) form.requestSubmit();
    if (event.key === 'Escape' && onCancel) onCancel();
  });
  form.querySelector('[data-cancel]')?.addEventListener('click', onCancel);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;
    setBusy(submitButton, true);
    try {
      const { comment } = await commentsApi.create(postId, textarea.value, parentId);
      textarea.value = '';
      onCreated(comment);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(submitButton, false);
      syncSubmitState();
    }
  });

  if (autofocus) {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}
