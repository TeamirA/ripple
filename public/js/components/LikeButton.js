import { commentsApi } from '../api/commentsApi.js';
import { postsApi } from '../api/postsApi.js';
import { isSignedIn } from '../state/session.js';
import { html } from '../utils/escapeHtml.js';
import { formatCount } from '../utils/formatTime.js';
import { icon } from './icons.js';
import { showErrorToast, showToast } from './Toast.js';

const LIKE_REQUESTS = {
  post: { like: postsApi.like, unlike: postsApi.unlike },
  comment: { like: commentsApi.like, unlike: commentsApi.unlike },
};

/**
 * @param {{ kind: 'post' | 'comment', id: string, likesCount: number, hasLiked: boolean }} props
 */
export function LikeButton({ kind, id, likesCount, hasLiked }) {
  return html`<button
    class="action-button action-button--like"
    type="button"
    data-action="toggle-like"
    data-like-kind="${kind}"
    data-like-id="${id}"
    aria-pressed="${hasLiked}"
    aria-label="Like"
  >
    ${icon('heart')}
    <span class="action-button__count" data-like-count="${likesCount}"
      >${likesCount ? formatCount(likesCount) : ''}</span
    >
  </button>`;
}

function renderLikeState(button, { hasLiked, likesCount }) {
  button.setAttribute('aria-pressed', String(hasLiked));
  const counter = button.querySelector('[data-like-count]');
  counter.dataset.likeCount = String(likesCount);
  counter.textContent = likesCount ? formatCount(likesCount) : '';
}

/**
 * Optimistically flips the like, then reconciles with the server's count
 * (or rolls back if the request fails).
 */
export async function toggleLike(button) {
  if (!isSignedIn()) {
    showToast('Log in to like posts and comments.');
    return;
  }
  if (button.dataset.pending) return;

  const { likeKind, likeId } = button.dataset;
  const previous = {
    hasLiked: button.getAttribute('aria-pressed') === 'true',
    likesCount: Number(button.querySelector('[data-like-count]').dataset.likeCount),
  };
  const optimistic = {
    hasLiked: !previous.hasLiked,
    likesCount: Math.max(0, previous.likesCount + (previous.hasLiked ? -1 : 1)),
  };

  renderLikeState(button, optimistic);
  button.classList.toggle('is-popping', optimistic.hasLiked);
  button.dataset.pending = 'true';
  try {
    const request = LIKE_REQUESTS[likeKind][optimistic.hasLiked ? 'like' : 'unlike'];
    renderLikeState(button, await request(likeId));
  } catch (error) {
    renderLikeState(button, previous);
    showErrorToast(error);
  } finally {
    delete button.dataset.pending;
  }
}
