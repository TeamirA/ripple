import { deleteImage, uploadImage } from '../../config/cloudinary.js';
import { AppError } from '../../utils/AppError.js';
import * as usersRepository from './users.repository.js';

const AVATAR_TRANSFORMATION = [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }];

/**
 * Returns a public profile plus viewer-specific flags.
 * @param {string} username
 * @param {string | undefined} viewerId
 */
export async function getProfile(username, viewerId) {
  const profile = await usersRepository.findProfileByUsername(username);
  if (!profile) throw AppError.notFound('User not found');

  const isSelf = profile.id === viewerId;
  const isFollowing =
    Boolean(viewerId) && !isSelf && (await usersRepository.isFollowing(viewerId, profile.id));
  return { ...profile, isSelf, isFollowing };
}

/** Resolves a username to a user id or throws 404. */
export async function getUserIdByUsername(username) {
  const user = await usersRepository.findIdByUsername(username);
  if (!user) throw AppError.notFound('User not found');
  return user.id;
}

export function updateProfile(userId, changes) {
  return usersRepository.updateProfile(userId, changes);
}

/** Uploads a new avatar, then removes the previous one from storage. */
export async function updateAvatar(userId, file) {
  if (!file) throw AppError.validation([{ field: 'body.avatar', message: 'An image is required' }]);

  const previous = await usersRepository.findAvatarPublicId(userId);
  const { url, publicId } = await uploadImage(file.buffer, {
    folder: 'ripple/avatars',
    transformation: AVATAR_TRANSFORMATION,
  });
  const user = await usersRepository.updateAvatar(userId, {
    avatarUrl: url,
    avatarPublicId: publicId,
  });
  await deleteImage(previous?.avatarPublicId);
  return user;
}

/** Clears the avatar so clients fall back to the initials avatar. */
export async function removeAvatar(userId) {
  const previous = await usersRepository.findAvatarPublicId(userId);
  const user = await usersRepository.updateAvatar(userId, {
    avatarUrl: null,
    avatarPublicId: null,
  });
  await deleteImage(previous?.avatarPublicId);
  return user;
}
