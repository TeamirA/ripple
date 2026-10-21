import { html } from '../utils/escapeHtml.js';
import { formatDateTime, formatRelativeTime } from '../utils/formatTime.js';
import { Avatar } from './Avatar.js';
import { icon } from './icons.js';

const NOTIFICATION_COPY = {
  FOLLOW: { icon: 'userPlus', text: 'followed you' },
  COMMENT: { icon: 'comment', text: 'commented on your post' },
  REPLY: { icon: 'comment', text: 'replied to your comment' },
  LIKE: { icon: 'heart', text: 'liked your post' },
};

function describe(notification) {
  if (notification.type === 'LIKE' && notification.comment) {
    return { icon: 'heart', text: 'liked your comment' };
  }
  return NOTIFICATION_COPY[notification.type];
}

function getTargetUrl(notification) {
  if (notification.type === 'FOLLOW' || !notification.post)
    return `/u/${notification.actor.username}`;
  return `/p/${notification.post.id}${notification.comment ? '#comments' : ''}`;
}

/** One row in the notifications list. */
export function NotificationItem(notification) {
  const { icon: iconName, text } = describe(notification);
  const preview = notification.comment?.preview ?? notification.post?.preview;
  return html`<a
    class="notification ${notification.isRead ? '' : 'is-unread'}"
    href="${getTargetUrl(notification)}"
    role="listitem"
  >
    <span class="notification__icon notification__icon--${notification.type.toLowerCase()}"
      >${icon(iconName)}</span
    >
    <span class="notification__body">
      ${Avatar(notification.actor, 'sm')}
      <span class="notification__text">
        <strong>${notification.actor.displayName}</strong> ${text}
        <time
          class="notification__time"
          datetime="${notification.createdAt}"
          title="${formatDateTime(notification.createdAt)}"
          >· ${formatRelativeTime(notification.createdAt)}</time
        >
      </span>
      ${preview ? html`<span class="notification__preview">${preview}</span>` : ''}
    </span>
    ${notification.isRead ? '' : html`<span class="visually-hidden">Unread</span>`}
  </a>`;
}
