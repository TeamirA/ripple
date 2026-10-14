import { CSRF_COOKIE, clearSessionCookie, setSessionCookie } from '../../utils/cookies.js';
import * as authService from './auth.service.js';

export function getCsrfToken(req, res) {
  res.json({ csrfToken: req.cookies[CSRF_COOKIE] });
}

export async function register(req, res) {
  const { user, token } = await authService.registerUser(req.body);
  setSessionCookie(res, token);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const { user, token } = await authService.loginUser(req.body);
  setSessionCookie(res, token);
  res.json({ user });
}

export async function loginDemo(_req, res) {
  const { user, token } = await authService.loginDemoUser();
  setSessionCookie(res, token);
  res.json({ user });
}

export function logout(_req, res) {
  clearSessionCookie(res);
  res.status(204).end();
}

export async function getMe(req, res) {
  const user = await authService.getCurrentUser(req.user.id);
  res.json({ user });
}

export async function changePassword(req, res) {
  const { token } = await authService.changePassword(req.user.id, req.body);
  setSessionCookie(res, token);
  res.status(204).end();
}
