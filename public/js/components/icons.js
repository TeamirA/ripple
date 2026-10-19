import { html } from '../utils/escapeHtml.js';

// 24x24 stroke icons; color follows `currentColor`.
const ICON_PATHS = {
  home: html`<path d="M3 10.5 12 3l9 7.5" /><path
      d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"
    />`,
  compass: html`<circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" />`,
  search: html`<circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />`,
  bell: html`<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path
      d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
    />`,
  user: html`<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />`,
  settings: html`<circle cx="12" cy="12" r="3" /><path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
    />`,
  heart: html`<path d="M19.5 12.6 12 20l-7.5-7.4A4.9 4.9 0 0 1 12 5.9a4.9 4.9 0 0 1 7.5 6.7z" />`,
  comment: html`<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />`,
  edit: html`<path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />`,
  trash: html`<path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path
      d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
    />`,
  image: html`<rect x="3" y="3" width="18" height="18" rx="2" /><circle
      cx="8.5"
      cy="8.5"
      r="1.5"
    /><path d="m21 15-5-5L5 21" />`,
  close: html`<path d="M18 6 6 18" /><path d="m6 6 12 12" />`,
  more: html`<circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle
      cx="19"
      cy="12"
      r="1"
    />`,
  arrowLeft: html`<path d="M19 12H5" /><path d="m12 19-7-7 7-7" />`,
  logout: html`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path
      d="M21 12H9"
    />`,
  sun: html`<circle cx="12" cy="12" r="4" /><path
      d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
    />`,
  moon: html`<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />`,
  monitor: html`<rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />`,
  plus: html`<path d="M12 5v14M5 12h14" />`,
  calendar: html`<rect x="3" y="4" width="18" height="18" rx="2" /><path
      d="M16 2v4M8 2v4M3 10h18"
    />`,
  userPlus: html`<circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path
      d="M19 8v6M16 11h6"
    />`,
  alert: html`<circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />`,
  sparkles: html`<path d="M12 3v3M12 18v3M3 12h3M18 12h3" /><path
      d="m7 7 1.5 1.5M15.5 15.5 17 17M7 17l1.5-1.5M15.5 8.5 17 7"
    />`,
};

/**
 * @param {keyof ICON_PATHS} name
 * @param {{ label?: string, className?: string }} [options] label makes the icon announced
 */
export function icon(name, { label, className = '' } = {}) {
  const a11y = label ? html`role="img" aria-label="${label}"` : html`aria-hidden="true"`;
  return html`<svg class="icon ${className}" viewBox="0 0 24 24" ${a11y} focusable="false">
    ${ICON_PATHS[name]}
  </svg>`;
}
