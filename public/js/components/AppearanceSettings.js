import { getThemePreference, setThemePreference, THEME_OPTIONS } from '../state/theme.js';
import { html } from '../utils/escapeHtml.js';
import { icon } from './icons.js';

const OPTION_DETAILS = {
  system: { label: 'System', icon: 'monitor' },
  light: { label: 'Light', icon: 'sun' },
  dark: { label: 'Dark', icon: 'moon' },
};

export function AppearanceSection() {
  const current = getThemePreference();
  return html`<section class="settings-section" aria-labelledby="appearance-heading">
    <h2 class="settings-section__title" id="appearance-heading">Appearance</h2>
    <p class="settings-section__hint">“System” follows your device’s light or dark mode.</p>
    <fieldset class="theme-picker" data-theme-picker>
      <legend class="visually-hidden">Theme</legend>
      ${THEME_OPTIONS.map(
        (option) =>
          html`<label class="theme-picker__option">
            <input
              type="radio"
              name="theme"
              value="${option}"
              ${option === current ? html`checked` : ''}
            />
            ${icon(OPTION_DETAILS[option].icon)}
            <span>${OPTION_DETAILS[option].label}</span>
          </label>`,
      )}
    </fieldset>
  </section>`;
}

export function bindAppearanceSection(root) {
  root.querySelector('[data-theme-picker]').addEventListener('change', (event) => {
    setThemePreference(event.target.value);
  });
}
