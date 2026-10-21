import { html } from '../utils/escapeHtml.js';
import { formatCount, formatJoinDate } from '../utils/formatTime.js';
import { formatRichText } from '../utils/richText.js';
import { Avatar } from './Avatar.js';
import { FollowButton } from './FollowButton.js';
import { icon } from './icons.js';

function ProfileStat(href, count, label, dataKey) {
  return html`<a class="profile__stat" href="${href}">
    <strong data-stat="${dataKey}">${formatCount(count)}</strong> <span>${label}</span>
  </a>`;
}

/** Banner, avatar, names, bio and follower counts for a profile page. */
export function ProfileHeader(profile) {
  const base = `/u/${profile.username}`;
  return html`<div class="profile">
    <div class="profile__banner" data-banner></div>
    <div class="profile__top">
      <div class="profile__avatar">${Avatar(profile, 'xl')}</div>
      <div class="profile__actions">
        ${
          profile.isSelf
            ? html`<button
                class="button button--secondary"
                type="button"
                data-action="edit-profile"
              >
                Edit profile
              </button>`
            : FollowButton(profile, { size: 'md' })
        }
      </div>
    </div>
    <div class="profile__info">
      <h2 class="profile__name">${profile.displayName}</h2>
      <p class="profile__handle">@${profile.username}</p>
      ${profile.bio ? html`<p class="profile__bio">${formatRichText(profile.bio)}</p>` : ''}
      <p class="profile__meta">${icon('calendar')} ${formatJoinDate(profile.createdAt)}</p>
      <div class="profile__stats">
        ${ProfileStat(`${base}/following`, profile.followingCount, 'Following', 'following')}
        ${ProfileStat(`${base}/followers`, profile.followersCount, 'Followers', 'followers')}
      </div>
    </div>
  </div>`;
}
