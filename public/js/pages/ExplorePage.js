import { feedApi } from '../api/feedApi.js';
import { PageHeader } from '../components/PageHeader.js';
import { mountPostFeed } from '../components/PostFeed.js';
import { Tabs } from '../components/Tabs.js';
import { html } from '../utils/escapeHtml.js';
import { setHtml } from '../utils/dom.js';

const SORTS = {
  recent: {
    label: 'Latest',
    emptyState: { title: 'Nothing here yet', message: 'Be the first to post something.' },
  },
  trending: {
    label: 'Trending',
    emptyState: {
      icon: 'sparkles',
      title: 'Nothing is trending right now',
      message: 'Posts with the most likes in the last 48 hours show up here.',
    },
  },
};

/** Explore: every post, newest first or most liked in the last 48 hours. */
export function render(container, { query, navigate }) {
  const sort = SORTS[query.get('sort')] ? query.get('sort') : 'recent';

  setHtml(
    container,
    html`<section class="page">
      ${PageHeader({ title: 'Explore', subtitle: 'See what everyone on Ripple is talking about' })}
      ${Tabs({
        label: 'Explore feeds',
        activeKey: sort,
        items: Object.entries(SORTS).map(([key, { label }]) => ({
          key,
          label,
          href: key === 'recent' ? '/explore' : `/explore?sort=${key}`,
        })),
      })}
      <div data-feed></div>
    </section>`,
  );

  const feed = mountPostFeed(container.querySelector('[data-feed]'), {
    label: `${SORTS[sort].label} posts`,
    navigate,
    fetchPage: (cursor, signal) => feedApi.getExplore({ sort, cursor }, { signal }),
    emptyState: SORTS[sort].emptyState,
  });
  return () => feed.destroy();
}
