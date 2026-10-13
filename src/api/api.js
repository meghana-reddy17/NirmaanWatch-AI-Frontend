const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

function readCookie(name) {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

async function ensureCsrf() {
  if (!readCookie('XSRF-TOKEN')) {
    await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' });
  }
}

export async function apiRequest(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  if (method !== 'GET') {
    await ensureCsrf();
  }
  const csrf = readCookie('XSRF-TOKEN');
  const requestHeaders = { ...headers };
  if (csrf) requestHeaders['X-XSRF-TOKEN'] = csrf;
  if (body && !isForm && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      headers: requestHeaders,
      body: body && !isForm && !(body instanceof FormData) ? JSON.stringify(body) : body,
    });
  } catch {
    const error = new Error('Cannot reach the NirmaanWatch API. Confirm the Spring Boot server is running.');
    error.network = true;
    throw error;
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.blob();
  if (!response.ok) {
    const message = data?.message || 'The request could not be completed.';
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body, options = {}) => apiRequest(path, { method: 'POST', body, ...options }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};

export { API_BASE };
