import { html } from '../utils/escapeHtml.js';

const repeat = (count, render) => Array.from({ length: count }, (_, index) => render(index));

// Varying line widths make the placeholder read as text rather than as bars.
const LINE_WIDTHS = ['95%', '80%', '60%', '88%', '70%'];

function SkeletonLines(count, offset = 0) {
  return repeat(
    count,
    (index) =>
      html`<span
        class="skeleton skeleton--line skeleton--w${parseInt(LINE_WIDTHS[(index + offset) % LINE_WIDTHS.length], 10)}"
      ></span>`,
  );
}

export function PostSkeleton(count = 3) {
  return html`<div class="skeleton-group" aria-hidden="true">
    ${repeat(
      count,
      (index) =>
        html`<div class="skeleton-post">
          <span class="skeleton skeleton--avatar"></span>
          <div class="skeleton-post__body">
            <span class="skeleton skeleton--line skeleton--w40"></span>
            ${SkeletonLines(2 + (index % 2), index)}
          </div>
        </div>`,
    )}
  </div>`;
}

export function UserSkeleton(count = 4) {
  return html`<div class="skeleton-group" aria-hidden="true">
    ${repeat(
      count,
      () =>
        html`<div class="skeleton-user">
          <span class="skeleton skeleton--avatar"></span>
          <div class="skeleton-post__body">
            <span class="skeleton skeleton--line skeleton--w40"></span>
            <span class="skeleton skeleton--line skeleton--w25"></span>
          </div>
          <span class="skeleton skeleton--pill"></span>
        </div>`,
    )}
  </div>`;
}

/** Placeholder for a whole page while its data loads (shown by the router). */
export function PageSkeleton() {
  return html`<div class="page" aria-hidden="true">
    <div class="page-header"><span class="skeleton skeleton--line skeleton--w25"></span></div>
    ${PostSkeleton(4)}
  </div>`;
}

/** Loading renderer for InfiniteList: skeletons first, a small spinner for later pages. */
export function createSkeletonLoader(Skeleton) {
  return (isFirstPage) =>
    isFirstPage
      ? html`${Skeleton()}<span class="visually-hidden">Loading…</span>`
      : html`<div class="list-status">
          <span class="spinner" aria-hidden="true"></span>Loading more…
        </div>`;
}
