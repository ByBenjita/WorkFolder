import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { queryResult } from './helpers/mocks';

const mockClient = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}));
const mpMocks = vi.hoisted(() => ({ preApprovalGet: vi.fn() }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  PreApproval: vi.fn().mockImplementation(function () { return { get: mpMocks.preApprovalGet }; }),
}));

import { GET } from '@/app/api/pago/sync/route';

function authHeaders(token = 'tok-admin') {
  return { Authorization: `Bearer ${token}` };
}

function asAdmin(id = 'admin-1') {
  mockClient.auth.getUser.mockResolvedValueOnce({
    data: { user: { id, app_metadata: { role: 'admin' } } },
    error: null,
  });
}

beforeEach(() => {
  mockClient.auth.getUser.mockReset();
  mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });
  mockClient.from.mockReset();
  mpMocks.preApprovalGet.mockReset();
});

describe('GET /api/pago/sync', () => {
  it('devuelve 401 sin token', async () => {
    const res = await GET(new NextRequest('http://localhost:3003/api/pago/sync?preapproval_id=p1'));
    expect(res.status).toBe(401);
  });

  it('rechaza con 400 si falta preapproval_id', async () => {
    asAdmin();
    const res = await GET(new NextRequest('http://localhost:3003/api/pago/sync', { headers: authHeaders() }));
    expect(res.status).toBe(400);
  });

  it('devuelve 403 si la suscripción de MP no pertenece al admin autenticado', async () => {
    asAdmin('admin-1');
    mpMocks.preApprovalGet.mockResolvedValueOnce({ external_reference: 'otro-admin|business', status: 'authorized' });

    const res = await GET(new NextRequest('http://localhost:3003/api/pago/sync?preapproval_id=p1', { headers: authHeaders() }));
    expect(res.status).toBe(403);
  });

  it('indica sincronizado=false si la suscripción aún no está autorizada', async () => {
    asAdmin('admin-1');
    mpMocks.preApprovalGet.mockResolvedValueOnce({ external_reference: 'admin-1|business', status: 'pending' });

    const res = await GET(new NextRequest('http://localhost:3003/api/pago/sync?preapproval_id=p1', { headers: authHeaders() }));
    const json = await res.json();

    expect(json.sincronizado).toBe(false);
    expect(json.estado).toBe('pending');
  });

  it('sincroniza y crea la suscripción cuando MP confirma la autorización', async () => {
    asAdmin('admin-1');
    mpMocks.preApprovalGet.mockResolvedValueOnce({ external_reference: 'admin-1|enterprise', status: 'authorized' });
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null })); // no existing
    mockClient.from.mockReturnValueOnce(queryResult({ data: {}, error: null })); // insert

    const res = await GET(new NextRequest('http://localhost:3003/api/pago/sync?preapproval_id=p1', { headers: authHeaders() }));
    const json = await res.json();

    expect(json.sincronizado).toBe(true);
    expect(json.plan_id).toBe('enterprise');
  });
});
