import { html } from '../utils/escapeHtml.js';

/**
 * Labelled input with hint and error slots wired up through aria-describedby.
 * @param {{ id: string, name: string, label: string, type?: string, hint?: string,
 *   value?: string, autocomplete?: string, required?: boolean, maxLength?: number }} options
 */
export function FormField({
  id,
  name,
  label,
  type = 'text',
  hint,
  value = '',
  autocomplete,
  required = false,
  maxLength,
}) {
  const describedBy = [hint && `${id}-hint`, `${id}-error`].filter(Boolean).join(' ');
  return html`<div class="field">
    <label class="field__label" for="${id}">${label}</label>
    <input
      class="input"
      id="${id}"
      name="${name}"
      type="${type}"
      value="${value}"
      ${autocomplete ? html`autocomplete="${autocomplete}"` : ''}
      ${maxLength ? html`maxlength="${maxLength}"` : ''}
      ${required ? html`required` : ''}
      aria-describedby="${describedBy}"
    />
    ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
    <p class="field__error" id="${id}-error"></p>
  </div>`;
}
