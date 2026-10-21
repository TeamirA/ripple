/** Route table. Pages load on demand, so each screen only downloads its own code. */
export const routes = [
  {
    path: '/',
    page: () => import('./pages/FeedPage.js'),
    requiresAuth: true,
    guestRedirect: '/explore',
  },
  { path: '/explore', page: () => import('./pages/ExplorePage.js') },
  { path: '/search', page: () => import('./pages/SearchPage.js') },
  { path: '/p/:postId', page: () => import('./pages/PostDetailPage.js') },
  { path: '/u/:username', page: () => import('./pages/ProfilePage.js') },
  { path: '/u/:username/:tab', page: () => import('./pages/ProfilePage.js') },
  {
    path: '/notifications',
    page: () => import('./pages/NotificationsPage.js'),
    requiresAuth: true,
  },
  { path: '/settings', page: () => import('./pages/SettingsPage.js'), requiresAuth: true },
  { path: '/login', page: () => import('./pages/LoginPage.js'), guestOnly: true },
  { path: '/register', page: () => import('./pages/RegisterPage.js'), guestOnly: true },
];

export const notFoundPage = () => import('./pages/NotFoundPage.js');
export const errorPage = () => import('./pages/ErrorPage.js');
