import { getCurrentUser } from '../state/session.js';
import { html } from '../utils/escapeHtml.js';
import { formatCount, formatDateTime, formatRelativeTime } from '../utils/formatTime.js';
import { formatRichText } from '../utils/richText.js';
import { Avatar } from './Avatar.js';
import { icon } from './icons.js';
import { LikeButton } from './LikeButton.js';

function OwnerMenu(post) {
  return html`<details class="menu" data-menu>
    <summary class="icon-button menu__trigger" aria-label="Post options">${icon('more')}</summary>
    <div class="menu__list">
      <button class="menu__item" type="button" data-action="edit-post" data-post-id="${post.id}">
        ${icon('edit')} Edit
      </button>
      <button
        class="menu__item menu__item--danger"
        type="button"
        data-action="delete-post"
        data-post-id="${post.id}"
      >
        ${icon('trash')} Delete
      </button>
    </div>
  </details>`;
}

function PostImage(post) {
  if (!post.imageUrl?.startsWith('https://')) return '';
  return html`<a
    class="post-card__media"
    href="${post.imageUrl}"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Open image in a new tab"
  >
    <img src="${post.imageUrl}" alt="Image attached to the post" loading="lazy" decoding="async" />
  </a>`;
}

/**
 * A post in a feed or on its detail page. Interactions are handled by
 * `bindPostInteractions` through event delegation, not per-card listeners.
 * @param {object} post
 * @param {{ isDetail?: boolean }} [options]
 */
export function PostCard(post, { isDetail = false } = {}) {
  const isOwn = getCurrentUser()?.id === post.author.id;
  const postUrl = `/p/${post.id}`;
  const commentLabel = `${post.commentsCount} ${post.commentsCount === 1 ? 'comment' : 'comments'}`;

  return html`<article
    class="post-card ${isDetail ? 'post-card--detail' : ''}"
    data-post-id="${post.id}"
    data-post-url="${postUrl}"
    aria-labelledby="post-${post.id}-author"
  >
    <a class="post-card__avatar" href="/u/${post.author.username}" tabindex="-1" aria-hidden="true">
      ${Avatar(post.author, isDetail ? 'lg' : 'md')}
    </a>
    <div class="post-card__body">
      <header class="post-card__header">
        <a class="post-card__author" id="post-${post.id}-author" href="/u/${post.author.username}">
          <span class="post-card__name">${post.author.displayName}</span>
          <span class="post-card__handle">@${post.author.username}</span>
        </a>
        <span class="post-card__dot" aria-hidden="true">·</span>
        <a class="post-card__time" href="${postUrl}">
          <time datetime="${post.createdAt}" title="${formatDateTime(post.createdAt)}">
            ${isDetail ? formatDateTime(post.createdAt) : formatRelativeTime(post.createdAt)}
          </time>
        </a>
        <span class="post-card__edited" data-post-edited ${post.editedAt ? '' : html`hidden`}
          >· edited</span
        >
        ${isOwn ? OwnerMenu(post) : ''}
      </header>
      <div class="post-card__content" data-post-content data-raw-content="${post.content}">
        ${formatRichText(post.content)}
      </div>
      ${PostImage(post)}
      <footer class="post-card__actions">
        ${LikeButton({ kind: 'post', id: post.id, likesCount: post.likesCount, hasLiked: post.hasLiked })}
        <a
          class="action-button action-button--comment"
          href="${postUrl}#comments"
          aria-label="${commentLabel}"
        >
          ${icon('comment')}
          <span class="action-button__count" data-comment-count="${post.commentsCount}"
            >${post.commentsCount ? formatCount(post.commentsCount) : ''}</span
          >
        </a>
      </footer>
    </div>
  </article>`;
}
