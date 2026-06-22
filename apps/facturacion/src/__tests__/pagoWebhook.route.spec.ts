import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { queryResult } from './helpers/mocks';

const mockClient = vi.hoisted(() => ({
  from: vi.fn(),
}));
const mpMocks = vi.hoisted(() => ({ preApprovalGet: vi.fn(), paymentGet: vi.fn() }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  PreApproval: vi.fn().mockImplementation(function () { return { get: mpMocks.preApprovalGet }; }),
  Payment: vi.fn().mockImplementation(function () { return { get: mpMocks.paymentGet }; }),
}));

import { POST } from '@/app/api/pago/webhook/route';

function webhookReq(body: unknown) {
  return new NextRequest('http://localhost:3003/api/pago/webhook', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockClient.from.mockReset();
  mpMocks.preApprovalGet.mockReset();
  mpMocks.paymentGet.mockReset();
});

describe('POST /api/pago/webhook', () => {
  it('siempre responde 200 aunque el body sea inválido (requisito de MP)', async () => {
    const req = new NextRequest('http://localhost:3003/api/pago/webhook', { method: 'POST', body: 'no-es-json' });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('ignora notificaciones de tipos no soportados', async () => {
    const res = await POST(webhookReq({ type: 'merchant_order', data: { id: '1' } }));
    expect(res.status).toBe(200);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it('sincroniza la suscripción cuando el preapproval está autorizado', async () => {
    mpMocks.preApprovalGet.mockResolvedValueOnce({ external_reference: 'admin-1|business', status: 'authorized' });
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null })); // no existing
    mockClient.from.mockReturnValueOnce(queryResult({ data: {}, error: null })); // insert

    const res = await POST(webhookReq({ type: 'subscription_preapproval', data: { id: 'pre-1' } }));
    expect(res.status).toBe(200);
    expect(mockClient.from).toHaveBeenCalledWith('suscripciones');
  });

  it('no hace nada si el preapproval aún no está autorizado', async () => {
    mpMocks.preApprovalGet.mockResolvedValueOnce({ external_reference: 'admin-1|business', status: 'pending' });

    const res = await POST(webhookReq({ type: 'subscription_preapproval', data: { id: 'pre-1' } }));
    expect(res.status).toBe(200);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it('registra una factura cuando el pago fue aprobado', async () => {
    mpMocks.paymentGet.mockResolvedValueOnce({
      status: 'approved',
      external_reference: 'admin-1|business',
      transaction_amount: 11.9,
    });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { id: 'sus-1' }, error: null })); // suscripcion lookup
    mockClient.from.mockReturnValueOnce(queryResult({ data: {}, error: null })); // facturas.insert

    const res = await POST(webhookReq({ type: 'payment', data: { id: 'pay-1' } }));
    expect(res.status).toBe(200);
    expect(mockClient.from).toHaveBeenCalledWith('facturas');
  });

  it('no registra factura si el pago fue rechazado', async () => {
    mpMocks.paymentGet.mockResolvedValueOnce({ status: 'rejected', external_reference: 'admin-1|business' });

    const res = await POST(webhookReq({ type: 'payment', data: { id: 'pay-1' } }));
    expect(res.status).toBe(200);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it('no registra factura si no existe suscripción asociada al admin', async () => {
    mpMocks.paymentGet.mockResolvedValueOnce({
      status: 'approved',
      external_reference: 'admin-sin-suscripcion|business',
      transaction_amount: 9.52,
    });
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null }));

    const res = await POST(webhookReq({ type: 'payment', data: { id: 'pay-2' } }));
    expect(res.status).toBe(200);
    expect(mockClient.from).toHaveBeenCalledTimes(1);
  });
});
