// Runs synchronously in <head>, before CSS paints, so the saved theme never flashes.
(function applySavedTheme() {
  try {
    var preference = localStorage.getItem('ripple:theme');
    if (preference === 'light' || preference === 'dark') {
      document.documentElement.dataset.theme = preference;
    }
  } catch {
    // Storage can be unavailable (private mode); the system preference still applies.
  }
})();
