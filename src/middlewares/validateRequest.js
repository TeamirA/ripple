import { AppError } from '../utils/AppError.js';

const REQUEST_PARTS = ['params', 'query', 'body'];

function formatIssues(issues, part) {
  return issues.map((issue) => ({
    field: [part, ...issue.path].join('.'),
    message: issue.message,
  }));
}

/**
 * Validates and coerces request parts with zod schemas, e.g.
 * `validateRequest({ body: createPostSchema, params: postIdParamsSchema })`.
 * Parsed values replace the raw ones so handlers only ever see clean data.
 */
export function validateRequest(schemas) {
  return (req, _res, next) => {
    const details = [];

    for (const part of REQUEST_PARTS) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        details.push(...formatIssues(result.error.issues, part));
        continue;
      }
      // Express 5 exposes req.query as a getter, so redefine instead of assigning.
      Object.defineProperty(req, part, { value: result.data, writable: true, enumerable: true });
    }

    next(details.length ? AppError.validation(details) : undefined);
  };
}
