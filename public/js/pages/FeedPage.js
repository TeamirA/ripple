import { feedApi } from '../api/feedApi.js';
import { mountComposer } from '../components/Composer.js';
import { PageHeader } from '../components/PageHeader.js';
import { mountPostFeed } from '../components/PostFeed.js';
import { html } from '../utils/escapeHtml.js';
import { setHtml } from '../utils/dom.js';

/** Home: composer plus posts from the people you follow. */
export function render(container, { query, navigate }) {
  setHtml(
    container,
    html`<section class="page">
      ${PageHeader({ title: 'Home' })}
      <div data-composer-slot></div>
      <div data-feed></div>
    </section>`,
  );

  const feed = mountPostFeed(container.querySelector('[data-feed]'), {
    label: 'Your timeline',
    navigate,
    fetchPage: (cursor, signal) => feedApi.getFollowing({ cursor }, { signal }),
    emptyState: {
      icon: 'userPlus',
      title: 'Your timeline is quiet',
      message: 'Follow a few people and their posts will show up here.',
      action: { label: 'Find people on Explore', href: '/explore' },
    },
  });

  const destroyComposer = mountComposer(container.querySelector('[data-composer-slot]'), {
    autofocus: query.get('compose') === '1',
    onPostCreated: (post) => feed.prependPost(post),
  });

  return () => {
    feed.destroy();
    destroyComposer();
  };
}
