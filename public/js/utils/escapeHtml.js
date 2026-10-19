const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"'`]/g, (character) => HTML_ESCAPES[character]);
}

/** Markup produced by the `html` tag; only instances of this class are ever trusted. */
export class SafeHtml {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

function renderValue(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(renderValue).join('');
  return escapeHtml(value);
}

/**
 * Tagged template that escapes every interpolated value unless it is itself
 * SafeHtml (another `html` result). This is the only way markup is built in
 * the app, so user content can never be interpreted as HTML.
 *
 * @example html`<p class="bio">${user.bio}</p>`
 */
export function html(strings, ...values) {
  let output = strings[0];
  values.forEach((value, index) => {
    output += renderValue(value) + strings[index + 1];
  });
  return new SafeHtml(output);
}
