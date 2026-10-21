import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => {
  const rpc = vi.fn();
  return { rpc, schema: vi.fn(() => ({ rpc })), from: vi.fn() };
});

/** Último evento publicado (rpc publicar_evento) */
const eventoPublicado = () => mockClient.rpc.mock.calls.filter(([fn]) => fn === 'publicar_evento').at(-1)?.[1];
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
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '54.88.1.1' },
  });
}

beforeEach(() => {
  mockClient.from.mockReset();
  mockClient.rpc.mockReset().mockResolvedValue({ data: 2, error: null });
  mpMocks.preApprovalGet.mockReset();
  mpMocks.paymentGet.mockReset();
});

describe('POST /api/pago/webhook', () => {
  it('responde 200 aunque el body sea inválido (reintentar no lo arregla)', async () => {
    const req = new NextRequest('http://localhost:3003/api/pago/webhook', { method: 'POST', body: 'no-es-json' });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('ignora notificaciones de tipos no soportados', async () => {
    const res = await POST(webhookReq({ type: 'merchant_order', data: { id: '1' } }));
    expect(res.status).toBe(200);
    expect(eventoPublicado()).toBeUndefined();
  });

  it('publica suscripcion.autorizada cuando el preapproval está autorizado', async () => {
    mpMocks.preApprovalGet.mockResolvedValueOnce({ external_reference: 'admin-1|business', status: 'authorized' });

    const res = await POST(webhookReq({ type: 'subscription_preapproval', data: { id: 'pre-1' } }));
    expect(res.status).toBe(200);
    expect(eventoPublicado()).toEqual({
      p_topic:   'suscripcion.autorizada',
      p_payload: { admin_id: 'admin-1', plan_id: 'business', preapproval_id: 'pre-1', origen: 'webhook', ip: '54.88.1.1' },
    });
    // El webhook ya no escribe en la base: eso lo hace el suscriptor
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it('no publica si el preapproval aún no está autorizado', async () => {
    mpMocks.preApprovalGet.mockResolvedValueOnce({ external_reference: 'admin-1|business', status: 'pending' });

    const res = await POST(webhookReq({ type: 'subscription_preapproval', data: { id: 'pre-1' } }));
    expect(res.status).toBe(200);
    expect(eventoPublicado()).toBeUndefined();
  });

  it('publica pago.aprobado cuando el pago fue aprobado', async () => {
    mpMocks.paymentGet.mockResolvedValueOnce({
      status: 'approved',
      external_reference: 'admin-1|business',
      transaction_amount: 11.9,
      currency_id: 'CLP',
    });

    const res = await POST(webhookReq({ type: 'payment', data: { id: 'pay-1' } }));
    expect(res.status).toBe(200);
    expect(eventoPublicado()).toEqual({
      p_topic:   'pago.aprobado',
      p_payload: { admin_id: 'admin-1', payment_id: 'pay-1', monto: 11.9, moneda: 'CLP', ip: '54.88.1.1' },
    });
  });

  it('no publica si el pago fue rechazado', async () => {
    mpMocks.paymentGet.mockResolvedValueOnce({ status: 'rejected', external_reference: 'admin-1|business' });

    const res = await POST(webhookReq({ type: 'payment', data: { id: 'pay-1' } }));
    expect(res.status).toBe(200);
    expect(eventoPublicado()).toBeUndefined();
  });

  it('responde 500 (sin ack) si no se pudo publicar, para que MP reintente', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mpMocks.paymentGet.mockResolvedValueOnce({ status: 'approved', external_reference: 'admin-1|business', transaction_amount: 5 });
    mockClient.rpc.mockResolvedValueOnce({ data: null, error: { message: 'cola caída' } });

    const res = await POST(webhookReq({ type: 'payment', data: { id: 'pay-1' } }));
    expect(res.status).toBe(500);
    error.mockRestore();
  });

  it('responde 500 (sin ack) si la API de Mercado Pago falla', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mpMocks.preApprovalGet.mockRejectedValueOnce(new Error('timeout'));

    const res = await POST(webhookReq({ type: 'subscription_preapproval', data: { id: 'pre-1' } }));
    expect(res.status).toBe(500);
    error.mockRestore();
  });
});
