const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('gns_token');
}

export function setToken(token) {
  localStorage.setItem('gns_token', token);
}

export function clearToken() {
  localStorage.removeItem('gns_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
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
