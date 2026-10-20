import { html } from '../utils/escapeHtml.js';
import { icon } from './icons.js';

/**
 * @param {{ icon?: string, title: string, message?: string,
 *   action?: { label: string, href: string } }} props
 */
export function EmptyState({ icon: iconName = 'sparkles', title, message, action }) {
  return html`<div class="empty-state">
    <span class="empty-state__icon">${icon(iconName)}</span>
    <h2 class="empty-state__title">${title}</h2>
    ${message ? html`<p class="empty-state__message">${message}</p>` : ''}
    ${action ? html`<a class="button button--primary" href="${action.href}">${action.label}</a>` : ''}
  </div>`;
}
