const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ? import.meta.env.VITE_API_URL : '/api';

function getToken() {
  return localStorage.getItem('gns_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('gns_token', token);
  }
}

export function clearToken() {
  localStorage.removeItem('gns_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    console.error(`[API Network Error] ${options.method || 'GET'} ${path}:`, err);
    throw new Error(
      'Unable to connect to backend server. Please make sure the backend is running on port 5000.'
    );
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      if (text.startsWith('{') || text.startsWith('[')) {
        data = JSON.parse(text);
      }
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (res.status === 404
        ? 'Service endpoint not found.'
        : `Connection error (${res.status}). Please try again.`);
    const error = new Error(errorMsg);
    error.status = res.status;
    error.code = data?.code;
    throw error;
  }

  if (data === null) {
    throw new Error('Server returned an invalid response. Please try again.');
  }

  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  verifyOTP: (code) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ code }) }),
  resendOTP: () => request('/auth/resend-otp', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  saveSessions: (body) => request('/sessions', { method: 'POST', body: JSON.stringify(body) }),
  getSessions: (limit = 50) => request(`/sessions?limit=${limit}`),
  getStats: () => request('/sessions/stats'),

  saveFeedback: (body) => request('/feedback', { method: 'POST', body: JSON.stringify(body) }),

  classify: (body) => request('/classify', { method: 'POST', body: JSON.stringify(body) }),
  updateClassifier: (body) => request('/classify/update', { method: 'POST', body: JSON.stringify(body) }),
};
