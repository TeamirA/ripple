const OPEN_MENU_SELECTOR = 'details[data-menu][open]';

/**
 * <details> menus open and close natively; this adds the expected extras:
 * close on outside click, and close on Escape with focus back on the trigger.
 */
export function enableMenuDismissal() {
  document.addEventListener('click', (event) => {
    document.querySelectorAll(OPEN_MENU_SELECTOR).forEach((menu) => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const menu =
      event.target.closest?.(OPEN_MENU_SELECTOR) ?? document.querySelector(OPEN_MENU_SELECTOR);
    if (!menu) return;
    menu.removeAttribute('open');
    menu.querySelector('summary')?.focus();
  });
}
