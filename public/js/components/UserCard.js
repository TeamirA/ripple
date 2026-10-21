import { html } from '../utils/escapeHtml.js';
import { Avatar } from './Avatar.js';
import { FollowButton } from './FollowButton.js';

/**
 * @param {{ username: string, displayName: string, avatarUrl?: string, bio?: string,
 *   isFollowing: boolean, isSelf: boolean }} user
 * @param {{ isCompact?: boolean }} [options] compact cards hide the bio (sidebar)
 */
export function UserCard(user, { isCompact = false } = {}) {
  return html`<div
    class="user-card ${isCompact ? 'user-card--compact' : ''}"
    data-user-id="${user.id}"
  >
    <a class="user-card__link" href="/u/${user.username}">
      ${Avatar(user)}
      <span class="user-card__text">
        <span class="user-card__name">${user.displayName}</span>
        <span class="user-card__handle">@${user.username}</span>
        ${!isCompact && user.bio ? html`<span class="user-card__bio">${user.bio}</span>` : ''}
      </span>
    </a>
    ${FollowButton(user)}
  </div>`;
}
