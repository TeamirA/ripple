import * as usersService from './users.service.js';

export async function getProfile(req, res) {
  const user = await usersService.getProfile(req.params.username, req.user?.id);
  res.json({ user });
}

export async function updateMyProfile(req, res) {
  const user = await usersService.updateProfile(req.user.id, req.body);
  res.json({ user });
}

export async function updateMyAvatar(req, res) {
  const user = await usersService.updateAvatar(req.user.id, req.file);
  res.json({ user });
}

export async function removeMyAvatar(req, res) {
  const user = await usersService.removeAvatar(req.user.id);
  res.json({ user });
}
