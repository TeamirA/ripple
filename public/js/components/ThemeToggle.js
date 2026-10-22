import { getResolvedTheme, toggleTheme } from '../state/theme.js';
import { html } from '../utils/escapeHtml.js';
import { delegate, setHtml } from '../utils/dom.js';
import { icon } from './icons.js';

function labelFor(theme) {
  return theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
}

/** Sun/moon button; shows the theme you would switch to. */
export function ThemeToggle({ className = 'icon-button' } = {}) {
  const theme = getResolvedTheme();
  return html`<button
    class="${className} theme-toggle"
    type="button"
    data-action="toggle-theme"
    aria-label="${labelFor(theme)}"
    title="${labelFor(theme)}"
  >
    ${icon(theme === 'dark' ? 'sun' : 'moon')}
  </button>`;
}

/** One listener for every theme toggle on the page. */
export function bindThemeToggles(root = document) {
  return delegate(root, 'click', '[data-action="toggle-theme"]', () => {
    const theme = toggleTheme();
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((button) => {
      button.setAttribute('aria-label', labelFor(theme));
      button.title = labelFor(theme);
      setHtml(button, icon(theme === 'dark' ? 'sun' : 'moon'));
    });
  });
}
