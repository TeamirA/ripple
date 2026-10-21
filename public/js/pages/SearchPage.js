import { searchApi } from '../api/searchApi.js';
import { EmptyState } from '../components/EmptyState.js';
import { bindFollowButtons } from '../components/FollowButton.js';
import { icon } from '../components/icons.js';
import { PageHeader } from '../components/PageHeader.js';
import { mountPostFeed } from '../components/PostFeed.js';
import { Tabs } from '../components/Tabs.js';
import { UserCard } from '../components/UserCard.js';
import { debounce } from '../utils/debounce.js';
import { html } from '../utils/escapeHtml.js';
import { setHtml } from '../utils/dom.js';

const SEARCH_DELAY_MS = 300;
const TYPES = { users: 'People', posts: 'Posts' };

function buildSearchUrl(type, q) {
  const params = new URLSearchParams({ type });
  if (q) params.set('q', q);
  return `/search?${params}`;
}

function SearchTabs(type, q) {
  return Tabs({
    label: 'Search results type',
    activeKey: type,
    items: Object.entries(TYPES).map(([key, label]) => ({
      key,
      label,
      href: buildSearchUrl(key, q),
    })),
  });
}

async function renderUserResults(container, q, signal) {
  setHtml(
    container,
    html`<div class="list-status"><span class="spinner" aria-hidden="true"></span>Searching…</div>`,
  );
  const { data } = await searchApi.users(q, { signal });
  setHtml(
    container,
    data.length
      ? html`<div role="list" aria-label="People matching ${q}">
          ${data.map((user) => html`<div role="listitem">${UserCard(user)}</div>`)}
        </div>`
      : EmptyState({
          icon: 'search',
          title: `No people found for “${q}”`,
          message: 'Try a different name or username.',
        }),
  );
}

function renderPostResults(container, q, navigate) {
  return mountPostFeed(container, {
    label: `Posts matching ${q}`,
    navigate,
    fetchPage: (cursor, signal) => searchApi.posts(q, { cursor }, { signal }),
    emptyState: {
      icon: 'search',
      title: `No posts found for “${q}”`,
      message: 'Try other keywords or a #hashtag.',
    },
  });
}

/** Search people and posts; results update as you type (debounced). */
export function render(container, { query, navigate }) {
  const type = TYPES[query.get('type')] ? query.get('type') : 'users';
  const initialQuery = query.get('q') ?? '';

  setHtml(
    container,
    html`<section class="page">
      ${PageHeader({ title: 'Search' })}
      <form class="search-bar" role="search" data-search-form>
        ${icon('search')}
        <label class="visually-hidden" for="search-input">Search Ripple</label>
        <input
          class="search-bar__input"
          id="search-input"
          name="q"
          type="search"
          value="${initialQuery}"
          placeholder="${type === 'users' ? 'Search people' : 'Search posts or #hashtags'}"
          autocomplete="off"
          maxlength="100"
        />
      </form>
      <div data-tabs>${SearchTabs(type, initialQuery)}</div>
      <div data-results aria-live="polite"></div>
    </section>`,
  );

  const input = container.querySelector('#search-input');
  const results = container.querySelector('[data-results]');
  const unbindFollow = bindFollowButtons(results);
  let cleanupResults = null;
  let controller = null;

  function runSearch(rawQuery) {
    const q = rawQuery.trim();
    cleanupResults?.destroy();
    cleanupResults = null;
    controller?.abort();
    controller = new AbortController();
    history.replaceState(history.state, '', buildSearchUrl(type, q));
    setHtml(container.querySelector('[data-tabs]'), SearchTabs(type, q));

    if (!q) {
      setHtml(
        results,
        EmptyState({
          icon: 'search',
          title: 'Find people and posts',
          message: 'Search by name, @username, keyword or #hashtag.',
        }),
      );
      return;
    }
    if (type === 'posts') {
      cleanupResults = renderPostResults(results, q, navigate);
      return;
    }
    renderUserResults(results, q, controller.signal).catch((error) => {
      if (error.name !== 'AbortError')
        setHtml(
          results,
          EmptyState({ icon: 'alert', title: 'Search failed', message: error.message }),
        );
    });
  }

  const debouncedSearch = debounce(runSearch, SEARCH_DELAY_MS);
  input.addEventListener('input', () => debouncedSearch(input.value));
  container.querySelector('[data-search-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    debouncedSearch.cancel();
    runSearch(input.value);
  });

  runSearch(initialQuery);
  if (!initialQuery) input.focus();

  return () => {
    debouncedSearch.cancel();
    controller?.abort();
    cleanupResults?.destroy();
    unbindFollow();
  };
}
