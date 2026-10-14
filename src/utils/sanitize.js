// Control characters other than tab and newline have no place in user text.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const EXCESS_BLANK_LINES = /\n{3,}/g;

/**
 * Normalizes free-form user text before it is stored. HTML is not stripped here:
 * all user content is escaped at render time instead.
 */
export function sanitizeText(value) {
  return value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARACTERS, '')
    .replace(EXCESS_BLANK_LINES, '\n\n')
    .trim();
}

export function sanitizeSingleLine(value) {
  return sanitizeText(value).replace(/\s+/g, ' ');
}
