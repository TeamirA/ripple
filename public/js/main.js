import { highlightActiveNavLink, mountAppNav } from './components/AppNav.js';
import { mountDiscoverAside } from './components/DiscoverAside.js';
import { startLiveTimestamps } from './components/RelativeTime.js';
import { PageSkeleton } from './components/Skeleton.js';
import { bindThemeToggles } from './components/ThemeToggle.js';
import { showErrorToast } from './components/Toast.js';
import { createRouter } from './router.js';
import { errorPage, notFoundPage, routes } from './routes.js';
import { restoreSession } from './state/session.js';
import { store } from './state/store.js';
import { watchSystemTheme } from './state/theme.js';
import { startUnreadPolling } from './state/unreadNotifications.js';
import { setHtml } from './utils/dom.js';
import { enableMenuDismissal } from './utils/menus.js';

function installGlobalHandlers() {
  watchSystemTheme();
  bindThemeToggles();
  enableMenuDismissal();
  startLiveTimestamps();
  // Last line of defense: any unexpected async failure still tells the user something.
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'AbortError') return;
    console.error(event.reason);
    showErrorToast(event.reason);
  });
}

async function boot() {
  installGlobalHandlers();
  await restoreSession();

  const nav = document.getElementById('app-nav');
  mountAppNav({
    nav,
    header: document.getElementById('app-header'),
    getPathname: () => window.location.pathname,
  });

  const router = createRouter({
    routes,
    outlet: document.getElementById('main'),
    notFoundPage,
    errorPage,
    onRouteChange: (pathname) => highlightActiveNavLink(nav, pathname),
    renderLoading: (outlet) => setHtml(outlet, PageSkeleton()),
  });

  mountDiscoverAside(document.getElementById('app-aside'), { navigate: router.navigate });
  startUnreadPolling();

  // Signing in or out changes what most pages show, so re-run the current route.
  store.subscribe(
    (state) => state.currentUser?.id,
    () => router.refresh(),
  );

  await router.start();
}

boot();
