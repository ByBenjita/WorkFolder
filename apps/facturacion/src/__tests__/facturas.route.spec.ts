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

import { GET } from '@/app/api/facturas/route';

function authHeaders(token = 'tok-admin') {
  return { Authorization: `Bearer ${token}` };
}

beforeEach(() => {
  mockClient.auth.getUser.mockReset();
  mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });
  mockClient.from.mockReset();
});

describe('GET /api/facturas', () => {
  it('devuelve 401 sin token', async () => {
    const res = await GET(new NextRequest('http://localhost:3003/api/facturas'));
    expect(res.status).toBe(401);
  });

  it('devuelve 401 si el usuario no es administrador', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', app_metadata: { role: 'standard' } } },
      error: null,
    });

    const res = await GET(new NextRequest('http://localhost:3003/api/facturas', { headers: authHeaders() }));
    expect(res.status).toBe(401);
  });

  it('devuelve lista vacía si el admin aún no tiene suscripción', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null }));

    const res = await GET(new NextRequest('http://localhost:3003/api/facturas', { headers: authHeaders() }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.facturas).toEqual([]);
  });

  it('devuelve las facturas asociadas a la suscripción del admin', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { id: 'sus-1' }, error: null }));
    mockClient.from.mockReturnValueOnce(
      queryResult({ data: [{ id: 'f1', monto: 17.85 }, { id: 'f2', monto: 17.85 }], error: null })
    );

    const res = await GET(new NextRequest('http://localhost:3003/api/facturas', { headers: authHeaders() }));
    const json = await res.json();

    expect(json.facturas).toHaveLength(2);
  });

  it('devuelve 500 si Supabase falla al obtener las facturas', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { id: 'sus-1' }, error: null }));
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: { message: 'db down' } }));

    const res = await GET(new NextRequest('http://localhost:3003/api/facturas', { headers: authHeaders() }));
    expect(res.status).toBe(500);
  });
});
