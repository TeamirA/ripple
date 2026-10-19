import { authApi } from '../api/authApi.js';
import { FormField } from '../components/FormField.js';
import { showToast } from '../components/Toast.js';
import { setCurrentUser } from '../state/session.js';
import { html } from '../utils/escapeHtml.js';
import { setBusy, setHtml } from '../utils/dom.js';
import { clearFormErrors, getFormValues, showFormErrors } from '../utils/forms.js';

const MODES = {
  login: {
    title: 'Log in',
    heading: 'Welcome back',
    subtitle: 'Log in to see what your people are up to.',
    submitLabel: 'Log in',
    switchPrompt: 'New to Ripple?',
    switchLabel: 'Create an account',
    switchHref: '/register',
  },
  register: {
    title: 'Sign up',
    heading: 'Join Ripple',
    subtitle: 'Share short posts, follow people and start conversations.',
    submitLabel: 'Create account',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Log in',
    switchHref: '/login',
  },
};

function LoginFields() {
  return html`
    ${FormField({ id: 'identifier', name: 'identifier', label: 'Email or username', autocomplete: 'username', required: true })}
    ${FormField({ id: 'password', name: 'password', label: 'Password', type: 'password', autocomplete: 'current-password', required: true })}
  `;
}

function RegisterFields() {
  return html`
    ${FormField({ id: 'displayName', name: 'displayName', label: 'Display name', autocomplete: 'name', required: true, maxLength: 50 })}
    ${FormField({ id: 'username', name: 'username', label: 'Username', autocomplete: 'username', required: true, maxLength: 30, hint: 'Letters, numbers, underscores and dots. This is your @handle.' })}
    ${FormField({ id: 'email', name: 'email', label: 'Email', type: 'email', autocomplete: 'email', required: true })}
    ${FormField({ id: 'password', name: 'password', label: 'Password', type: 'password', autocomplete: 'new-password', required: true, hint: 'At least 8 characters.' })}
  `;
}

function AuthCard(mode, copy) {
  return html`<section class="auth-page" data-page-title="${copy.title}">
    <div class="auth-card">
      <header class="auth-card__header">
        <span class="auth-card__mark" aria-hidden="true"></span>
        <h1 class="auth-card__title">${copy.heading}</h1>
        <p class="text-muted">${copy.subtitle}</p>
      </header>

      <button
        class="button button--secondary button--lg button--block"
        type="button"
        data-demo-login
      >
        Try the demo account
      </button>
      <p class="demo-hint">No sign-up needed: explore with a pre-filled account.</p>

      <div class="auth-divider">or</div>

      <form class="form" novalidate data-auth-form>
        <p class="form-alert" role="alert" tabindex="-1"></p>
        ${mode === 'login' ? LoginFields() : RegisterFields()}
        <button class="button button--primary button--lg button--block" type="submit">
          ${copy.submitLabel}
        </button>
      </form>

      <p class="auth-card__switch">
        ${copy.switchPrompt} <a href="${copy.switchHref}">${copy.switchLabel}</a>
      </p>
    </div>
  </section>`;
}

function submitCredentials(mode, values) {
  if (mode === 'login') return authApi.login(values.identifier, values.password);
  return authApi.register(values);
}

/** Login and registration share one page; `mode` comes from the route. */
export function render(container, { mode = 'login' }) {
  const copy = MODES[mode];
  setHtml(container, AuthCard(mode, copy));

  const form = container.querySelector('[data-auth-form]');
  const demoButton = container.querySelector('[data-demo-login]');

  async function completeSignIn(request, button) {
    setBusy(button, true);
    try {
      const { user } = await request();
      showToast(`Welcome, ${user.displayName}!`, { type: 'success' });
      // The router re-runs on sign-in and its guest-only guard forwards to ?next= or home.
      setCurrentUser(user);
    } catch (error) {
      showFormErrors(form, error);
    } finally {
      setBusy(button, false);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFormErrors(form);
    const submitButton = form.querySelector('[type="submit"]');
    completeSignIn(() => submitCredentials(mode, getFormValues(form)), submitButton);
  });

  demoButton.addEventListener('click', () => completeSignIn(() => authApi.loginDemo(), demoButton));
}
