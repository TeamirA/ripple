import { highlightActiveNavLink, mountAppNav } from './components/AppNav.js';
import { mountDiscoverAside } from './components/DiscoverAside.js';
import { createRouter } from './router.js';
import { errorPage, notFoundPage, routes } from './routes.js';
import { restoreSession } from './state/session.js';
import { store } from './state/store.js';
import { startUnreadPolling } from './state/unreadNotifications.js';

async function boot() {
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
