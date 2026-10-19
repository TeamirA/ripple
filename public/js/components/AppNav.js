import { store } from '../state/store.js';
import { html } from '../utils/escapeHtml.js';
import { setHtml } from '../utils/dom.js';
import { Avatar } from './Avatar.js';
import { icon } from './icons.js';

function getNavItems(user) {
  if (!user) {
    return [
      { href: '/explore', label: 'Explore', icon: 'compass' },
      { href: '/search', label: 'Search', icon: 'search' },
      { href: '/login', label: 'Log in', icon: 'user' },
    ];
  }
  return [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/explore', label: 'Explore', icon: 'compass' },
    { href: '/search', label: 'Search', icon: 'search' },
    { href: '/notifications', label: 'Notifications', icon: 'bell', hasBadge: true },
    { href: `/u/${user.username}`, label: 'Profile', icon: 'user' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ];
}

function formatBadge(count) {
  if (!count) return '';
  return count > 99 ? '99+' : String(count);
}

function NavLink(item, unreadCount) {
  const badgeText = item.hasBadge ? formatBadge(unreadCount) : '';
  const accessibleLabel = badgeText ? `${item.label}, ${unreadCount} unread` : item.label;
  return html`<li>
    <a class="nav__link" href="${item.href}" aria-label="${accessibleLabel}" data-nav-link>
      ${icon(item.icon)}
      <span class="nav__label" aria-hidden="true">${item.label}</span>
      ${item.hasBadge ? html`<span class="badge" data-unread-badge aria-hidden="true">${badgeText}</span>` : ''}
    </a>
  </li>`;
}

function AccountChip(user) {
  return html`<a class="account-chip" href="/u/${user.username}">
    ${Avatar(user, 'sm')}
    <span class="account-chip__text">
      <span class="account-chip__name">${user.displayName}</span>
      <span class="account-chip__handle">@${user.username}</span>
    </span>
  </a>`;
}

function renderNav(container, { currentUser, unreadCount }) {
  setHtml(
    container,
    html`
      <a class="nav__brand brand" href="${currentUser ? '/' : '/explore'}" aria-label="Ripple home">
        <span class="brand__mark" aria-hidden="true"></span>
      </a>
      <ul class="nav__list">
        ${getNavItems(currentUser).map((item) => NavLink(item, unreadCount))}
      </ul>
      ${
        currentUser
          ? html`<a
                class="nav__compose button button--primary button--lg"
                href="/?compose=1"
                aria-label="New post"
              >
                ${icon('plus')}<span class="nav__label">Post</span>
              </a>
              <div class="nav__account">${AccountChip(currentUser)}</div>`
          : ''
      }
    `,
  );
}

function renderHeader(container, { currentUser }) {
  setHtml(
    container,
    html`
      <a class="brand" href="${currentUser ? '/' : '/explore'}">
        <span class="brand__mark" aria-hidden="true"></span>Ripple
      </a>
      ${
        currentUser
          ? html`<a href="/settings" class="icon-button" aria-label="Settings"
              >${icon('settings')}</a
            >`
          : html`<a href="/login" class="button button--primary button--sm">Log in</a>`
      }
    `,
  );
}

/** Marks the link for the current path so screen readers announce "current page". */
export function highlightActiveNavLink(container, pathname) {
  container.querySelectorAll('[data-nav-link]').forEach((link) => {
    const linkPath = new URL(link.href).pathname;
    const isActive = linkPath === '/' ? pathname === '/' : pathname.startsWith(linkPath);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/** Renders the nav rail / bottom bar and mobile header, re-rendering when the user changes. */
export function mountAppNav({ nav, header, getPathname }) {
  const render = () => {
    const state = store.getState();
    renderNav(nav, state);
    renderHeader(header, state);
    highlightActiveNavLink(nav, getPathname());
  };

  render();
  store.subscribe((state) => state.currentUser, render);
  store.subscribe(
    (state) => state.unreadCount,
    () => render(),
  );
}
