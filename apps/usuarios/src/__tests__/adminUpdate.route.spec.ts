import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
    admin: { getUserById: vi.fn(), updateUserById: vi.fn() },
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST } from '@/app/api/admin/update/route';

function makeRequest(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/admin/update', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function asAdminRequester() {
  mockClient.auth.getUser.mockResolvedValueOnce({
    data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
    error: null,
  });
}

describe('POST /api/admin/update', () => {
  beforeEach(() => {
    mockClient.auth.getUser.mockReset();
    mockClient.auth.admin.getUserById.mockReset();
    mockClient.auth.admin.updateUserById.mockReset();
  });

  it('devuelve 401 sin token', async () => {
    const res = await POST(makeRequest({ userId: 'u2', level: 'estandar', permissions: {} }));
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si quien solicita no es admin', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', app_metadata: { role: 'standard' } } },
      error: null,
    });

    const res = await POST(makeRequest({ userId: 'u2', level: 'estandar', permissions: {} }, 'tok-user'));
    expect(res.status).toBe(403);
  });

  it('devuelve 404 si el usuario objetivo no existe', async () => {
    asAdminRequester();
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'not found' },
    });

    const res = await POST(makeRequest({ userId: 'no-existe', level: 'estandar', permissions: {} }, 'tok-admin'));
    expect(res.status).toBe(404);
  });

  it('promueve a rol admin cuando level es admin_principal', async () => {
    asAdminRequester();
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'u2', app_metadata: { role: 'standard' }, user_metadata: {} } },
      error: null,
    });
    mockClient.auth.admin.updateUserById.mockResolvedValueOnce({ error: null });

    const res = await POST(
      makeRequest({ userId: 'u2', level: 'admin_principal', permissions: { create_users: true } }, 'tok-admin')
    );

    expect(res.status).toBe(200);
    expect(mockClient.auth.admin.updateUserById).toHaveBeenCalledWith(
      'u2',
      expect.objectContaining({
        app_metadata: expect.objectContaining({ role: 'admin', level: 'admin_principal' }),
      })
    );
  });

  it('conserva el rol existente cuando el nuevo level no es de tipo admin', async () => {
    asAdminRequester();
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'u2', app_metadata: { role: 'rrhh' }, user_metadata: {} } },
      error: null,
    });
    mockClient.auth.admin.updateUserById.mockResolvedValueOnce({ error: null });

    await POST(makeRequest({ userId: 'u2', level: 'estandar', permissions: {} }, 'tok-admin'));

    expect(mockClient.auth.admin.updateUserById).toHaveBeenCalledWith(
      'u2',
      expect.objectContaining({ app_metadata: expect.objectContaining({ role: 'rrhh' }) })
    );
  });

  it('aplica ban_duration largo cuando banned=true', async () => {
    asAdminRequester();
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'u2', app_metadata: {}, user_metadata: {} } },
      error: null,
    });
    mockClient.auth.admin.updateUserById.mockResolvedValueOnce({ error: null });

    await POST(makeRequest({ userId: 'u2', level: 'estandar', permissions: {}, banned: true }, 'tok-admin'));

    const callArgs = mockClient.auth.admin.updateUserById.mock.calls[0][1];
    expect(callArgs.ban_duration).not.toBe('none');
  });

  it('aplica ban_duration="none" cuando banned=false', async () => {
    asAdminRequester();
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'u2', app_metadata: {}, user_metadata: {} } },
      error: null,
    });
    mockClient.auth.admin.updateUserById.mockResolvedValueOnce({ error: null });

    await POST(makeRequest({ userId: 'u2', level: 'estandar', permissions: {}, banned: false }, 'tok-admin'));

    const callArgs = mockClient.auth.admin.updateUserById.mock.calls[0][1];
    expect(callArgs.ban_duration).toBe('none');
  });

  it('devuelve 500 si Supabase falla al actualizar', async () => {
    asAdminRequester();
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'u2', app_metadata: {}, user_metadata: {} } },
      error: null,
    });
    mockClient.auth.admin.updateUserById.mockResolvedValueOnce({
      error: { message: 'db down' },
    });

    const res = await POST(makeRequest({ userId: 'u2', level: 'estandar', permissions: {} }, 'tok-admin'));
    expect(res.status).toBe(500);
  });
});
