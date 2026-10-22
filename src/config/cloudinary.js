import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/AppError.js';
import { env } from './env.js';

export const isImageStorageEnabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (isImageStorageEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function assertImageStorageEnabled() {
  if (!isImageStorageEnabled) {
    throw new AppError(503, 'UPLOADS_DISABLED', 'Image uploads are not configured on this server');
  }
}

/** f_auto/q_auto let the CDN serve AVIF/WebP at a sensible quality per browser. */
function buildDeliveryUrl({ public_id: publicId, version }) {
  return cloudinary.url(publicId, {
    secure: true,
    version,
    fetch_format: 'auto',
    quality: 'auto',
  });
}

/**
 * Uploads an in-memory image and returns its public URL and id.
 * @param {Buffer} buffer
 * @param {{ folder: string, transformation?: object[] }} options
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export function uploadImage(buffer, { folder, transformation }) {
  assertImageStorageEnabled();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(new AppError(502, 'UPLOAD_FAILED', 'Image upload failed'));
        resolve({ url: buildDeliveryUrl(result), publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

/** Best-effort removal; a leftover file in storage should never fail a user action. */
export async function deleteImage(publicId) {
  if (!publicId || !isImageStorageEnabled) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch {
    // Orphaned images are harmless and can be cleaned up later.
  }
}
