// Normalize URL: works whether VITE_API_URL includes /api or not
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5005/api').replace(/\/+$/, '');
export const API_BASE = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Unable to connect to the server. Check the backend URL and try again.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || payload.message || `Request failed (${response.status})`);
    error.status = response.status;
    if (payload.fields) error.fields = payload.fields;
    throw error;
  }
  return payload;
}
