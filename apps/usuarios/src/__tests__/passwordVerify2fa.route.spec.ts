import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => ({
  auth: {
    setSession: vi.fn(),
    getSession: vi.fn(),
    mfa: { listFactors: vi.fn(), challengeAndVerify: vi.fn() },
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST } from '@/app/api/auth/password/verify-2fa/route';

function makeRequest(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/auth/password/verify-2fa', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

describe('POST /api/auth/password/verify-2fa', () => {
  beforeEach(() => {
    mockClient.auth.setSession.mockReset();
    mockClient.auth.getSession.mockReset();
    mockClient.auth.mfa.listFactors.mockReset();
    mockClient.auth.mfa.challengeAndVerify.mockReset();
  });

  it('rechaza con 400 si faltan datos (code, token o refresh_token)', async () => {
    const res = await POST(makeRequest({ code: '123456' }));
    expect(res.status).toBe(400);
  });

  it('devuelve 401 si la sesión es inválida', async () => {
    mockClient.auth.setSession.mockResolvedValueOnce({
      error: { message: 'expired' },
    });

    const res = await POST(makeRequest({ code: '123456', refresh_token: 'r1' }, 'tok-x'));
    expect(res.status).toBe(401);
  });

  it('devuelve 404 si el usuario no tiene factor TOTP verificado', async () => {
    mockClient.auth.setSession.mockResolvedValueOnce({ error: null });
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({ data: { all: [] } });

    const res = await POST(makeRequest({ code: '123456', refresh_token: 'r1' }, 'tok-x'));
    expect(res.status).toBe(404);
  });

  it('devuelve 401 si el código TOTP es incorrecto', async () => {
    mockClient.auth.setSession.mockResolvedValueOnce({ error: null });
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [{ id: 'f1', factor_type: 'totp', status: 'verified' }] },
    });
    mockClient.auth.mfa.challengeAndVerify.mockResolvedValueOnce({
      error: { message: 'invalid code' },
    });

    const res = await POST(makeRequest({ code: '000000', refresh_token: 'r1' }, 'tok-x'));
    expect(res.status).toBe(401);
  });

  it('devuelve el access_token AAL2 cuando el código es correcto', async () => {
    mockClient.auth.setSession.mockResolvedValueOnce({ error: null });
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [{ id: 'f1', factor_type: 'totp', status: 'verified' }] },
    });
    mockClient.auth.mfa.challengeAndVerify.mockResolvedValueOnce({ error: null });
    mockClient.auth.getSession.mockResolvedValueOnce({
      data: { session: { access_token: 'aal2-token' } },
    });

    const res = await POST(makeRequest({ code: '123456', refresh_token: 'r1' }, 'tok-x'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.access_token).toBe('aal2-token');
  });
});
