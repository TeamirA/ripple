/** Route table. Pages load on demand, so each screen only downloads its own code. */
export const routes = [
  { path: '/login', page: () => import('./pages/LoginPage.js'), guestOnly: true },
  { path: '/register', page: () => import('./pages/RegisterPage.js'), guestOnly: true },
];

export const notFoundPage = () => import('./pages/NotFoundPage.js');
export const errorPage = () => import('./pages/ErrorPage.js');
