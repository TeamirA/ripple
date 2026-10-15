import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { detectImageType } from '../utils/imageType.js';

const MEGABYTE = 1024 * 1024;

function translateMulterError(err) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Image is too large');
  }
  return AppError.badRequest(err.message);
}

/**
 * Accepts one optional image in `fieldName`, kept in memory and verified by its
 * file signature. The validated file is available as `req.file`.
 */
export function uploadSingleImage(fieldName, { maxSizeMb = 2 } = {}) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * MEGABYTE, files: 1 },
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) return next(err instanceof multer.MulterError ? translateMulterError(err) : err);
      if (req.file && !detectImageType(req.file.buffer)) {
        return next(AppError.badRequest('File must be a JPEG, PNG, GIF or WebP image'));
      }
      next();
    });
  };
}
