import { AppError } from '../../utils/AppError.js';
import { buildPage } from '../../utils/pagination.js';
import {
  NotificationType,
  notify,
  withdrawNotification,
} from '../notifications/notifications.service.js';
import { getUserIdByUsername } from '../users/users.service.js';
import * as followsRepository from './follows.repository.js';

async function resolveTarget(followerId, username) {
  const followingId = await getUserIdByUsername(username);
  if (followingId === followerId) throw AppError.badRequest('You cannot follow yourself');
  return followingId;
}

async function withFollowState(users, viewerId) {
  const followedIds = await followsRepository.findFollowedIdSet(
    viewerId,
    users.map((user) => user.id),
  );
  return users.map((user) => ({
    ...user,
    isSelf: user.id === viewerId,
    isFollowing: followedIds.has(user.id),
  }));
}

async function toUserListPage(rows, limit, relation, viewerId) {
  const page = buildPage(rows, limit, (row) => ({
    createdAt: row.createdAt,
    id: row[relation].id,
  }));
  const users = await withFollowState(
    page.data.map((row) => row[relation]),
    viewerId,
  );
  return { data: users, nextCursor: page.nextCursor };
}

/**
 * Follows a user (idempotent) and notifies them on the first follow.
 * @returns {Promise<{ isFollowing: true, followersCount: number }>}
 */
export async function followUser(followerId, username) {
  const followingId = await resolveTarget(followerId, username);
  const { isNewFollow, followersCount } = await followsRepository.addFollow(
    followerId,
    followingId,
  );
  if (isNewFollow) {
    await notify({ type: NotificationType.FOLLOW, recipientId: followingId, actorId: followerId });
  }
  return { isFollowing: true, followersCount };
}

/** @returns {Promise<{ isFollowing: false, followersCount: number }>} */
export async function unfollowUser(followerId, username) {
  const followingId = await resolveTarget(followerId, username);
  const { wasFollowing, followersCount } = await followsRepository.removeFollow(
    followerId,
    followingId,
  );
  if (wasFollowing) {
    await withdrawNotification({
      type: NotificationType.FOLLOW,
      recipientId: followingId,
      actorId: followerId,
    });
  }
  return { isFollowing: false, followersCount };
}

export async function listFollowers(username, pagination, viewerId) {
  const userId = await getUserIdByUsername(username);
  const rows = await followsRepository.findFollowers(userId, pagination);
  return toUserListPage(rows, pagination.limit, 'follower', viewerId);
}

export async function listFollowing(username, pagination, viewerId) {
  const userId = await getUserIdByUsername(username);
  const rows = await followsRepository.findFollowing(userId, pagination);
  return toUserListPage(rows, pagination.limit, 'following', viewerId);
}

/**
 * "Who to follow": friends-of-friends first, topped up with the most-followed users.
 * Anonymous visitors only get the most-followed list.
 */
export async function getSuggestions(viewerId, limit) {
  const friendOfFriendIds = viewerId
    ? await followsRepository.findFriendsOfFriendIds(viewerId, limit)
    : [];
  const fillCount = limit - friendOfFriendIds.length;
  const popularIds =
    fillCount > 0
      ? await followsRepository.findMostFollowedIds(viewerId, friendOfFriendIds, fillCount)
      : [];

  const orderedIds = [...friendOfFriendIds, ...popularIds];
  const users = await followsRepository.findUserCardsByIds(orderedIds);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const ordered = orderedIds.map((id) => usersById.get(id)).filter(Boolean);
  return withFollowState(ordered, viewerId);
}
