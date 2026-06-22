import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { buildSupabaseClientMock } from './helpers/supabaseMock';

const supabaseClientMock = buildSupabaseClientMock();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabaseClientMock),
}));

import { POST } from '@/app/api/admin/promote/route';

function makeRequest(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/admin/promote', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

describe('POST /api/admin/promote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve 401 si no se envía token', async () => {
    const res = await POST(makeRequest({ userId: 'u2' }));
    expect(res.status).toBe(401);
  });

  it('devuelve 401 si el token no corresponde a un usuario válido', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'invalid token' },
    });

    const res = await POST(makeRequest({ userId: 'u2' }, 'tok-invalido'));
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si quien solicita no es administrador', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', app_metadata: { role: 'standard' } } },
      error: null,
    });

    const res = await POST(makeRequest({ userId: 'u2' }, 'tok-user'));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.message).toMatch(/permisos insuficientes/i);
  });

  it('rechaza con 400 si el admin intenta promoverse a sí mismo', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ userId: 'admin-1' }, 'tok-admin'));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/propio rol/i);
  });

  it('devuelve 404 si el usuario objetivo no existe', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    supabaseClientMock.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'not found' },
    });

    const res = await POST(makeRequest({ userId: 'no-existe' }, 'tok-admin'));
    expect(res.status).toBe(404);
  });

  it('promueve correctamente a un usuario válido cuando quien pide es admin', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    supabaseClientMock.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'u2', email: 'colaborador@workfolder.com', app_metadata: { role: 'standard' } } },
      error: null,
    });
    supabaseClientMock.auth.admin.updateUserById.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    const res = await POST(makeRequest({ userId: 'u2' }, 'tok-admin'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/colaborador@workfolder\.com/);
    expect(supabaseClientMock.auth.admin.updateUserById).toHaveBeenCalledWith(
      'u2',
      expect.objectContaining({ app_metadata: expect.objectContaining({ role: 'admin' }) })
    );
  });

  it('devuelve 500 si falla la actualización en Supabase', async () => {
    supabaseClientMock.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    supabaseClientMock.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'u2', email: 'x@x.com', app_metadata: {} } },
      error: null,
    });
    supabaseClientMock.auth.admin.updateUserById.mockResolvedValueOnce({
      data: null,
      error: { message: 'db down' },
    });

    const res = await POST(makeRequest({ userId: 'u2' }, 'tok-admin'));
    expect(res.status).toBe(500);
  });
});
