import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => ({
  auth: { setSession: vi.fn(), updateUser: vi.fn() },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST } from '@/app/api/auth/password/reset/route';

function makeRequest(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

describe('POST /api/auth/password/reset', () => {
  beforeEach(() => {
    mockClient.auth.setSession.mockReset();
    mockClient.auth.updateUser.mockReset();
  });

  it('rechaza si falta la nueva contraseña', async () => {
    const res = await POST(makeRequest({}, 'tok-x'));
    expect(res.status).toBe(400);
  });

  it('rechaza contraseñas de menos de 8 caracteres', async () => {
    const res = await POST(makeRequest({ password: '123' }, 'tok-x'));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/al menos 8 caracteres/i);
  });

  it('devuelve 401 si no se envía token', async () => {
    const res = await POST(makeRequest({ password: '12345678' }));
    expect(res.status).toBe(401);
  });

  it('devuelve 401 si la sesión AAL2 es inválida', async () => {
    mockClient.auth.setSession.mockResolvedValueOnce({
      error: { message: 'token expirado' },
    });

    const res = await POST(makeRequest({ password: '12345678', refresh_token: 'r1' }, 'tok-x'));
    expect(res.status).toBe(401);
  });

  it('actualiza la contraseña correctamente con sesión válida', async () => {
    mockClient.auth.setSession.mockResolvedValueOnce({ error: null });
    mockClient.auth.updateUser.mockResolvedValueOnce({ error: null });

    const res = await POST(makeRequest({ password: '12345678', refresh_token: 'r1' }, 'tok-x'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('devuelve error de negocio si Supabase falla al actualizar la contraseña', async () => {
    mockClient.auth.setSession.mockResolvedValueOnce({ error: null });
    mockClient.auth.updateUser.mockResolvedValueOnce({
      error: { message: 'password reused' },
    });

    const res = await POST(makeRequest({ password: '12345678', refresh_token: 'r1' }, 'tok-x'));
    const json = await res.json();

    expect(json.success).toBe(false);
  });
});
