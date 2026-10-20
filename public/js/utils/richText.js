import { escapeHtml, SafeHtml } from './escapeHtml.js';

// Applied to already-escaped text, so none of these patterns can introduce markup.
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,!?;:)]/g;
const MENTION_PATTERN = /(^|[^\w@/])@([a-z0-9_.]{3,30})\b/gi;
const HASHTAG_PATTERN = /(^|[^\w&#/])#([a-z][\w]{1,49})\b/gi;

function shortenUrl(url) {
  const display = url.replace(/^https?:\/\/(www\.)?/, '');
  return display.length > 40 ? `${display.slice(0, 39)}…` : display;
}

/**
 * Escapes user text, turns URLs, @mentions and #hashtags into links and keeps
 * line breaks as <br> (so template indentation never leaks into the layout).
 * @param {string} text
 * @returns {SafeHtml}
 */
export function formatRichText(text) {
  const linked = escapeHtml(text)
    .replace(
      URL_PATTERN,
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow">${shortenUrl(url)}</a>`,
    )
    .replace(
      MENTION_PATTERN,
      (_, prefix, username) =>
        `${prefix}<a href="/u/${username.toLowerCase()}" class="mention">@${username}</a>`,
    )
    .replace(
      HASHTAG_PATTERN,
      (_, prefix, tag) =>
        `${prefix}<a href="/search?type=posts&amp;q=%23${tag}" class="hashtag">#${tag}</a>`,
    )
    .replace(/\n/g, '<br>');
  return new SafeHtml(linked);
}
