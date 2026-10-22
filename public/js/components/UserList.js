import { EmptyState } from './EmptyState.js';
import { bindFollowButtons } from './FollowButton.js';
import { createInfiniteList } from './InfiniteList.js';
import { createSkeletonLoader, UserSkeleton } from './Skeleton.js';
import { UserCard } from './UserCard.js';

/**
 * Infinite list of UserCards with working follow buttons.
 * @returns {() => void} cleanup
 */
export function mountUserList(container, { label, fetchPage, emptyState }) {
  const list = createInfiniteList({
    container,
    label,
    role: 'list',
    fetchPage,
    renderItem: (user) => UserCard(user),
    renderEmpty: () => EmptyState(emptyState),
    renderLoading: createSkeletonLoader(UserSkeleton),
  });
  const unbind = bindFollowButtons(container);
  return () => {
    list.destroy();
    unbind();
  };
}
