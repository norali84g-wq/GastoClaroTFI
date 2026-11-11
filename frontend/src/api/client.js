import { text } from '../texts.js';

export class ApiError extends Error {
  constructor(status, issues = []) {
    super(
      issues
        .map(({ message }) => message)
        .filter(Boolean)
        .join(' · ') || text.error,
    );
    this.status = status;
    this.issues = issues;
  }
}

export function createClient({ baseUrl, getToken, onUnauthorized, fetcher = globalThis.fetch }) {
  return async function request(path, { method = 'GET', body, publicRoute = false, signal } = {}) {
    if (!baseUrl) throw new Error(text.configuration);

    const token = publicRoute ? null : getToken();
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const multipart = body instanceof FormData;
    if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';

    const response = await fetcher(`${baseUrl.trim().replace(/\/+$/, '')}${path}`, {
      method,
      headers,
      signal,
      body: multipart ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 401 && token) onUnauthorized(token);
      const error = await response.json().catch(() => null);
      throw new ApiError(response.status, Array.isArray(error?.errors) ? error.errors : []);
    }

    return response.status === 204 ? undefined : response.json();
  };
}
