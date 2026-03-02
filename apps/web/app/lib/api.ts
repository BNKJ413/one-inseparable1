// API Configuration and Utilities
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

// Token management
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('one_access_token');
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('one_refresh_token');
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('one_access_token', accessToken);
  localStorage.setItem('one_refresh_token', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('one_access_token');
  localStorage.removeItem('one_refresh_token');
  localStorage.removeItem('one_user');
  localStorage.removeItem('one_couple');
};

// Refresh access token
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

// API request with auth
async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest<T>(path, options, false);
    }
    // Don't redirect, just throw - let the component handle it
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Public API methods (no auth required)
export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', cache: 'no-store' });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}

// Authentication API
export const authApi = {
  register: (email: string, password: string, name?: string) =>
    apiPost<{ user: { id: string; email: string; firstName?: string }; accessToken: string; refreshToken: string }>(
      '/api/auth/register',
      { email, password, firstName: name }
    ),

  login: (email: string, password: string) =>
    apiPost<{ user: { id: string; email: string; name?: string }; accessToken: string; refreshToken: string }>(
      '/api/auth/login',
      { email, password }
    ),

  logout: (refreshToken: string) =>
    apiPost<{ ok: boolean }>('/api/auth/logout', { refreshToken }),

  me: () =>
    apiGet<{ user: { id: string; email: string; name?: string; faithMode?: boolean; loveLanguages?: string[]; anchorTimes?: string[]; boundaries?: string; timeAvailability?: string; coupleId?: string } }>('/api/auth/me'),

  forgotPassword: (email: string) =>
    apiPost<{ ok: boolean }>('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiPost<{ ok: boolean }>('/api/auth/reset-password', { token, newPassword }),
};

// User preferences types
export interface UserPreferences {
  faithMode: boolean;
  loveLanguages: string[];
  anchorTimes: string[];
  timeAvailability: string;
  boundaries: string;
  notificationsEnabled: boolean;
}

// Couple API
export const coupleApi = {
  create: () =>
    apiPost<{ coupleId: string; pairCode: string }>('/api/couple/create', {}),

  join: (pairCode: string) =>
    apiPost<{ coupleId: string; partnerId: string }>('/api/couple/join', { pairCode }),
};

// Anchors API
export const anchorsApi = {
  today: (coupleId: string) =>
    apiGet<{ anchor: any }>(`/api/anchors/today?coupleId=${encodeURIComponent(coupleId)}`),

  complete: (coupleId: string, userId: string, anchorId: string) =>
    apiPost<{ ok: boolean; pointsAwarded: number; streak: number }>('/api/anchors/complete', {
      coupleId,
      userId,
      anchorId,
    }),
};

// Scripture API
export const scriptureApi = {
  list: () =>
    apiGet<{ list: any[] }>('/api/scripture/list'),

  search: (query: string) =>
    apiGet<{ list: any[] }>(`/api/scripture/search?q=${encodeURIComponent(query)}`),

  save: (scriptureId: string) =>
    apiPost<{ ok: boolean }>('/api/scripture/save', { scriptureId }),
};

// Actions API
export interface ActionFilters {
  loveLanguage?: string;
  timeRequired?: string;
  mode?: string;
}

export const actionsApi = {
  list: (filters?: ActionFilters) => {
    const params = new URLSearchParams();
    if (filters?.loveLanguage) params.append('loveLanguage', filters.loveLanguage);
    if (filters?.timeRequired) params.append('timeRequired', filters.timeRequired);
    if (filters?.mode) params.append('mode', filters.mode);
    const query = params.toString();
    return apiGet<{ list: any[] }>(`/api/actions/list${query ? `?${query}` : ''}`);
  },

  complete: (actionId: string) =>
    apiPost<{ ok: boolean; pointsAwarded: number }>('/api/actions/complete', { actionId }),
};
