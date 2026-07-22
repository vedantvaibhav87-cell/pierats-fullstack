// All requests go through Vite's dev proxy (see vite.config.js) to /api/*,
// which forwards to the Express backend. `credentials: 'include'` sends the
// httpOnly session cookie set by the backend on login/register.
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { /* non-JSON response */ }
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // crews
  getCrews: () => request('/crews'),
  getCrew: (name) => request(`/crews/${encodeURIComponent(name)}`),
  createCrew: (body) => request('/crews', { method: 'POST', body }),

  // posts
  getPosts: (crew) => request(`/posts${crew ? `?crew=${encodeURIComponent(crew)}` : ''}`),
  getPost: (id) => request(`/posts/${id}`),
  createPost: (body) => request('/posts', { method: 'POST', body }),
  votePost: (id, dir) => request(`/posts/${id}/vote`, { method: 'POST', body: { dir } }),

  // comments
  getComments: (postId) => request(`/comments/post/${postId}`),
  addComment: (postId, body) => request(`/comments/post/${postId}`, { method: 'POST', body: { body } }),
  voteComment: (id, dir) => request(`/comments/${id}/vote`, { method: 'POST', body: { dir } }),
};
