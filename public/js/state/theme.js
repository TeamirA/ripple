const STORAGE_KEY = 'ripple:theme';
export const THEME_OPTIONS = ['system', 'light', 'dark'];
const THEME_COLORS = { light: '#ffffff', dark: '#161722' };

const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function getThemePreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEME_OPTIONS.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function resolveTheme(preference) {
  if (preference !== 'system') return preference;
  return systemDarkQuery.matches ? 'dark' : 'light';
}

/** Applies a preference; "system" defers to prefers-color-scheme via CSS. */
export function applyTheme(preference = getThemePreference()) {
  const root = document.documentElement;
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[resolveTheme(preference)]);
}

export function setThemePreference(preference) {
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Without storage the choice still applies for this visit.
  }
  applyTheme(preference);
}

/** Flips between light and dark, starting from whatever is showing now. */
export function toggleTheme() {
  const next = resolveTheme(getThemePreference()) === 'dark' ? 'light' : 'dark';
  setThemePreference(next);
  return next;
}

export function watchSystemTheme() {
  systemDarkQuery.addEventListener('change', () => applyTheme());
  applyTheme();
}

export function getResolvedTheme() {
  return resolveTheme(getThemePreference());
}
