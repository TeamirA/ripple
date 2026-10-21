import { notificationsApi } from '../api/notificationsApi.js';
import { isSignedIn } from './session.js';
import { store } from './store.js';

const POLL_INTERVAL_MS = 30_000;
let intervalId = null;

/** Fetches the unread count; failures are ignored because the badge is non-critical. */
export async function refreshUnreadCount() {
  if (!isSignedIn()) return;
  try {
    const { unreadCount } = await notificationsApi.getUnreadCount();
    store.setState({ unreadCount });
  } catch {
    // Keep the last known count.
  }
}

/** Polls while the tab is visible and a user is signed in. */
export function startUnreadPolling() {
  const tick = () => document.visibilityState === 'visible' && refreshUnreadCount();
  clearInterval(intervalId);
  intervalId = setInterval(tick, POLL_INTERVAL_MS);
  document.addEventListener('visibilitychange', tick);
  store.subscribe((state) => state.currentUser?.id, refreshUnreadCount);
  refreshUnreadCount();
}
