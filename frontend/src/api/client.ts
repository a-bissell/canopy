const BASE = '/api/v1';

export function getToken(): string | null {
  return localStorage.getItem('canopy_token');
}

export function setToken(token: string) {
  localStorage.setItem('canopy_token', token);
}

export function clearToken() {
  localStorage.removeItem('canopy_token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ username: string; role: string }>('/auth/me'),
  fleetStatus: () => request<{ total: number; online: number; offline: number; updating: number; error: number }>('/fleet/status'),
  listRobots: () => request<any[]>('/fleet/robots'),
  getRobot: (serial: string) => request<any>(`/fleet/robots/${serial}`),
  updateRobot: (serial: string, data: any) => request<any>(`/fleet/robots/${serial}`, { method: 'PUT', body: JSON.stringify(data) }),
  listGroups: () => request<any[]>('/fleet/groups'),
  createGroup: (name: string, description?: string) => request<any>('/fleet/groups', { method: 'POST', body: JSON.stringify({ name, description }) }),
  sendCommand: (serial: string, payload: any) => request<any>(`/command/${serial}`, { method: 'POST', body: JSON.stringify({ payload }) }),
  broadcast: (payload: any) => request<any>('/command/broadcast', { method: 'POST', body: JSON.stringify({ payload }) }),
  listPackages: () => request<any[]>('/packages'),
  createPackage: (data: any) => request<any>('/packages', { method: 'POST', body: JSON.stringify(data) }),
  auditLogs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ items: any[]; total: number; page: number; page_size: number }>(`/audit/logs${qs}`);
  },
  systemStatus: () => request<any>('/system/status'),
};
