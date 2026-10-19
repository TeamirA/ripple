import { html } from '../utils/escapeHtml.js';
import { setHtml } from '../utils/dom.js';

function describeError(error) {
  if (error?.status === 404) {
    return { code: '404', title: 'Not found', message: error.message };
  }
  if (error?.code === 'NETWORK_ERROR') {
    return { code: 'Offline', title: 'Connection problem', message: error.message };
  }
  return {
    code: 'Oops',
    title: 'Something went wrong',
    message: 'An unexpected error stopped this page from loading. Try again in a moment.',
  };
}

/** Shown when a page fails to render; offers a retry and a way home. */
export function render(container, { error }) {
  const { code, title, message } = describeError(error);
  setHtml(
    container,
    html`<section class="status-page" data-page-title="${title}">
      <div>
        <p class="status-page__code" aria-hidden="true">${code}</p>
        <h1 class="status-page__title">${title}</h1>
      </div>
      <p class="status-page__message">${message}</p>
      <div class="status-page__actions">
        <button class="button button--primary" type="button" data-retry>Try again</button>
        <a class="button button--secondary" href="/explore">Go to Explore</a>
      </div>
    </section>`,
  );
  container.querySelector('[data-retry]').addEventListener('click', () => window.location.reload());
}
