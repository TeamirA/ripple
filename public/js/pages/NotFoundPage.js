import { html } from '../utils/escapeHtml.js';
import { setHtml } from '../utils/dom.js';

export function render(container) {
  setHtml(
    container,
    html`<section class="status-page" data-page-title="Page not found">
      <div>
        <p class="status-page__code" aria-hidden="true">404</p>
        <h1 class="status-page__title">This page drifted away</h1>
      </div>
      <p class="status-page__message">The link may be broken, or the page may have been removed.</p>
      <div class="status-page__actions">
        <a class="button button--primary" href="/">Back home</a>
        <a class="button button--secondary" href="/search">Search Ripple</a>
      </div>
    </section>`,
  );
}
