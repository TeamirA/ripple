import { followsApi } from '../api/followsApi.js';
import { usersApi } from '../api/usersApi.js';
import { openEditProfileModal } from '../components/EditProfileModal.js';
import { bindFollowButtons, FOLLOW_CHANGED_EVENT } from '../components/FollowButton.js';
import { bindBackButton, PageHeader } from '../components/PageHeader.js';
import { mountPostFeed } from '../components/PostFeed.js';
import { ProfileHeader } from '../components/ProfileHeader.js';
import { Tabs } from '../components/Tabs.js';
import { mountUserList } from '../components/UserList.js';
import { html } from '../utils/escapeHtml.js';
import { setHtml } from '../utils/dom.js';
import { formatCount } from '../utils/formatTime.js';
import { pluralize } from '../utils/pluralize.js';

const TABS = ['posts', 'followers', 'following'];

function mountTabContent(container, tab, profile, navigate) {
  const name = profile.displayName;
  if (tab === 'followers') {
    return mountUserList(container, {
      label: `People following ${name}`,
      fetchPage: (cursor, signal) =>
        followsApi.getFollowers(profile.username, { cursor }, { signal }),
      emptyState: {
        icon: 'user',
        title: 'No followers yet',
        message: `When people follow ${name}, they’ll appear here.`,
      },
    });
  }
  if (tab === 'following') {
    return mountUserList(container, {
      label: `People ${name} follows`,
      fetchPage: (cursor, signal) =>
        followsApi.getFollowing(profile.username, { cursor }, { signal }),
      emptyState: {
        icon: 'userPlus',
        title: 'Not following anyone yet',
        message: `${name} hasn’t followed anyone.`,
      },
    });
  }
  const feed = mountPostFeed(container, {
    label: `Posts by ${name}`,
    navigate,
    fetchPage: (cursor, signal) => usersApi.getPosts(profile.username, { cursor }, { signal }),
    emptyState: profile.isSelf
      ? {
          icon: 'edit',
          title: 'You haven’t posted yet',
          message: 'Share your first thought with Ripple.',
          action: { label: 'Write a post', href: '/?compose=1' },
        }
      : { icon: 'edit', title: 'No posts yet', message: `${name} hasn’t posted anything.` },
  });
  return () => feed.destroy();
}

/** Public profile at /u/:username with Posts / Followers / Following tabs. */
export async function render(container, { params, navigate, signal }) {
  const tab = params.tab ?? 'posts';
  if (!TABS.includes(tab)) throw Object.assign(new Error('Page not found'), { status: 404 });

  const { user: profile } = await usersApi.getProfile(params.username, { signal });
  const base = `/u/${profile.username}`;
  setHtml(
    container,
    html`<section class="page">
      ${PageHeader({
        title: profile.displayName,
        subtitle: `${formatCount(profile.postsCount)} ${pluralize(profile.postsCount, 'post')}`,
        hasBackButton: true,
      })}
      ${ProfileHeader(profile)}
      ${Tabs({
        label: 'Profile sections',
        activeKey: tab,
        items: [
          { key: 'posts', label: 'Posts', href: base },
          { key: 'followers', label: 'Followers', href: `${base}/followers` },
          { key: 'following', label: 'Following', href: `${base}/following` },
        ],
      })}
      <div data-tab-content></div>
    </section>`,
  );

  // Inline style attributes are blocked by the CSP; setting it through the CSSOM is allowed.
  container.querySelector('[data-banner]').style.setProperty('--banner-color', profile.bannerColor);
  bindBackButton(container, navigate);
  const unbindHeaderFollow = bindFollowButtons(container.querySelector('.profile'));
  const destroyTab = mountTabContent(
    container.querySelector('[data-tab-content]'),
    tab,
    profile,
    navigate,
  );

  container.querySelector('[data-action="edit-profile"]')?.addEventListener('click', () =>
    openEditProfileModal(profile, {
      onSaved: () => navigate(window.location.pathname, { replace: true }),
    }),
  );

  const updateFollowerCount = (event) => {
    if (event.detail.username !== profile.username) return;
    container.querySelector('[data-stat="followers"]').textContent = formatCount(
      event.detail.followersCount,
    );
  };
  document.addEventListener(FOLLOW_CHANGED_EVENT, updateFollowerCount);

  return () => {
    destroyTab();
    unbindHeaderFollow();
    document.removeEventListener(FOLLOW_CHANGED_EVENT, updateFollowerCount);
  };
}
