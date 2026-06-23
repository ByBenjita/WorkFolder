import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { queryResult } from './helpers/mocks';

const mockClient = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST } from '@/app/api/pago/simular/route';

function authHeaders(token = 'tok-admin') {
  return { Authorization: `Bearer ${token}` };
}

function jsonReq(body: unknown, headers: Record<string, string> = authHeaders()) {
  return new NextRequest('http://localhost:3003/api/pago/simular', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

beforeEach(() => {
  mockClient.auth.getUser.mockReset();
  mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });
  mockClient.from.mockReset();
});

describe('POST /api/pago/simular', () => {
  it('rechaza con 403 si MP_ACCESS_TOKEN no es de sandbox (no empieza con TEST-)', async () => {
    const original = process.env.MP_ACCESS_TOKEN;
    process.env.MP_ACCESS_TOKEN = 'APP_USR-produccion-real';

    const res = await POST(jsonReq({ plan_id: 'business' }));
    expect(res.status).toBe(403);

    process.env.MP_ACCESS_TOKEN = original;
  });

  it('devuelve 401 sin token (en sandbox)', async () => {
    const res = await POST(jsonReq({ plan_id: 'business' }, {}));
    expect(res.status).toBe(401);
  });

  it('rechaza un plan_id inválido', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(jsonReq({ plan_id: 'no-existe' }));
    expect(res.status).toBe(400);
  });

  it('simula la activación de una suscripción nueva en sandbox', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null }));
    mockClient.from.mockReturnValueOnce(queryResult({ data: {}, error: null }));

    const res = await POST(jsonReq({ plan_id: 'startup' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.simulado).toBe(true);
    expect(json.plan_id).toBe('startup');
  });

  it('actualiza una suscripción existente al simular un cambio de plan', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { id: 'sus-1' }, error: null }));
    mockClient.from.mockReturnValueOnce(queryResult({ data: {}, error: null }));

    const res = await POST(jsonReq({ plan_id: 'enterprise' }));
    const json = await res.json();

    expect(json.plan_id).toBe('enterprise');
  });
});
