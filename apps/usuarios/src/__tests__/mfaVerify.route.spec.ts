import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { buildSupabaseClientMock } from './helpers/supabaseMock';

const supabaseClientMock = buildSupabaseClientMock();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabaseClientMock),
}));

import { POST } from '@/app/api/mfa/verify/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/mfa/verify', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok-x' },
  });
}

describe('POST /api/mfa/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza con 400 si falta factor_id o code', async () => {
    const res = await POST(makeRequest({ code: '123456' }));
    expect(res.status).toBe(400);
  });

  it('devuelve 401 si el código es incorrecto o expiró', async () => {
    supabaseClientMock.auth.mfa.challengeAndVerify.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid code' },
    });

    const res = await POST(makeRequest({ factor_id: 'f1', code: '000000' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.message).toMatch(/código incorrecto/i);
  });

  it('verifica correctamente un código válido', async () => {
    supabaseClientMock.auth.mfa.challengeAndVerify.mockResolvedValueOnce({
      data: { id: 'f1' },
      error: null,
    });

    const res = await POST(makeRequest({ factor_id: 'f1', code: '123456' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
