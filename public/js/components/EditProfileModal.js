import { usersApi } from '../api/usersApi.js';
import { setCurrentUser } from '../state/session.js';
import { html } from '../utils/escapeHtml.js';
import { setBusy, setHtml } from '../utils/dom.js';
import { clearFormErrors, getFormValues, showFormErrors } from '../utils/forms.js';
import { Avatar } from './Avatar.js';
import { FormField } from './FormField.js';
import { openModal } from './Modal.js';
import { showErrorToast, showToast } from './Toast.js';

const BIO_MAX_LENGTH = 160;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function AvatarEditor(user) {
  return html`<div class="avatar-editor">
    <span data-avatar-preview>${Avatar(user, 'lg')}</span>
    <div class="avatar-editor__actions">
      <label class="button button--secondary button--sm avatar-editor__upload">
        Upload photo
        <input
          class="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          data-avatar-input
        />
      </label>
      ${user.avatarUrl ? html`<button class="button button--ghost button--sm" type="button" data-remove-avatar>Remove</button>` : ''}
    </div>
  </div>`;
}

function EditProfileForm(user) {
  return html`<form class="form" novalidate data-edit-profile>
    <p class="form-alert" role="alert" tabindex="-1"></p>
    ${AvatarEditor(user)}
    ${FormField({ id: 'edit-displayName', name: 'displayName', label: 'Display name', value: user.displayName, maxLength: 50, required: true })}
    <div class="field">
      <label class="field__label" for="edit-bio">Bio</label>
      <textarea
        class="textarea"
        id="edit-bio"
        name="bio"
        maxlength="${BIO_MAX_LENGTH}"
        aria-describedby="edit-bio-hint edit-bio-error"
      ></textarea>
      <p class="field__hint" id="edit-bio-hint"><span data-bio-count>0</span>/${BIO_MAX_LENGTH}</p>
      <p class="field__error" id="edit-bio-error"></p>
    </div>
    <div class="field">
      <label class="field__label" for="edit-bannerColor">Banner color</label>
      <input
        class="color-input"
        id="edit-bannerColor"
        name="bannerColor"
        type="color"
        value="${user.bannerColor}"
        aria-describedby="edit-bannerColor-error"
      />
      <p class="field__error" id="edit-bannerColor-error"></p>
    </div>
    <div class="modal__actions">
      <button class="button button--secondary" type="button" data-modal-close>Cancel</button>
      <button class="button button--primary" type="submit">Save</button>
    </div>
  </form>`;
}

async function replaceAvatar(form, request) {
  try {
    const { user } = await request();
    setCurrentUser(user);
    setHtml(form.querySelector('[data-avatar-preview]'), Avatar(user, 'lg'));
    showToast('Profile photo updated.', { type: 'success' });
    return user;
  } catch (error) {
    showErrorToast(error);
    return null;
  }
}

/**
 * Lets the signed-in user edit their profile; avatar changes apply immediately.
 * @param {object} user the current user's own profile
 * @param {{ onSaved: () => void }} options
 */
export function openEditProfileModal(user, { onSaved }) {
  let hasChanges = false;
  const { element, close } = openModal({
    title: 'Edit profile',
    body: EditProfileForm(user),
    onClose: () => hasChanges && onSaved(),
  });
  const form = element.querySelector('[data-edit-profile]');
  const bio = form.elements.bio;
  const bioCount = form.querySelector('[data-bio-count]');
  bio.value = user.bio;
  bioCount.textContent = String(bio.value.length);
  bio.addEventListener('input', () => {
    bioCount.textContent = String(bio.value.length);
  });

  form.querySelector('[data-avatar-input]').addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    if (file.size > AVATAR_MAX_BYTES)
      return showToast('Photos must be 2 MB or smaller.', { type: 'error' });
    hasChanges =
      Boolean(await replaceAvatar(form, () => usersApi.uploadAvatar(file))) || hasChanges;
  });
  form.querySelector('[data-remove-avatar]')?.addEventListener('click', async (event) => {
    event.currentTarget.remove();
    hasChanges = Boolean(await replaceAvatar(form, () => usersApi.removeAvatar())) || hasChanges;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormErrors(form);
    const submitButton = form.querySelector('[type="submit"]');
    setBusy(submitButton, true);
    try {
      const { displayName, bio: bioText, bannerColor } = getFormValues(form);
      const { user: updated } = await usersApi.updateProfile({
        displayName,
        bio: bioText,
        bannerColor,
      });
      setCurrentUser(updated);
      hasChanges = true;
      showToast('Profile saved.', { type: 'success' });
      close();
    } catch (error) {
      showFormErrors(form, error);
      setBusy(submitButton, false);
    }
  });
}
