import { html } from '../utils/escapeHtml.js';

// Matches the .avatar--tone-N classes in avatar.css (inline styles are blocked by the CSP).
const AVATAR_TONE_COUNT = 7;

function getInitials(displayName) {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0]?.slice(0, 2);
  return (initials ?? '?').toUpperCase();
}

/** Same username always maps to the same color. */
function pickTone(seed) {
  const hash = [...seed].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    7,
  );
  return hash % AVATAR_TONE_COUNT;
}

function isTrustedImageUrl(url) {
  return typeof url === 'string' && url.startsWith('https://');
}

/**
 * Profile picture with a generated initials fallback.
 * @param {{ username: string, displayName: string, avatarUrl?: string | null }} user
 * @param {'sm' | 'md' | 'lg' | 'xl'} [size]
 */
export function Avatar(user, size = 'md') {
  const sizeClass = size === 'md' ? '' : `avatar--${size}`;
  if (isTrustedImageUrl(user.avatarUrl)) {
    return html`<span class="avatar ${sizeClass}">
      <img src="${user.avatarUrl}" alt="" loading="lazy" decoding="async" width="96" height="96" />
    </span>`;
  }
  return html`<span
    class="avatar ${sizeClass} avatar--tone-${pickTone(user.username)}"
    aria-hidden="true"
    >${getInitials(user.displayName)}</span
  >`;
}
