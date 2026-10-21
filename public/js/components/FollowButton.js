import { followsApi } from '../api/followsApi.js';
import { isSignedIn } from '../state/session.js';
import { html } from '../utils/escapeHtml.js';
import { delegate } from '../utils/dom.js';
import { showErrorToast, showToast } from './Toast.js';

export const FOLLOW_CHANGED_EVENT = 'ripple:follow-changed';

/** @param {{ username: string, isFollowing: boolean, isSelf?: boolean }} user */
export function FollowButton(user, { size = 'sm' } = {}) {
  if (user.isSelf) return '';
  const sizeClass = size === 'sm' ? 'button--sm' : '';
  return html`<button
    class="button ${sizeClass} follow-button ${user.isFollowing ? 'button--secondary' : 'button--primary'}"
    type="button"
    data-action="toggle-follow"
    data-username="${user.username}"
    aria-pressed="${user.isFollowing}"
  >
    <span class="follow-button__label">${user.isFollowing ? 'Following' : 'Follow'}</span>
    <span class="follow-button__hover" aria-hidden="true">Unfollow</span>
  </button>`;
}

function renderFollowState(button, isFollowing) {
  button.setAttribute('aria-pressed', String(isFollowing));
  button.classList.toggle('button--primary', !isFollowing);
  button.classList.toggle('button--secondary', isFollowing);
  button.querySelector('.follow-button__label').textContent = isFollowing ? 'Following' : 'Follow';
}

/** Optimistic follow toggle; broadcasts the result so profile counters can update. */
async function toggleFollow(button) {
  if (!isSignedIn()) {
    showToast('Log in to follow people.');
    return;
  }
  if (button.dataset.pending) return;

  const { username } = button.dataset;
  const wasFollowing = button.getAttribute('aria-pressed') === 'true';
  renderFollowState(button, !wasFollowing);
  button.dataset.pending = 'true';
  try {
    const result = wasFollowing
      ? await followsApi.unfollow(username)
      : await followsApi.follow(username);
    document.dispatchEvent(
      new CustomEvent(FOLLOW_CHANGED_EVENT, { detail: { username, ...result } }),
    );
  } catch (error) {
    renderFollowState(button, wasFollowing);
    showErrorToast(error);
  } finally {
    delete button.dataset.pending;
  }
}

/** Handles every follow button inside `root` with one delegated listener. */
export function bindFollowButtons(root) {
  return delegate(root, 'click', '[data-action="toggle-follow"]', (_event, button) =>
    toggleFollow(button),
  );
}
