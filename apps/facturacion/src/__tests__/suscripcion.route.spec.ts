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

import { GET, POST } from '@/app/api/suscripcion/route';

function authHeaders(token = 'tok-admin') {
  return { Authorization: `Bearer ${token}` };
}

function asAdmin() {
  mockClient.auth.getUser.mockResolvedValueOnce({
    data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
    error: null,
  });
}

beforeEach(() => {
  mockClient.auth.getUser.mockReset();
  mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });
  mockClient.from.mockReset();
});

describe('GET /api/suscripcion', () => {
  it('devuelve 401 sin token', async () => {
    const req = new NextRequest('http://localhost:3003/api/suscripcion');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('devuelve 401 si el usuario no es administrador', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', app_metadata: { role: 'standard' } } },
      error: null,
    });

    const req = new NextRequest('http://localhost:3003/api/suscripcion', { headers: authHeaders() });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('devuelve una suscripción Enterprise por defecto si el admin aún no tiene una registrada', async () => {
    asAdmin();
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null }));

    const req = new NextRequest('http://localhost:3003/api/suscripcion', { headers: authHeaders() });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.suscripcion.plan_id).toBe('enterprise');
    expect(json.suscripcion.estado).toBe('activo');
  });

  it('devuelve la suscripción existente del admin', async () => {
    asAdmin();
    mockClient.from.mockReturnValueOnce(
      queryResult({ data: { plan_id: 'business', estado: 'activo' }, error: null })
    );

    const req = new NextRequest('http://localhost:3003/api/suscripcion', { headers: authHeaders() });
    const res = await GET(req);
    const json = await res.json();

    expect(json.suscripcion.plan_id).toBe('business');
  });

  it('devuelve 500 si Supabase falla', async () => {
    asAdmin();
    mockClient.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockRejectedValue(new Error('db down')),
    });

    const req = new NextRequest('http://localhost:3003/api/suscripcion', { headers: authHeaders() });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/suscripcion (cambio de plan)', () => {
  function jsonReq(body: unknown, headers: Record<string, string> = authHeaders()) {
    return new NextRequest('http://localhost:3003/api/suscripcion', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  }

  it('devuelve 401 sin token', async () => {
    const res = await POST(jsonReq({ plan_id: 'business' }, {}));
    expect(res.status).toBe(401);
  });

  it('rechaza un plan_id inválido', async () => {
    asAdmin();
    const res = await POST(jsonReq({ plan_id: 'plan-inexistente' }));
    expect(res.status).toBe(400);
  });

  it('crea una nueva suscripción si el admin no tenía una', async () => {
    asAdmin();
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null })); // existing check
    mockClient.from.mockReturnValueOnce(
      queryResult({ data: { id: 'sus-1', plan_id: 'business' }, error: null })
    ); // insert

    const res = await POST(jsonReq({ plan_id: 'business' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.suscripcion.plan_id).toBe('business');
  });

  it('actualiza la suscripción existente del admin', async () => {
    asAdmin();
    mockClient.from.mockReturnValueOnce(queryResult({ data: { id: 'sus-1' }, error: null })); // existing
    mockClient.from.mockReturnValueOnce(
      queryResult({ data: { id: 'sus-1', plan_id: 'enterprise' }, error: null })
    ); // update

    const res = await POST(jsonReq({ plan_id: 'enterprise' }));
    const json = await res.json();

    expect(json.suscripcion.plan_id).toBe('enterprise');
  });
});
