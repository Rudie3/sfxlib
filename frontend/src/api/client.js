const API_BASE = 'http://localhost:3131/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getSetup: () => request('/setup'),
  setupRoot: (rootPath) => request('/setup', { method: 'POST', body: JSON.stringify({ rootPath }) }),
  reindex: () => request('/setup/reindex', { method: 'POST' }),
  getStatus: () => request('/setup/status'),
  getTree: () => request('/files/tree'),
  getFile: (id) => request(`/files/${id}`),
  search: (query, mode) => request(`/search?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}`),
  listTags: () => request('/tags'),
  upsertTag: (payload) => request('/tags', { method: 'POST', body: JSON.stringify(payload) }),
  setFileTags: (fileId, tagIds) => request(`/tags/file/${fileId}`, { method: 'PUT', body: JSON.stringify({ tagIds }) }),
};

export const streamUrl = (id) => `${API_BASE}/files/${id}/stream`;
