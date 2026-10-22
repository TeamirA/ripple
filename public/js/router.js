import { isSignedIn } from './state/session.js';

const APP_NAME = 'Ripple';

/** True when the previous history entry belongs to this app, so "back" stays in Ripple. */
export function canGoBack() {
  return (window.history.state?.depth ?? 0) > 0;
}

function compilePattern(path) {
  const keys = [];
  const source = path.replace(/:(\w+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${source}/?$`), keys };
}

function isModifiedClick(event) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

/**
 * History API router. Each route lazily imports a page module exporting
 * `render(container, context)`, which may return a cleanup function.
 */
const SKELETON_DELAY_MS = 150;

export function createRouter({
  routes,
  outlet,
  notFoundPage,
  errorPage,
  onRouteChange,
  renderLoading,
}) {
  const compiledRoutes = routes.map((route) => ({ ...route, ...compilePattern(route.path) }));
  const scrollPositions = new Map();
  let cleanupCurrentPage = null;
  let abortController = null;
  let navigationId = 0;

  function match(pathname) {
    for (const route of compiledRoutes) {
      const result = route.regex.exec(pathname);
      if (result) {
        const params = Object.fromEntries(
          route.keys.map((key, index) => [key, decodeURIComponent(result[index + 1])]),
        );
        return { route, params };
      }
    }
    return null;
  }

  function resolveRedirect(route, url) {
    if (route.requiresAuth && !isSignedIn()) {
      return route.guestRedirect ?? `/login?next=${encodeURIComponent(url.pathname + url.search)}`;
    }
    if (route.guestOnly && isSignedIn()) {
      const next = url.searchParams.get('next');
      // Only follow same-site paths, never "//evil.example" or absolute URLs.
      return next?.startsWith('/') && !next.startsWith('//') ? next : '/';
    }
    return null;
  }

  function focusPage() {
    const heading = outlet.querySelector('h1');
    const target = heading ?? outlet;
    if (heading) heading.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  function restoreScroll(url, isPopState) {
    const anchor = url.hash && document.getElementById(url.hash.slice(1));
    if (anchor && !isPopState) return anchor.scrollIntoView();
    window.scrollTo(0, isPopState ? (scrollPositions.get(history.state?.key) ?? 0) : 0);
  }

  async function renderPage(pageModule, context) {
    try {
      const module = await pageModule();
      return await module.render(outlet, context);
    } catch (error) {
      if (error.name === 'AbortError') return null;
      console.error(error);
      const module = await errorPage();
      return module.render(outlet, { ...context, error });
    }
  }

  async function handleLocation({ isPopState = false } = {}) {
    const currentNavigation = ++navigationId;
    const url = new URL(window.location.href);
    const matched = match(url.pathname);

    const redirect = matched && resolveRedirect(matched.route, url);
    if (redirect) return navigate(redirect, { replace: true });

    cleanupCurrentPage?.();
    cleanupCurrentPage = null;
    abortController?.abort();
    abortController = new AbortController();

    const context = {
      params: matched?.params ?? {},
      query: url.searchParams,
      signal: abortController.signal,
      navigate,
    };
    outlet.setAttribute('aria-busy', 'true');
    onRouteChange?.(url.pathname);

    // Only flash a skeleton for slow pages; fast ones swap in without flicker.
    const skeletonTimer = setTimeout(() => renderLoading?.(outlet), SKELETON_DELAY_MS);
    const cleanup = await renderPage(matched?.route.page ?? notFoundPage, context);
    clearTimeout(skeletonTimer);
    if (currentNavigation !== navigationId) return cleanup?.();

    cleanupCurrentPage = typeof cleanup === 'function' ? cleanup : null;
    outlet.removeAttribute('aria-busy');
    const title = outlet.querySelector('[data-page-title]')?.dataset.pageTitle;
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;

    restoreScroll(url, isPopState);
    if (!isPopState) focusPage();
  }

  function navigate(path, { replace = false } = {}) {
    scrollPositions.set(history.state?.key, window.scrollY);
    const depth = history.state?.depth ?? 0;
    const state = { key: crypto.randomUUID(), depth: replace ? depth : depth + 1 };
    if (replace) history.replaceState(state, '', path);
    else history.pushState(state, '', path);
    return handleLocation();
  }

  function handleLinkClick(event) {
    const link = event.target.closest('a[href]');
    if (!link || isModifiedClick(event) || event.defaultPrevented) return;
    if (link.target === '_blank' || link.hasAttribute('download') || link.dataset.external) return;

    const url = new URL(link.href);
    if (url.origin !== window.location.origin || url.pathname.startsWith('/api/')) return;

    event.preventDefault();
    if (url.href !== window.location.href) navigate(url.pathname + url.search + url.hash);
  }

  return {
    navigate,
    refresh: () => handleLocation(),
    start() {
      if (!history.state?.key) history.replaceState({ key: crypto.randomUUID(), depth: 0 }, '');
      history.scrollRestoration = 'manual';
      document.addEventListener('click', handleLinkClick);
      window.addEventListener('popstate', () => handleLocation({ isPopState: true }));
      return handleLocation();
    },
  };
}
