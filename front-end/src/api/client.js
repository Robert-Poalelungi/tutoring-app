const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const trimSlash = (value) => value.replace(/\/$/, '');

const normalizeEndpoint = (endpoint) => {
  if (!endpoint.startsWith('/')) {
    return `/${endpoint}`;
  }
  return endpoint;
};

const buildUrl = (endpoint) => `${trimSlash(API_BASE_URL)}${normalizeEndpoint(endpoint)}`;

export const getApiBaseUrl = () => trimSlash(API_BASE_URL);

const emitApiEvent = (name, detail) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

export async function apiRequest(endpoint, options = {}) {
  const url = buildUrl(endpoint);
  emitApiEvent('api:request-start', { endpoint, url });

  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      const errorMessage = payload?.message || 'A apărut o eroare la comunicarea cu serverul.';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.payload = payload;
      emitApiEvent('api:request-error', {
        endpoint,
        status: response.status,
        message: errorMessage,
      });
      throw error;
    }

    return payload;
  } finally {
    emitApiEvent('api:request-end', { endpoint, url });
  }
}

export const apiGet = (endpoint) => apiRequest(endpoint, { method: 'GET' });

export const apiPost = (endpoint, body) =>
  apiRequest(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiPut = (endpoint, body) =>
  apiRequest(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiDelete = (endpoint) => apiRequest(endpoint, { method: 'DELETE' });
