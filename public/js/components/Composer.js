import { postsApi } from '../api/postsApi.js';
import { getCurrentUser } from '../state/session.js';
import { html } from '../utils/escapeHtml.js';
import { createElement, setBusy } from '../utils/dom.js';
import { Avatar } from './Avatar.js';
import { icon } from './icons.js';
import { showErrorToast, showToast } from './Toast.js';

export const POST_MAX_LENGTH = 500;
const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const WARNING_THRESHOLD = 20;

function ComposerForm(user) {
  return html`<form class="composer" data-composer novalidate>
    ${Avatar(user)}
    <div class="composer__body">
      <label class="visually-hidden" for="composer-input">Write a post</label>
      <textarea
        class="composer__input"
        id="composer-input"
        name="content"
        rows="2"
        placeholder="What’s rippling, ${user.displayName.split(' ')[0]}?"
      ></textarea>
      <div class="composer__preview" data-preview hidden>
        <img alt="Selected image preview" data-preview-image />
        <button
          class="icon-button composer__remove-image"
          type="button"
          data-remove-image
          aria-label="Remove image"
        >
          ${icon('close')}
        </button>
      </div>
      <div class="composer__toolbar">
        <label class="icon-button composer__attach" title="Add an image">
          ${icon('image')}<span class="visually-hidden">Add an image</span>
          <input
            class="visually-hidden"
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/gif,image/webp"
            data-image-input
          />
        </label>
        <span class="composer__counter" data-counter aria-hidden="true">${POST_MAX_LENGTH}</span>
        <span class="visually-hidden" aria-live="polite" data-counter-announcer></span>
        <button class="button button--primary" type="submit" disabled>Post</button>
      </div>
    </div>
  </form>`;
}

function describeRemaining(remaining) {
  if (remaining < 0) return `${-remaining} characters over the limit`;
  if (remaining <= WARNING_THRESHOLD) return `${remaining} characters left`;
  return '';
}

/**
 * Post composer with live character counter and optional image.
 * @param {HTMLElement} container
 * @param {{ onPostCreated: (post: object) => void, autofocus?: boolean }} options
 */
export function mountComposer(container, { onPostCreated, autofocus = false }) {
  const form = createElement(ComposerForm(getCurrentUser()));
  container.append(form);

  const textarea = form.elements.content;
  const counter = form.querySelector('[data-counter]');
  const announcer = form.querySelector('[data-counter-announcer]');
  const submitButton = form.querySelector('[type="submit"]');
  const imageInput = form.querySelector('[data-image-input]');
  const preview = form.querySelector('[data-preview]');
  let selectedImage = null;
  let previewUrl = null;

  function updateCounter() {
    const length = textarea.value.trim().length;
    const remaining = POST_MAX_LENGTH - textarea.value.length;
    counter.textContent = String(remaining);
    counter.classList.toggle('is-warning', remaining <= WARNING_THRESHOLD && remaining >= 0);
    counter.classList.toggle('is-over', remaining < 0);
    const message = describeRemaining(remaining);
    if (announcer.textContent !== message) announcer.textContent = message;
    submitButton.disabled = length === 0 || remaining < 0;
    // Grow with the content instead of showing a scrollbar.
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    selectedImage = null;
    previewUrl = null;
    imageInput.value = '';
    preview.hidden = true;
  }

  imageInput.addEventListener('change', () => {
    const [file] = imageInput.files;
    if (!file) return;
    if (file.size > IMAGE_MAX_BYTES) {
      showToast('Images must be 4 MB or smaller.', { type: 'error' });
      return clearImage();
    }
    clearImage();
    selectedImage = file;
    previewUrl = URL.createObjectURL(file);
    form.querySelector('[data-preview-image]').src = previewUrl;
    preview.hidden = false;
  });

  form.querySelector('[data-remove-image]').addEventListener('click', clearImage);
  textarea.addEventListener('input', updateCounter);
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) form.requestSubmit();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;
    setBusy(submitButton, true);
    try {
      const { post } = await postsApi.create({ content: textarea.value, image: selectedImage });
      textarea.value = '';
      clearImage();
      onPostCreated(post);
      showToast('Posted!', { type: 'success' });
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(submitButton, false);
      updateCounter();
    }
  });

  updateCounter();
  if (autofocus) textarea.focus();
  return () => clearImage();
}
