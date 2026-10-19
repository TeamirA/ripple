import { SafeHtml } from './escapeHtml.js';

function assertSafeHtml(markup) {
  if (!(markup instanceof SafeHtml)) {
    throw new TypeError('Markup must be created with the html`` tag');
  }
}

/** Replaces an element's content. Accepts only escaped `html` output. */
export function setHtml(element, markup) {
  assertSafeHtml(markup);
  element.innerHTML = markup.value;
}

/** Builds a single element from `html` output. */
export function createElement(markup) {
  assertSafeHtml(markup);
  const template = document.createElement('template');
  template.innerHTML = markup.value.trim();
  return template.content.firstElementChild;
}

export function insertHtml(element, position, markup) {
  assertSafeHtml(markup);
  element.insertAdjacentHTML(position, markup.value);
}

/**
 * Event delegation: one listener on `root` handles events from any current
 * or future descendant matching `selector`.
 * @returns {() => void} removes the listener
 */
export function delegate(root, eventName, selector, handler) {
  const listener = (event) => {
    const target = event.target.closest(selector);
    if (target && root.contains(target)) handler(event, target);
  };
  root.addEventListener(eventName, listener);
  return () => root.removeEventListener(eventName, listener);
}

export function setBusy(button, isBusy) {
  button.disabled = isBusy;
  button.setAttribute('aria-busy', String(isBusy));
}
