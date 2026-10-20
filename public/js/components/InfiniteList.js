import { html } from '../utils/escapeHtml.js';
import { insertHtml, setHtml } from '../utils/dom.js';
import { icon } from './icons.js';

const PRELOAD_MARGIN = '800px';

function DefaultLoading() {
  return html`<div class="list-status">
    <span class="spinner" aria-hidden="true"></span>Loading…
  </div>`;
}

function ErrorStatus(message) {
  return html`<div class="list-status list-status--error" role="alert">
    ${icon('alert')}<span>${message}</span>
    <button class="button button--secondary button--sm" type="button" data-retry>Retry</button>
  </div>`;
}

/**
 * Cursor-paginated list that loads the next page as the user nears the bottom.
 * @param {{
 *   container: HTMLElement,
 *   label: string,
 *   fetchPage: (cursor: string | null, signal: AbortSignal) => Promise<{ data: any[], nextCursor: string | null }>,
 *   renderItem: (item: any) => import('../utils/escapeHtml.js').SafeHtml,
 *   renderEmpty: () => import('../utils/escapeHtml.js').SafeHtml,
 *   renderLoading?: () => import('../utils/escapeHtml.js').SafeHtml,
 *   role?: 'feed' | 'list',
 * }} options
 */
export function createInfiniteList({
  container,
  label,
  fetchPage,
  renderItem,
  renderEmpty,
  renderLoading = DefaultLoading,
  role = 'feed',
}) {
  setHtml(
    container,
    html`<div
        class="infinite-list"
        role="${role}"
        aria-label="${label}"
        aria-busy="false"
        data-items
      ></div>
      <div data-status></div>
      <div class="infinite-list__sentinel" data-sentinel aria-hidden="true"></div>`,
  );
  const items = container.querySelector('[data-items]');
  const status = container.querySelector('[data-status]');
  const sentinel = container.querySelector('[data-sentinel]');

  let cursor = null;
  let isLoading = false;
  let isDone = false;
  let itemCount = 0;
  const controller = new AbortController();

  async function loadNextPage() {
    if (isLoading || isDone) return;
    isLoading = true;
    items.setAttribute('aria-busy', 'true');
    setHtml(status, renderLoading(itemCount === 0));

    try {
      const page = await fetchPage(cursor, controller.signal);
      insertHtml(items, 'beforeend', html`${page.data.map(renderItem)}`);
      itemCount += page.data.length;
      cursor = page.nextCursor;
      isDone = !cursor;
      setHtml(status, itemCount === 0 ? renderEmpty() : html``);
    } catch (error) {
      if (error.name !== 'AbortError') setHtml(status, ErrorStatus(error.message));
      // Stop here: retrying is left to the user so a failing API is not hammered.
      return;
    } finally {
      isLoading = false;
      items.setAttribute('aria-busy', 'false');
    }
    // A short first page may leave the sentinel visible; keep filling the screen.
    if (!isDone && isSentinelVisible()) loadNextPage();
  }

  function isSentinelVisible() {
    return sentinel.getBoundingClientRect().top < window.innerHeight + 800;
  }

  const observer = new IntersectionObserver(
    (entries) => entries[0].isIntersecting && loadNextPage(),
    { rootMargin: PRELOAD_MARGIN },
  );
  observer.observe(sentinel);
  status.addEventListener('click', (event) => {
    if (event.target.closest('[data-retry]')) loadNextPage();
  });

  return {
    /** Adds an item to the top, e.g. a post the user just published. */
    prepend(item) {
      insertHtml(items, 'afterbegin', renderItem(item));
      itemCount += 1;
      setHtml(status, html``);
    },
    /** Call after removing an item's element so the empty state can appear. */
    notifyItemRemoved() {
      itemCount = Math.max(0, itemCount - 1);
      if (itemCount === 0 && isDone) setHtml(status, renderEmpty());
    },
    destroy() {
      controller.abort();
      observer.disconnect();
    },
  };
}
