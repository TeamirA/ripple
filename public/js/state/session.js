import { authApi } from '../api/authApi.js';
import { onUnauthorized } from '../api/httpClient.js';
import { store } from './store.js';

export function getCurrentUser() {
  return store.getState().currentUser;
}

export function isSignedIn() {
  return Boolean(getCurrentUser());
}

export function setCurrentUser(user) {
  store.setState({ currentUser: user });
}

/** Restores the session from the httpOnly cookie on page load. */
export async function restoreSession() {
  try {
    const { user } = await authApi.getSession();
    setCurrentUser(user);
  } catch {
    setCurrentUser(null);
  }
}

export async function signOut() {
  try {
    await authApi.logout();
  } finally {
    store.setState({ currentUser: null, unreadCount: 0 });
  }
}

// A 401 anywhere means the cookie expired or was revoked (e.g. password changed elsewhere).
onUnauthorized(() => {
  if (isSignedIn()) store.setState({ currentUser: null, unreadCount: 0 });
});
