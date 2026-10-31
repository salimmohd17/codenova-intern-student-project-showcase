// Normalize URL: works whether VITE_API_URL includes /api or not
const _raw = (import.meta.env.VITE_API_URL || 'http://localhost:5005/api').replace(/\/$/, '');
const API_BASE = _raw.endsWith('/api') ? _raw : _raw + '/api';
export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || payload.message || `Request failed (${response.status})`);
    error.status = response.status;
    if (payload.fields) error.fields = payload.fields;
    throw error;
  }
  return payload;
}
