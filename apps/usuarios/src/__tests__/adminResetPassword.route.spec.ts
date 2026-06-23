import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => ({
  auth: { getUser: vi.fn(), admin: { updateUserById: vi.fn() } },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST } from '@/app/api/admin/reset-password/route';

function makeRequest(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/admin/reset-password', {
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

describe('POST /api/admin/reset-password', () => {
  beforeEach(() => {
    mockClient.auth.getUser.mockReset();
    mockClient.auth.admin.updateUserById.mockReset();
  });

  it('devuelve 401 sin token', async () => {
    const res = await POST(makeRequest({ userId: 'u2', newPassword: '12345678' }));
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si quien solicita no es admin', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', app_metadata: { role: 'standard' } } },
      error: null,
    });

    const res = await POST(makeRequest({ userId: 'u2', newPassword: '12345678' }, 'tok-user'));
    expect(res.status).toBe(403);
  });

  it('rechaza con 400 si falta userId o newPassword', async () => {
    asAdminRequester();
    const res = await POST(makeRequest({ userId: 'u2' }, 'tok-admin'));
    expect(res.status).toBe(400);
  });

  it('rechaza contraseñas de menos de 6 caracteres', async () => {
    asAdminRequester();
    const res = await POST(makeRequest({ userId: 'u2', newPassword: '123' }, 'tok-admin'));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/al menos 6 caracteres/i);
  });

  it('actualiza la contraseña correctamente', async () => {
    asAdminRequester();
    mockClient.auth.admin.updateUserById.mockResolvedValueOnce({ error: null });

    const res = await POST(makeRequest({ userId: 'u2', newPassword: '12345678' }, 'tok-admin'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockClient.auth.admin.updateUserById).toHaveBeenCalledWith('u2', { password: '12345678' });
  });

  it('devuelve 500 si Supabase falla al actualizar', async () => {
    asAdminRequester();
    mockClient.auth.admin.updateUserById.mockResolvedValueOnce({
      error: { message: 'db down' },
    });

    const res = await POST(makeRequest({ userId: 'u2', newPassword: '12345678' }, 'tok-admin'));
    expect(res.status).toBe(500);
  });
});
