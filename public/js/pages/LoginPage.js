import { render as renderAuthPage } from './AuthPage.js';

export const render = (container, context) =>
  renderAuthPage(container, { ...context, mode: 'login' });
