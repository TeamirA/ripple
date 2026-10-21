import { postsApi } from '../api/postsApi.js';
import { mountCommentThread } from '../components/CommentThread.js';
import { bindBackButton, PageHeader } from '../components/PageHeader.js';
import { PostCard } from '../components/PostCard.js';
import { bindPostInteractions } from '../components/postInteractions.js';
import { html } from '../utils/escapeHtml.js';
import { setHtml } from '../utils/dom.js';
import { formatCount } from '../utils/formatTime.js';

function updateCommentCount(container, delta) {
  const counter = container.querySelector('[data-comment-count]');
  const count = Math.max(0, Number(counter.dataset.commentCount) + delta);
  counter.dataset.commentCount = String(count);
  counter.textContent = count ? formatCount(count) : '';
}

/** A single post with its full comment thread. */
export async function render(container, { params, navigate, signal }) {
  const { post } = await postsApi.get(params.postId, { signal });

  setHtml(
    container,
    html`<section class="page">
      ${PageHeader({ title: 'Post', hasBackButton: true })} ${PostCard(post, { isDetail: true })}
      <div data-comments></div>
    </section>`,
  );
  bindBackButton(container, navigate);

  const unbindPost = bindPostInteractions(container, {
    navigate,
    onPostDeleted: () => navigate('/', { replace: true }),
  });
  const destroyThread = mountCommentThread(container.querySelector('[data-comments]'), {
    postId: post.id,
    postAuthorId: post.author.id,
    onCountChange: (delta) => updateCommentCount(container, delta),
  });

  return () => {
    unbindPost();
    destroyThread();
  };
}
