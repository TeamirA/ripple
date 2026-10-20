import { html } from '../utils/escapeHtml.js';

/**
 * Link-based tabs: each tab is a real URL, so it works with back/forward and
 * can be shared. The active tab is marked with aria-current.
 * @param {{ label: string, items: { key: string, label: string, href: string }[], activeKey: string }} props
 */
export function Tabs({ label, items, activeKey }) {
  return html`<nav class="tabs" aria-label="${label}">
    ${items.map(
      (item) =>
        html`<a
          class="tabs__tab"
          href="${item.href}"
          ${item.key === activeKey ? html`aria-current="page"` : ''}
          >${item.label}</a
        >`,
    )}
  </nav>`;
}
