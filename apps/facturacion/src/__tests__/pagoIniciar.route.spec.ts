import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => ({
  auth: { getUser: vi.fn() },
}));
const mpMocks = vi.hoisted(() => ({
  preApprovalCreate: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  PreApproval: vi.fn().mockImplementation(function () { return { create: mpMocks.preApprovalCreate }; }),
}));

import { POST } from '@/app/api/pago/iniciar/route';

function authHeaders(token = 'tok-admin') {
  return { Authorization: `Bearer ${token}` };
}

function jsonReq(body: unknown, headers: Record<string, string> = authHeaders()) {
  return new NextRequest('http://localhost:3003/api/pago/iniciar', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

beforeEach(() => {
  mockClient.auth.getUser.mockReset();
  mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });
  mpMocks.preApprovalCreate.mockReset();
});

describe('POST /api/pago/iniciar', () => {
  it('devuelve 401 sin token', async () => {
    const res = await POST(jsonReq({ plan_id: 'business' }, {}));
    expect(res.status).toBe(401);
  });

  it('rechaza un plan inválido', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', email: 'admin@workfolder.com', app_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(jsonReq({ plan_id: 'plan-inexistente' }));
    expect(res.status).toBe(400);
  });

  it('crea la preaprobación en Mercado Pago y devuelve el init_point', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', email: 'admin@workfolder.com', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mpMocks.preApprovalCreate.mockResolvedValueOnce({
      init_point: 'https://mp.test/checkout/abc',
      sandbox_init_point: 'https://sandbox.mp.test/checkout/abc',
      id: 'preapproval-123',
    });

    const res = await POST(jsonReq({ plan_id: 'business', payer_email: 'cliente@workfolder.com' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.init_point).toBe('https://mp.test/checkout/abc');
    expect(json.preapproval_id).toBe('preapproval-123');
  });

  it('calcula el monto en USD incluyendo el IVA del plan', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', email: 'admin@workfolder.com', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mpMocks.preApprovalCreate.mockResolvedValueOnce({ init_point: 'x', id: '1' });

    await POST(jsonReq({ plan_id: 'startup' }));

    const callArgs = mpMocks.preApprovalCreate.mock.calls[0][0];
    // Startup: US$8 + 19% IVA = 9.52
    expect(callArgs.body.auto_recurring.transaction_amount).toBe(9.52);
    expect(callArgs.body.auto_recurring.currency_id).toBe('USD');
  });

  it('usa el email del usuario autenticado si no se envía payer_email', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', email: 'admin@workfolder.com', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mpMocks.preApprovalCreate.mockResolvedValueOnce({ init_point: 'x', id: '1' });

    await POST(jsonReq({ plan_id: 'startup' }));

    const callArgs = mpMocks.preApprovalCreate.mock.calls[0][0];
    expect(callArgs.body.payer_email).toBe('admin@workfolder.com');
  });

  it('devuelve 503 si MP_ACCESS_TOKEN no está configurado', async () => {
    const original = process.env.MP_ACCESS_TOKEN;
    delete process.env.MP_ACCESS_TOKEN;

    const res = await POST(jsonReq({ plan_id: 'business' }));
    expect(res.status).toBe(503);

    process.env.MP_ACCESS_TOKEN = original;
  });

  it('devuelve 500 si Mercado Pago rechaza la creación', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', email: 'admin@workfolder.com', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mpMocks.preApprovalCreate.mockRejectedValueOnce(new Error('MP rechazó la solicitud'));

    const res = await POST(jsonReq({ plan_id: 'business' }));
    expect(res.status).toBe(500);
  });
});
