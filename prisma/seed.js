import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  SEED_PASSWORD,
  commentTexts,
  postsByUser,
  replyTexts,
  users as userSeeds,
} from './seed-data.js';

const prisma = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Deterministic PRNG so every seed run produces the same social graph.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20261013);
const randomInt = (min, max) => min + Math.floor(random() * (max - min + 1));
const pickOne = (items) => items[Math.floor(random() * items.length)];
const pickMany = (items, count) =>
  [...items].sort(() => random() - 0.5).slice(0, Math.min(count, items.length));
const dateBetween = (start, end) => new Date(start.getTime() + random() * (end - start));

async function clearDatabase() {
  await prisma.$executeRaw`TRUNCATE "Notification", "CommentLike", "Like", "Comment", "Follow", "Post", "User" CASCADE`;
}

async function seedUsers(now) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  return prisma.user.createManyAndReturn({
    data: userSeeds.map((user) => ({
      ...user,
      email: `${user.username.replace('.', '_')}@ripple.dev`,
      passwordHash,
      createdAt: new Date(now - randomInt(20, 120) * DAY),
    })),
  });
}

function buildFollows(users, now) {
  const follows = [];
  for (const follower of users) {
    const others = users.filter((user) => user.id !== follower.id);
    for (const following of pickMany(others, randomInt(4, 9))) {
      const since = new Date(Math.max(follower.createdAt, following.createdAt));
      follows.push({
        followerId: follower.id,
        followingId: following.id,
        createdAt: dateBetween(since, new Date(now)),
      });
    }
  }
  return follows;
}

async function seedPosts(usersByName, now) {
  const data = Object.entries(postsByUser).flatMap(([username, contents]) =>
    contents.map((content) => ({
      authorId: usersByName.get(username).id,
      content,
      // Roughly a third of posts land in the last 48h so "Trending" has data.
      createdAt: new Date(now - (random() < 0.35 ? random() * 2 * DAY : random() * 14 * DAY)),
    })),
  );
  return prisma.post.createManyAndReturn({ data });
}

function buildLikes(posts, users, now) {
  return posts.flatMap((post) =>
    pickMany(
      users.filter((user) => user.id !== post.authorId),
      randomInt(0, 11),
    ).map((user) => ({
      userId: user.id,
      postId: post.id,
      createdAt: dateBetween(post.createdAt, new Date(now)),
    })),
  );
}

async function seedComments(posts, users, now) {
  const topLevelData = posts.flatMap((post) =>
    pickMany(
      users.filter((user) => user.id !== post.authorId),
      randomInt(0, 4),
    ).map((author) => ({
      postId: post.id,
      authorId: author.id,
      content: pickOne(commentTexts),
      createdAt: dateBetween(post.createdAt, new Date(now)),
    })),
  );
  const topLevel = await prisma.comment.createManyAndReturn({ data: topLevelData });

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const replyData = topLevel.flatMap((comment) => {
    const postAuthorId = postsById.get(comment.postId).authorId;
    return Array.from({ length: randomInt(0, 2) }, (_, index) => ({
      postId: comment.postId,
      parentId: comment.id,
      // The first reply usually comes from the post author, like real threads.
      authorId: index === 0 && random() < 0.7 ? postAuthorId : pickOne(users).id,
      content: pickOne(replyTexts),
      createdAt: dateBetween(comment.createdAt, new Date(now)),
    }));
  });
  const replies = await prisma.comment.createManyAndReturn({ data: replyData });

  return [...topLevel, ...replies];
}

function buildCommentLikes(comments, users, now) {
  return comments.flatMap((comment) =>
    pickMany(
      users.filter((user) => user.id !== comment.authorId),
      randomInt(0, 4),
    ).map((user) => ({
      userId: user.id,
      commentId: comment.id,
      createdAt: dateBetween(comment.createdAt, new Date(now)),
    })),
  );
}

function buildNotifications({ follows, likes, comments, commentLikes, posts, now }) {
  const postsById = new Map(posts.map((post) => [post.id, post]));
  const commentsById = new Map(comments.map((comment) => [comment.id, comment]));
  const isRead = (createdAt) => now - createdAt > 2 * DAY;

  const notifications = [
    ...follows.map((follow) => ({
      type: 'FOLLOW',
      recipientId: follow.followingId,
      actorId: follow.followerId,
      createdAt: follow.createdAt,
    })),
    ...likes.map((like) => ({
      type: 'LIKE',
      recipientId: postsById.get(like.postId).authorId,
      actorId: like.userId,
      postId: like.postId,
      createdAt: like.createdAt,
    })),
    ...commentLikes.map((like) => {
      const comment = commentsById.get(like.commentId);
      return {
        type: 'LIKE',
        recipientId: comment.authorId,
        actorId: like.userId,
        postId: comment.postId,
        commentId: comment.id,
        createdAt: like.createdAt,
      };
    }),
    ...comments.map((comment) => {
      const parent = comment.parentId && commentsById.get(comment.parentId);
      return {
        type: parent ? 'REPLY' : 'COMMENT',
        recipientId: parent ? parent.authorId : postsById.get(comment.postId).authorId,
        actorId: comment.authorId,
        postId: comment.postId,
        commentId: comment.id,
        createdAt: comment.createdAt,
      };
    }),
  ];

  return notifications
    .filter((notification) => notification.recipientId !== notification.actorId)
    .map((notification) => ({ ...notification, isRead: isRead(notification.createdAt) }));
}

async function recalculateCounters() {
  await prisma.$executeRaw`
    UPDATE "User" u SET
      "postsCount"     = (SELECT COUNT(*) FROM "Post" p WHERE p."authorId" = u.id),
      "followersCount" = (SELECT COUNT(*) FROM "Follow" f WHERE f."followingId" = u.id),
      "followingCount" = (SELECT COUNT(*) FROM "Follow" f WHERE f."followerId" = u.id)`;
  await prisma.$executeRaw`
    UPDATE "Post" p SET
      "likesCount"    = (SELECT COUNT(*) FROM "Like" l WHERE l."postId" = p.id),
      "commentsCount" = (SELECT COUNT(*) FROM "Comment" c WHERE c."postId" = p.id)`;
  await prisma.$executeRaw`
    UPDATE "Comment" c SET
      "likesCount"   = (SELECT COUNT(*) FROM "CommentLike" cl WHERE cl."commentId" = c.id),
      "repliesCount" = (SELECT COUNT(*) FROM "Comment" r WHERE r."parentId" = c.id)`;
}

async function main() {
  const now = Date.now();
  await clearDatabase();

  const users = await seedUsers(now);
  const usersByName = new Map(users.map((user) => [user.username, user]));

  const follows = buildFollows(users, now);
  await prisma.follow.createMany({ data: follows });

  const posts = await seedPosts(usersByName, now);
  const likes = buildLikes(posts, users, now);
  await prisma.like.createMany({ data: likes });

  const comments = await seedComments(posts, users, now);
  const commentLikes = buildCommentLikes(comments, users, now);
  await prisma.commentLike.createMany({ data: commentLikes });

  const notifications = buildNotifications({ follows, likes, comments, commentLikes, posts, now });
  await prisma.notification.createMany({ data: notifications });

  await recalculateCounters();

  console.info(
    `Seeded ${users.length} users, ${posts.length} posts, ${comments.length} comments, ` +
      `${likes.length + commentLikes.length} likes, ${follows.length} follows, ` +
      `${notifications.length} notifications. Password for every account: ${SEED_PASSWORD}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
