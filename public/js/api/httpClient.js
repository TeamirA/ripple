const API_BASE = '/api/v1';
const CSRF_COOKIE = 'ripple_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD']);

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details ?? [];
  }

  /** Maps validation details to `{ fieldName: message }` for inline form errors. */
  get fieldErrors() {
    return Object.fromEntries(
      this.details.map(({ field, message }) => [
        field.replace(/^(body|query|params)\./, ''),
        message,
      ]),
    );
  }
}

const unauthorizedListeners = new Set();

/** Lets the session layer react when the server says the session is gone. */
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

function readCookie(name) {
  const match = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

let csrfTokenRequest = null;

/** The server sets the CSRF cookie on any API response; fetch one if we have none yet. */
async function getCsrfToken() {
  const token = readCookie(CSRF_COOKIE);
  if (token) return token;
  csrfTokenRequest ??= fetch(`${API_BASE}/auth/csrf`, { credentials: 'same-origin' })
    .then((response) => response.json())
    .then((body) => body.csrfToken)
    .finally(() => {
      csrfTokenRequest = null;
    });
  return csrfTokenRequest;
}

function buildUrl(path, query) {
  const url = new URL(API_BASE + path, window.location.origin);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return url;
}

async function parseError(response) {
  const body = await response.json().catch(() => null);
  return new ApiError({
    status: response.status,
    code: body?.error?.code ?? 'NETWORK_ERROR',
    message: body?.error?.message ?? 'Something went wrong. Please try again.',
    details: body?.error?.details,
  });
}

/**
 * Sends a request to the Ripple API. JSON bodies are serialized, FormData is
 * passed through, and the CSRF header is attached to state-changing requests.
 * @returns {Promise<any>} parsed JSON, or null for 204 responses
 */
export async function request(method, path, { body, query, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (!SAFE_METHODS.has(method)) headers['X-CSRF-Token'] = await getCsrfToken();

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'You appear to be offline. Check your connection and try again.',
    });
  }

  if (!response.ok) {
    const error = await parseError(response);
    if (error.status === 401) unauthorizedListeners.forEach((listener) => listener(error));
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export const http = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options) => request('POST', path, { ...options, body }),
  put: (path, body, options) => request('PUT', path, { ...options, body }),
  patch: (path, body, options) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
};
