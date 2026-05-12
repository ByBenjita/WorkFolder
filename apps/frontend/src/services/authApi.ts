const API_URL = process.env.NEXT_PUBLIC_USUARIOS_API_URL ?? 'http://localhost:3001';

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
  success: boolean;
  message: string;
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

// ── Token — guardado en sessionStorage para sobrevivir navegación ─
const TOKEN_KEY = 'wf_access_token';

export const setAccessToken = (token: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
};

export const getAccessToken = (): string => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  }
  return '';
};

export const clearAccessToken = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
  }
};

// ── Helpers de fetch ─────────────────────────────────────────────
const post = async <T>(path: string, body: object, token?: string): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method:  'POST',
    headers,
    body:    JSON.stringify(body),
  });
  return res.json();
};

const get = async <T>(path: string, token?: string): Promise<T> => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers,
  });
  return res.json();
};

// ── Auth API ─────────────────────────────────────────────────────
export const authApi = {

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await post<LoginResponse>('/api/auth/login', { email, password });
    if (data.success && data.access_token) {
      setAccessToken(data.access_token);
    }
    return data;
  },

  logout: async () => {
    const token = getAccessToken();
    const data  = await post<{ success: boolean }>('/api/auth/logout', {}, token);
    clearAccessToken();
    return data;
  },

  getSession:        () => get<SessionResponse>('/api/auth/session', getAccessToken()),
  mfaEnroll:         () => post<MFAEnrollResponse>('/api/mfa/enroll', {}, getAccessToken()),
  mfaVerify:         (factorId: string, code: string) =>
                       post<MFAVerifyResponse>('/api/mfa/verify', { factor_id: factorId, code }, getAccessToken()),
  getVerifiedFactor: () => get<FactorResponse>('/api/mfa/factor', getAccessToken()),
};