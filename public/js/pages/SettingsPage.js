import { authApi } from '../api/authApi.js';
import { FormField } from '../components/FormField.js';
import { PageHeader } from '../components/PageHeader.js';
import { showToast } from '../components/Toast.js';
import { getCurrentUser, signOut } from '../state/session.js';
import { html } from '../utils/escapeHtml.js';
import { setBusy, setHtml } from '../utils/dom.js';
import { clearFormErrors, getFormValues, showFormErrors } from '../utils/forms.js';

function PasswordSection() {
  return html`<section class="settings-section" aria-labelledby="password-heading">
    <h2 class="settings-section__title" id="password-heading">Change password</h2>
    <p class="settings-section__hint">
      You’ll stay signed in here; other devices will be signed out.
    </p>
    <form class="form" novalidate data-password-form>
      <p class="form-alert" role="alert" tabindex="-1"></p>
      ${FormField({ id: 'currentPassword', name: 'currentPassword', label: 'Current password', type: 'password', autocomplete: 'current-password', required: true })}
      ${FormField({ id: 'newPassword', name: 'newPassword', label: 'New password', type: 'password', autocomplete: 'new-password', required: true, hint: 'At least 8 characters.' })}
      <div><button class="button button--primary" type="submit">Update password</button></div>
    </form>
  </section>`;
}

function AccountSection(user) {
  return html`<section class="settings-section" aria-labelledby="account-heading">
    <h2 class="settings-section__title" id="account-heading">Account</h2>
    <p class="settings-section__hint">
      Signed in as <strong>@${user.username}</strong> (${user.email}).
    </p>
    <div><button class="button button--secondary" type="button" data-sign-out>Log out</button></div>
  </section>`;
}

export function render(container) {
  const user = getCurrentUser();
  setHtml(
    container,
    html`<section class="page">
      ${PageHeader({ title: 'Settings' })}
      <div class="settings" data-settings>${PasswordSection()} ${AccountSection(user)}</div>
    </section>`,
  );

  const form = container.querySelector('[data-password-form]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormErrors(form);
    const submitButton = form.querySelector('[type="submit"]');
    setBusy(submitButton, true);
    try {
      const { currentPassword, newPassword } = getFormValues(form);
      await authApi.changePassword(currentPassword, newPassword);
      form.reset();
      showToast('Password updated. Other sessions were signed out.', { type: 'success' });
    } catch (error) {
      showFormErrors(form, error);
    } finally {
      setBusy(submitButton, false);
    }
  });

  container.querySelector('[data-sign-out]').addEventListener('click', async () => {
    await signOut();
    showToast('You’re logged out. See you soon!');
  });
}
