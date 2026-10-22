import { html } from '../utils/escapeHtml.js';
import { formatDateTime, formatRelativeTime } from '../utils/formatTime.js';

const REFRESH_INTERVAL_MS = 60_000;

/** "5m"-style timestamp with the full date on hover; kept fresh by `startLiveTimestamps`. */
export function RelativeTime(value, { className = '' } = {}) {
  return html`<time
    class="${className}"
    datetime="${value}"
    title="${formatDateTime(value)}"
    data-relative-time
    >${formatRelativeTime(value)}</time
  >`;
}

/** Re-renders every relative timestamp once a minute so "now" becomes "1m", "2m"... */
export function startLiveTimestamps() {
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    document.querySelectorAll('time[data-relative-time]').forEach((element) => {
      const text = formatRelativeTime(element.dateTime);
      if (element.textContent !== text) element.textContent = text;
    });
  }, REFRESH_INTERVAL_MS);
}
