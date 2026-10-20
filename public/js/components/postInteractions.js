import { postsApi } from '../api/postsApi.js';
import { html } from '../utils/escapeHtml.js';
import { delegate, setBusy, setHtml } from '../utils/dom.js';
import { formatRichText } from '../utils/richText.js';
import { toggleLike } from './LikeButton.js';
import { confirmDialog } from './Modal.js';
import { showErrorToast, showToast } from './Toast.js';

const POST_MAX_LENGTH = 500;
const INTERACTIVE_SELECTOR = 'a, button, summary, details, textarea, input, label, form';

function closeMenus(root) {
  root.querySelectorAll('details[data-menu][open]').forEach((menu) => menu.removeAttribute('open'));
}

async function deletePost(card, onDeleted) {
  const isConfirmed = await confirmDialog({
    title: 'Delete post?',
    message: 'This can’t be undone. The post, its comments and likes will be removed.',
    confirmLabel: 'Delete',
  });
  if (!isConfirmed) return;

  try {
    await postsApi.remove(card.dataset.postId);
    card.remove();
    showToast('Post deleted.');
    onDeleted?.(card.dataset.postId);
  } catch (error) {
    showErrorToast(error);
  }
}

function startEditing(card) {
  const content = card.querySelector('[data-post-content]');
  if (card.querySelector('[data-edit-form]')) return;

  const originalText = content.dataset.rawContent;
  const form = document.createElement('form');
  form.className = 'post-edit';
  form.dataset.editForm = '';
  setHtml(
    form,
    html`<label class="visually-hidden" for="edit-${card.dataset.postId}">Edit post</label>
      <textarea
        class="textarea"
        id="edit-${card.dataset.postId}"
        name="content"
        maxlength="${POST_MAX_LENGTH}"
        required
      ></textarea>
      <div class="post-edit__actions">
        <button class="button button--ghost button--sm" type="button" data-cancel-edit>
          Cancel
        </button>
        <button class="button button--primary button--sm" type="submit">Save</button>
      </div>`,
  );
  const textarea = form.elements.content;
  textarea.value = originalText;
  content.hidden = true;
  content.after(form);
  textarea.focus();

  const finish = () => {
    form.remove();
    content.hidden = false;
  };
  form.querySelector('[data-cancel-edit]').addEventListener('click', finish);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    setBusy(submitButton, true);
    try {
      const { post } = await postsApi.update(card.dataset.postId, textarea.value);
      setHtml(content, formatRichText(post.content));
      content.dataset.rawContent = post.content;
      card.querySelector('[data-post-edited]').hidden = false;
      finish();
      showToast('Post updated.', { type: 'success' });
    } catch (error) {
      showErrorToast(error);
      setBusy(submitButton, false);
    }
  });
}

/**
 * Wires likes, edit, delete and "open post" for every PostCard inside `root`
 * with a handful of delegated listeners.
 * @param {HTMLElement} root
 * @param {{ navigate: (path: string) => void, onPostDeleted?: (postId: string) => void }} options
 * @returns {() => void} cleanup
 */
export function bindPostInteractions(root, { navigate, onPostDeleted }) {
  const cleanups = [
    delegate(root, 'click', '[data-action="toggle-like"][data-like-kind="post"]', (_e, button) =>
      toggleLike(button),
    ),
    delegate(root, 'click', '[data-action="edit-post"]', (_e, button) => {
      closeMenus(root);
      startEditing(button.closest('.post-card'));
    }),
    delegate(root, 'click', '[data-action="delete-post"]', (_e, button) => {
      closeMenus(root);
      deletePost(button.closest('.post-card'), onPostDeleted);
    }),
    // Clicking empty space on a feed card opens the post, like most social apps.
    delegate(root, 'click', '.post-card:not(.post-card--detail)', (event, card) => {
      const hasSelection = window.getSelection()?.toString();
      if (event.target.closest(INTERACTIVE_SELECTOR) || hasSelection) return;
      navigate(card.dataset.postUrl);
    }),
  ];
  return () => cleanups.forEach((cleanup) => cleanup());
}
