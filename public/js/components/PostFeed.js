import { EmptyState } from './EmptyState.js';
import { createInfiniteList } from './InfiniteList.js';
import { PostCard } from './PostCard.js';
import { bindPostInteractions } from './postInteractions.js';
import { createSkeletonLoader, PostSkeleton } from './Skeleton.js';

/**
 * An infinite list of PostCards with likes/edit/delete wired up.
 * @param {HTMLElement} container
 * @param {{ label: string, fetchPage: Function, emptyState: object, navigate: Function }} options
 * @returns {{ prependPost: (post: object) => void, destroy: () => void }}
 */
export function mountPostFeed(container, { label, fetchPage, emptyState, navigate }) {
  const list = createInfiniteList({
    container,
    label,
    fetchPage,
    renderItem: (post) => PostCard(post),
    renderEmpty: () => EmptyState(emptyState),
    renderLoading: createSkeletonLoader(PostSkeleton),
  });
  const unbind = bindPostInteractions(container, {
    navigate,
    onPostDeleted: () => list.notifyItemRemoved(),
  });

  return {
    prependPost: (post) => list.prepend(post),
    destroy() {
      list.destroy();
      unbind();
    },
  };
}
