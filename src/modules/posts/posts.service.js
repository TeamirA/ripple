import { deleteImage, uploadImage } from '../../config/cloudinary.js';
import { AppError } from '../../utils/AppError.js';
import { buildPage } from '../../utils/pagination.js';
import { getUserIdByUsername } from '../users/users.service.js';
import * as postsRepository from './posts.repository.js';
import { toPostResponse } from './posts.selects.js';

const POST_IMAGE_TRANSFORMATION = [{ width: 1200, height: 1200, crop: 'limit' }];

async function getOwnedPost(postId, userId) {
  const post = await postsRepository.findPostOwnership(postId);
  if (!post) throw AppError.notFound('Post not found');
  if (post.authorId !== userId) throw AppError.forbidden('You can only change your own posts');
  return post;
}

/**
 * Publishes a post, uploading the optional image first.
 * @param {string} authorId
 * @param {{ content: string }} input
 * @param {{ buffer: Buffer } | undefined} imageFile
 */
export async function createPost(authorId, { content }, imageFile) {
  const image = imageFile
    ? await uploadImage(imageFile.buffer, {
        folder: 'ripple/posts',
        transformation: POST_IMAGE_TRANSFORMATION,
      })
    : null;

  try {
    const post = await postsRepository.createPost({
      authorId,
      content,
      imageUrl: image?.url ?? null,
      imagePublicId: image?.publicId ?? null,
    });
    return toPostResponse(post);
  } catch (error) {
    await deleteImage(image?.publicId);
    throw error;
  }
}

export async function getPost(postId, viewerId) {
  const post = await postsRepository.findPostById(postId, viewerId);
  if (!post) throw AppError.notFound('Post not found');
  return toPostResponse(post);
}

export async function updatePost(postId, userId, { content }) {
  await getOwnedPost(postId, userId);
  const post = await postsRepository.updatePostContent(postId, content, userId);
  return toPostResponse(post);
}

export async function deletePost(postId, userId) {
  const post = await getOwnedPost(postId, userId);
  await postsRepository.deletePost(postId, userId);
  await deleteImage(post.imagePublicId);
}

/** Cursor-paginated posts for a profile page, newest first. */
export async function listPostsByUsername(username, pagination, viewerId) {
  const authorId = await getUserIdByUsername(username);
  const rows = await postsRepository.findPostsByAuthor(authorId, pagination, viewerId);
  const page = buildPage(rows, pagination.limit);
  return { ...page, data: page.data.map(toPostResponse) };
}
