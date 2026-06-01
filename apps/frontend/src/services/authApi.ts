// ── El frontend llama a sus propias API routes (proxy interno) ───
// Nunca llama directamente al microservicio de usuarios
const BASE = '/api';

// ── Interfaces ───────────────────────────────────────────────────
export interface LoginResponse {
  success:       boolean;
  access_token:  string;
  refresh_token: string;
  mfa: { configured: boolean; next_step: 'verify' | 'setup' };
}

export interface MFAEnrollResponse {
  success:   boolean;
  factor_id: string;
  qr_code:   string;
}

export interface MFAVerifyResponse {
  success:        boolean;
  message:        string;
  access_token?:  string;
  refresh_token?: string;
}

export interface FactorResponse {
  success:   boolean;
  factor_id: string;
}

export interface SessionResponse {
  success: boolean;
  user:    { id: string; email: string };
  aal:     { current: string; next: string; mfa_complete: boolean };
}

export interface AdminUser {
  id:         string;
  email:      string;
  role:       string;
  is_admin:   boolean;
  created_at: string;
}

// ── Token en sessionStorage ──────────────────────────────────────
const TOKEN_KEY = 'wf_access_token';

export const setAccessToken = (token: string) => {
  if (typeof window !== 'undefined') sessionStorage.setItem(TOKEN_KEY, token);
};

export const getAccessToken = (): string => {
  if (typeof window !== 'undefined') return sessionStorage.getItem(TOKEN_KEY) ?? '';
  return '';
};

export const clearAccessToken = () => {
  if (typeof window !== 'undefined') sessionStorage.removeItem(TOKEN_KEY);
};

// ── Helpers ──────────────────────────────────────────────────────
const post = async <T>(path: string, body: object): Promise<T> => {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers,
    body:    JSON.stringify(body),
  });
  return res.json();
};

const get = async <T>(path: string): Promise<T> => {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { method: 'GET', headers });
  return res.json();
};

// ── Auth API ─────────────────────────────────────────────────────
export const authApi = {

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await post<LoginResponse>('/auth/login', { email, password });
    if (data.success && data.access_token) setAccessToken(data.access_token);
    return data;
  },

  logout: async () => {
    const data = await post<{ success: boolean }>('/auth/logout', {});
    clearAccessToken();
    return data;
  },

  getSession:        () => get<SessionResponse>('/auth/session'),
  mfaEnroll:         () => post<MFAEnrollResponse>('/mfa/enroll', {}),
  mfaVerify:         (factorId: string, code: string) =>
                       post<MFAVerifyResponse>('/mfa/verify', { factor_id: factorId, code }),
  getVerifiedFactor: () => get<FactorResponse>('/mfa/factor'),
  adminListUsers:    () => get<{ success: boolean; users: AdminUser[] }>('/admin/users'),
  adminPromoteUser:  (userId: string) => post<{ success: boolean; message: string }>('/admin/promote', { userId }),
};