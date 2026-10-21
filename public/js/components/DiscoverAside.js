import { followsApi } from '../api/followsApi.js';
import { store } from '../state/store.js';
import { html } from '../utils/escapeHtml.js';
import { setHtml } from '../utils/dom.js';
import { bindFollowButtons } from './FollowButton.js';
import { icon } from './icons.js';
import { UserCard } from './UserCard.js';

// Matches the breakpoint where layout.css shows the aside.
const ASIDE_MEDIA_QUERY = '(min-width: 1100px)';

function AsideSkeleton() {
  return html` <form class="aside-search" role="search" action="/search" data-aside-search>
      ${icon('search')}
      <label class="visually-hidden" for="aside-search-input">Search Ripple</label>
      <input
        class="aside-search__input"
        id="aside-search-input"
        name="q"
        type="search"
        placeholder="Search Ripple"
        autocomplete="off"
      />
    </form>
    <section class="aside-card" aria-labelledby="suggestions-heading">
      <h2 class="aside-card__title" id="suggestions-heading">Who to follow</h2>
      <div data-suggestions><p class="text-muted">Loading suggestions…</p></div>
    </section>
    <footer class="aside-footer">
      <span>Ripple · a portfolio project</span>
      <a href="https://github.com/TeamirA/ripple" target="_blank" rel="noopener noreferrer"
        >Source on GitHub</a
      >
    </footer>`;
}

async function loadSuggestions(container) {
  try {
    const { data } = await followsApi.getSuggestions(4);
    setHtml(
      container,
      data.length
        ? html`${data.map((user) => UserCard(user, { isCompact: true }))}`
        : html`<p class="text-muted">You’re following everyone. Impressive!</p>`,
    );
  } catch {
    setHtml(container, html`<p class="text-muted">Suggestions are unavailable right now.</p>`);
  }
}

/** Right-hand sidebar with search and "who to follow"; only loads data when visible. */
export function mountDiscoverAside(aside, { navigate }) {
  const media = window.matchMedia(ASIDE_MEDIA_QUERY);
  let isMounted = false;

  function renderAside() {
    if (!media.matches) return;
    isMounted = true;
    setHtml(aside, AsideSkeleton());
    loadSuggestions(aside.querySelector('[data-suggestions]'));
  }

  aside.addEventListener('submit', (event) => {
    if (!event.target.matches('[data-aside-search]')) return;
    event.preventDefault();
    const q = event.target.elements.q.value.trim();
    navigate(`/search?type=users&q=${encodeURIComponent(q)}`);
  });
  bindFollowButtons(aside);

  media.addEventListener('change', () => !isMounted && renderAside());
  store.subscribe((state) => state.currentUser?.id, renderAside);
  renderAside();
}
