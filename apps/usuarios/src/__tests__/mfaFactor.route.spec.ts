import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => ({
  auth: { mfa: { listFactors: vi.fn() } },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { GET } from '@/app/api/mfa/factor/route';

function makeRequest() {
  return new NextRequest('http://localhost/api/mfa/factor', {
    method: 'GET',
    headers: { Authorization: 'Bearer tok-x' },
  });
}

describe('GET /api/mfa/factor', () => {
  beforeEach(() => {
    mockClient.auth.mfa.listFactors.mockReset();
  });

  it('devuelve 404 si no hay factor TOTP verificado', async () => {
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [] },
      error: null,
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(404);
  });

  it('ignora factores no verificados y devuelve 404', async () => {
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [{ id: 'f1', factor_type: 'totp', status: 'unverified' }] },
      error: null,
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(404);
  });

  it('devuelve el factor_id cuando existe un factor TOTP verificado', async () => {
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [{ id: 'f-verified', factor_type: 'totp', status: 'verified' }] },
      error: null,
    });

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.factor_id).toBe('f-verified');
  });

  it('devuelve error si Supabase falla al listar factores', async () => {
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: null,
      error: { message: 'fallo' },
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });
});
