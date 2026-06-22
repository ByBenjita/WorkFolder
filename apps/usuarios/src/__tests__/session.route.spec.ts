import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { buildSupabaseClientMock } from './helpers/supabaseMock';

const supabaseClientMock = buildSupabaseClientMock();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabaseClientMock),
}));

import { GET } from '@/app/api/auth/session/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/auth/session', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve 401 si no hay sesión activa', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'no session' },
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('marca is_admin=true cuando raw_app_meta_data.role es admin', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: {
        user: { id: 'u1', email: 'admin@workfolder.com', app_metadata: { role: 'admin' } },
      },
      error: null,
    });
    supabaseClientMock.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValueOnce({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    });

    const res = await GET(makeRequest('tok-admin'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user.is_admin).toBe(true);
    expect(json.aal.mfa_complete).toBe(true);
  });

  it('marca is_admin=false para un usuario estándar y refleja mfa incompleto', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: {
        user: { id: 'u2', email: 'user@workfolder.com', app_metadata: { role: 'standard' } },
      },
      error: null,
    });
    supabaseClientMock.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
    });

    const res = await GET(makeRequest('tok-user'));
    const json = await res.json();

    expect(json.user.is_admin).toBe(false);
    expect(json.aal.mfa_complete).toBe(false);
  });

  it('responde 500 si ocurre un error inesperado', async () => {
    supabaseClientMock.auth.getUser.mockRejectedValueOnce(new Error('boom'));

    const res = await GET(makeRequest('tok-x'));
    expect(res.status).toBe(500);
  });
});
