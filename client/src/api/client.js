const BASE = '/api';

function getToken() {
  return localStorage.getItem('missio_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('missio_token', token);
  else localStorage.removeItem('missio_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError('Can\u2019t reach the server. Check your connection and try again.', 0);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const api = {
  signup: (email, password, goals) => request('/auth/signup', { method: 'POST', body: { email, password, goals }, auth: false }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/users/me'),
  setGoals: (goals) => request('/users/me/goals', { method: 'PUT', body: { goals } }),

  checkIn: (payload) => request('/checkin', { method: 'POST', body: payload }),
  getCheckIn: (date) => request(`/checkin/${date}`),

  planToday: () => request('/plan/today'),
  planForDate: (date) => request(`/plan/${date}`),

  getMission: (id) => request(`/missions/${id}`),
  setVariant: (id, variant) => request(`/missions/${id}/variant`, { method: 'POST', body: { variant } }),
  startMission: (id) => request(`/missions/${id}/start`, { method: 'POST' }),
  completeStep: (id, index, outcome) => request(`/missions/${id}/steps/${index}/complete`, { method: 'POST', body: { outcome } }),
  skipMission: (id) => request(`/missions/${id}/skip`, { method: 'POST' }),

  progress: () => request('/progress'),
};
