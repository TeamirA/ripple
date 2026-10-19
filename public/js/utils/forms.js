/** Clears inline errors set by `showFormErrors`. */
export function clearFormErrors(form) {
  form.querySelectorAll('[aria-invalid="true"]').forEach((input) => {
    input.removeAttribute('aria-invalid');
  });
  form.querySelectorAll('.field__error').forEach((element) => {
    element.textContent = '';
  });
  const alert = form.querySelector('.form-alert');
  if (alert) alert.textContent = '';
}

/**
 * Shows API validation errors next to their inputs (matched by `name`), and the
 * general message in the form's alert. Focuses the first invalid field.
 * @param {HTMLFormElement} form
 * @param {import('../api/httpClient.js').ApiError} error
 */
export function showFormErrors(form, error) {
  clearFormErrors(form);
  const fieldErrors = error.fieldErrors ?? {};
  let firstInvalid = null;

  Object.entries(fieldErrors).forEach(([name, message]) => {
    const input = form.elements.namedItem(name);
    if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    const errorElement = form.querySelector(`#${input.id}-error`);
    if (errorElement) errorElement.textContent = message;
    firstInvalid ??= input;
  });

  const alert = form.querySelector('.form-alert');
  const hasInlineErrors = Boolean(firstInvalid);
  if (alert && !hasInlineErrors) alert.textContent = error.message;
  (firstInvalid ?? alert)?.focus?.();
}

export function getFormValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}
