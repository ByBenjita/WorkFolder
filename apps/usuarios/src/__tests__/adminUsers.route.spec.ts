import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { buildSupabaseClientMock } from './helpers/supabaseMock';

const supabaseClientMock = buildSupabaseClientMock();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabaseClientMock),
}));

import { GET } from '@/app/api/admin/users/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/admin/users', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve 401 sin token', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si quien consulta no es admin', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', app_metadata: { role: 'standard' } } },
      error: null,
    });

    const res = await GET(makeRequest('tok-user'));
    expect(res.status).toBe(403);
  });

  it('lista usuarios y calcula is_admin / mfa_enabled correctamente', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    supabaseClientMock.auth.admin.listUsers.mockResolvedValueOnce({
      data: {
        users: [
          {
            id: 'u1',
            email: 'admin@workfolder.com',
            app_metadata: { role: 'admin' },
            user_metadata: { full_name: 'Admin Uno' },
            factors: [{ status: 'verified' }],
            created_at: '2026-01-01',
            banned_until: null,
          },
          {
            id: 'u2',
            email: 'rrhh@workfolder.com',
            app_metadata: { role: 'rrhh' },
            user_metadata: {},
            factors: [],
            created_at: '2026-01-02',
            banned_until: null,
          },
        ],
      },
      error: null,
    });

    const res = await GET(makeRequest('tok-admin'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.users).toHaveLength(2);

    const admin = json.users.find((u: { id: string }) => u.id === 'u1');
    expect(admin.is_admin).toBe(true);
    expect(admin.mfa_enabled).toBe(true);

    const rrhh = json.users.find((u: { id: string }) => u.id === 'u2');
    expect(rrhh.is_admin).toBe(false);
    // sin factores registrados, la ruta considera mfa_enabled=true (no hay factor sin verificar)
    expect(rrhh.mfa_enabled).toBe(true);
  });

  it('marca banned=true si banned_until está en el futuro', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    supabaseClientMock.auth.admin.listUsers.mockResolvedValueOnce({
      data: {
        users: [
          {
            id: 'u3',
            email: 'bloqueado@workfolder.com',
            app_metadata: {},
            user_metadata: {},
            factors: [],
            created_at: '2026-01-03',
            banned_until: future,
          },
        ],
      },
      error: null,
    });

    const res = await GET(makeRequest('tok-admin'));
    const json = await res.json();

    expect(json.users[0].banned).toBe(true);
  });

  it('devuelve 500 si Supabase falla al listar usuarios', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    supabaseClientMock.auth.admin.listUsers.mockResolvedValueOnce({
      data: { users: [] },
      error: { message: 'db down' },
    });

    const res = await GET(makeRequest('tok-admin'));
    expect(res.status).toBe(500);
  });
});
