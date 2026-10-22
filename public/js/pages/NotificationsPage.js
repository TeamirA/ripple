import { notificationsApi } from '../api/notificationsApi.js';
import { EmptyState } from '../components/EmptyState.js';
import { createInfiniteList } from '../components/InfiniteList.js';
import { NotificationItem } from '../components/NotificationItem.js';
import { PageHeader } from '../components/PageHeader.js';
import { createSkeletonLoader, UserSkeleton } from '../components/Skeleton.js';
import { showErrorToast } from '../components/Toast.js';
import { store } from '../state/store.js';
import { refreshUnreadCount } from '../state/unreadNotifications.js';
import { html } from '../utils/escapeHtml.js';
import { setBusy, setHtml } from '../utils/dom.js';

/** Activity on your posts and profile, newest first. */
export function render(container) {
  setHtml(
    container,
    html`<section class="page">
      ${PageHeader({
        title: 'Notifications',
        actions: html`<button
          class="button button--ghost button--sm"
          type="button"
          data-mark-all-read
        >
          Mark all as read
        </button>`,
      })}
      <div data-notifications></div>
    </section>`,
  );

  const list = createInfiniteList({
    container: container.querySelector('[data-notifications]'),
    label: 'Notifications',
    role: 'list',
    fetchPage: (cursor, signal) => notificationsApi.list({ cursor }, { signal }),
    renderItem: NotificationItem,
    renderLoading: createSkeletonLoader(() => UserSkeleton(6)),
    renderEmpty: () =>
      EmptyState({
        icon: 'bell',
        title: 'No notifications yet',
        message: 'Likes, comments, replies and new followers will show up here.',
      }),
  });

  const markAllButton = container.querySelector('[data-mark-all-read]');
  markAllButton.addEventListener('click', async () => {
    setBusy(markAllButton, true);
    try {
      await notificationsApi.markAllRead();
      container.querySelectorAll('.notification.is-unread').forEach((item) => {
        item.classList.remove('is-unread');
        item.querySelector('.visually-hidden')?.remove();
      });
      store.setState({ unreadCount: 0 });
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(markAllButton, false);
    }
  });

  refreshUnreadCount();
  return () => list.destroy();
}
