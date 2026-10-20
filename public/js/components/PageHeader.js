import { canGoBack } from '../router.js';
import { html } from '../utils/escapeHtml.js';
import { icon } from './icons.js';

/**
 * Sticky page title bar. `data-page-title` feeds the router's document.title.
 * @param {{ title: string, subtitle?: string, hasBackButton?: boolean, actions?: any }} props
 */
export function PageHeader({ title, subtitle, hasBackButton = false, actions = '' }) {
  return html`<header class="page-header" data-page-title="${title}">
    ${
      hasBackButton
        ? html`<button class="icon-button" type="button" data-action="go-back" aria-label="Go back">
            ${icon('arrowLeft')}
          </button>`
        : ''
    }
    <div class="page-header__text">
      <h1 class="page-header__title">${title}</h1>
      ${subtitle ? html`<p class="page-header__subtitle">${subtitle}</p>` : ''}
    </div>
    <div class="page-header__actions">${actions}</div>
  </header>`;
}

/** Back buttons fall back to Explore when there is no in-app history. */
export function bindBackButton(root, navigate) {
  const button = root.querySelector('[data-action="go-back"]');
  button?.addEventListener('click', () => {
    if (canGoBack()) window.history.back();
    else navigate('/explore');
  });
}
