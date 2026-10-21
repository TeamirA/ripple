import { commentsApi } from '../api/commentsApi.js';
import { getCurrentUser } from '../state/session.js';
import { html } from '../utils/escapeHtml.js';
import { createElement, delegate, insertHtml } from '../utils/dom.js';
import { formatDateTime, formatRelativeTime } from '../utils/formatTime.js';
import { pluralize } from '../utils/pluralize.js';
import { formatRichText } from '../utils/richText.js';
import { Avatar } from './Avatar.js';
import { mountCommentForm } from './CommentForm.js';
import { EmptyState } from './EmptyState.js';
import { icon } from './icons.js';
import { createInfiniteList } from './InfiniteList.js';
import { LikeButton, toggleLike } from './LikeButton.js';
import { confirmDialog } from './Modal.js';
import { showErrorToast } from './Toast.js';

function Comment(comment, { canModerate }) {
  const viewerId = getCurrentUser()?.id;
  const canDelete = viewerId === comment.author.id || canModerate;
  return html`<article
    class="comment"
    data-comment-id="${comment.id}"
    aria-labelledby="comment-${comment.id}-author"
  >
    <a href="/u/${comment.author.username}" tabindex="-1" aria-hidden="true"
      >${Avatar(comment.author, 'sm')}</a
    >
    <div class="comment__body">
      <header class="comment__header">
        <a
          class="comment__author"
          id="comment-${comment.id}-author"
          href="/u/${comment.author.username}"
          >${comment.author.displayName}</a
        >
        <span class="comment__meta"
          >@${comment.author.username} ·
          <time datetime="${comment.createdAt}" title="${formatDateTime(comment.createdAt)}"
            >${formatRelativeTime(comment.createdAt)}</time
          >
        </span>
      </header>
      <div class="comment__content">${formatRichText(comment.content)}</div>
      <footer class="comment__actions">
        ${LikeButton({ kind: 'comment', id: comment.id, likesCount: comment.likesCount, hasLiked: comment.hasLiked })}
        ${viewerId ? html`<button class="action-button" type="button" data-action="reply" data-username="${comment.author.username}">${icon('comment')} Reply</button>` : ''}
        ${canDelete ? html`<button class="action-button action-button--danger" type="button" data-action="delete-comment" aria-label="Delete comment">${icon('trash')}</button>` : ''}
      </footer>
    </div>
  </article>`;
}

function MoreRepliesButton(hiddenCount) {
  if (hiddenCount <= 0) return '';
  return html`<button class="comment-thread__more" type="button" data-action="load-replies">
    View ${hiddenCount} more ${pluralize(hiddenCount, 'reply', 'replies')}
  </button>`;
}

function Thread(comment, options) {
  const replies = comment.replies ?? [];
  return html`<div
    class="comment-thread"
    data-thread-id="${comment.id}"
    data-replies-count="${comment.repliesCount}"
  >
    ${Comment(comment, options)}
    <div class="comment-thread__replies" data-replies>
      ${replies.map((reply) => Comment(reply, options))}
    </div>
    <div data-more-replies>${MoreRepliesButton(comment.repliesCount - replies.length)}</div>
    <div data-reply-slot></div>
  </div>`;
}

async function loadAllReplies(thread, options) {
  const repliesContainer = thread.querySelector('[data-replies]');
  const renderedIds = new Set(
    [...repliesContainer.querySelectorAll('[data-comment-id]')].map((el) => el.dataset.commentId),
  );
  let cursor = null;
  do {
    const page = await commentsApi.listReplies(thread.dataset.threadId, { cursor, limit: 50 });
    const newReplies = page.data.filter((reply) => !renderedIds.has(reply.id));
    insertHtml(repliesContainer, 'beforeend', html`${newReplies.map((r) => Comment(r, options))}`);
    cursor = page.nextCursor;
  } while (cursor);
  thread.querySelector('[data-more-replies]').replaceChildren();
}

/**
 * Comments section for a post: top-level comments with one level of replies.
 * @param {HTMLElement} container
 * @param {{ postId: string, postAuthorId: string, onCountChange: (delta: number) => void }} options
 */
export function mountCommentThread(container, { postId, postAuthorId, onCountChange }) {
  const options = { canModerate: getCurrentUser()?.id === postAuthorId };
  container.append(
    createElement(
      html`<section class="comments" id="comments" aria-labelledby="comments-heading">
        <h2 class="comments__heading" id="comments-heading">Comments</h2>
        <div data-top-form></div>
        <div data-comment-list></div>
      </section>`,
    ),
  );

  const list = createInfiniteList({
    container: container.querySelector('[data-comment-list]'),
    label: 'Comments',
    role: 'list',
    fetchPage: (cursor, signal) => commentsApi.list(postId, { cursor }, { signal }),
    renderItem: (comment) => Thread(comment, options),
    renderEmpty: () =>
      EmptyState({ icon: 'comment', title: 'No comments yet', message: 'Start the conversation.' }),
  });

  if (getCurrentUser()) {
    mountCommentForm(container.querySelector('[data-top-form]'), {
      postId,
      placeholder: 'Write a comment…',
      onCreated: (comment) => {
        list.prepend({ ...comment, replies: [] });
        onCountChange(1);
      },
    });
  }

  async function deleteComment(commentElement) {
    const isConfirmed = await confirmDialog({
      title: 'Delete comment?',
      message: 'This comment and any replies to it will be removed.',
      confirmLabel: 'Delete',
    });
    if (!isConfirmed) return;
    try {
      await commentsApi.remove(commentElement.dataset.commentId);
      const thread = commentElement.closest('.comment-thread');
      const isTopLevel = thread.dataset.threadId === commentElement.dataset.commentId;
      if (isTopLevel) {
        onCountChange(-(1 + Number(thread.dataset.repliesCount)));
        thread.remove();
        list.notifyItemRemoved();
      } else {
        thread.dataset.repliesCount = String(Number(thread.dataset.repliesCount) - 1);
        commentElement.remove();
        onCountChange(-1);
      }
    } catch (error) {
      showErrorToast(error);
    }
  }

  function openReplyForm(button) {
    const thread = button.closest('.comment-thread');
    const slot = thread.querySelector('[data-reply-slot]');
    slot.replaceChildren();
    mountCommentForm(slot, {
      postId,
      parentId: thread.dataset.threadId,
      initialText: `@${button.dataset.username} `,
      placeholder: 'Write a reply…',
      autofocus: true,
      onCancel: () => slot.replaceChildren(),
      onCreated: (reply) => {
        insertHtml(thread.querySelector('[data-replies]'), 'beforeend', Comment(reply, options));
        thread.dataset.repliesCount = String(Number(thread.dataset.repliesCount) + 1);
        slot.replaceChildren();
        onCountChange(1);
      },
    });
  }

  const cleanups = [
    delegate(container, 'click', '[data-action="toggle-like"]', (_e, button) => toggleLike(button)),
    delegate(container, 'click', '[data-action="reply"]', (_e, button) => openReplyForm(button)),
    delegate(container, 'click', '[data-action="delete-comment"]', (_e, button) =>
      deleteComment(button.closest('.comment')),
    ),
    delegate(container, 'click', '[data-action="load-replies"]', (_e, button) => {
      button.disabled = true;
      loadAllReplies(button.closest('.comment-thread'), options).catch((error) => {
        button.disabled = false;
        showErrorToast(error);
      });
    }),
  ];

  return () => {
    list.destroy();
    cleanups.forEach((cleanup) => cleanup());
  };
}
