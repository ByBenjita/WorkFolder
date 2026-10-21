import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { queryResult } from './helpers/mocks';

const mockClient = vi.hoisted(() => {
  const rpc = vi.fn();
  return { rpc, schema: vi.fn(() => ({ rpc })), from: vi.fn() };
});

/** Último mensaje enviado a la cola de auditoría (pgmq_public.send) */
const eventoAuditado = () => mockClient.rpc.mock.calls.filter(([fn]) => fn === 'send').at(-1)?.[1].message;

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { manejarEvento } from '@/lib/eventos';
import { POST } from '@/app/api/eventos/procesar/route';

const evento = (topic: string, payload: Record<string, unknown>) => ({
  evento_id: 'ev-1', topic, payload, publicado_en: '2026-10-21T12:00:00.000Z',
});

const SUSCRIPCION = { admin_id: 'admin-1', plan_id: 'business', preapproval_id: 'pre-1', origen: 'webhook', ip: '54.88.1.1' };
const PAGO        = { admin_id: 'admin-1', payment_id: 'pay-1', monto: 11.9, moneda: 'CLP', ip: '54.88.1.1' };

beforeEach(() => {
  mockClient.from.mockReset();
  mockClient.rpc.mockReset().mockResolvedValue({ data: null, error: null });
});

describe('facturación — suscriptor suscripcion.autorizada', () => {
  it('crea la suscripción y audita con la IP del webhook', async () => {
    const insert = queryResult({ data: null, error: null });
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null })).mockReturnValueOnce(insert);

    await manejarEvento(evento('suscripcion.autorizada', SUSCRIPCION));

    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({
      admin_id: 'admin-1', plan_id: 'business', estado: 'activo', mp_preapproval_id: 'pre-1',
      fecha_proximo_cobro: '2026-11-21T12:00:00.000Z',
    }));
    expect(eventoAuditado()).toMatchObject({
      accion: 'Suscripción al plan business activada por Mercado Pago', user_id: 'admin-1', ip: '54.88.1.1',
    });
  });

  it('actualiza la suscripción existente si cambió el plan', async () => {
    const update = queryResult({ data: null, error: null });
    mockClient.from
      .mockReturnValueOnce(queryResult({ data: { id: 's1', plan_id: 'startup', estado: 'activo', mp_preapproval_id: 'pre-0' }, error: null }))
      .mockReturnValueOnce(update);

    await manejarEvento(evento('suscripcion.autorizada', SUSCRIPCION));
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ plan_id: 'business', mp_preapproval_id: 'pre-1' }));
  });

  it('es idempotente: si ya está aplicada no escribe ni audita', async () => {
    mockClient.from.mockReturnValueOnce(queryResult({
      data: { id: 's1', plan_id: 'business', estado: 'activo', mp_preapproval_id: 'pre-1' }, error: null,
    }));

    await manejarEvento(evento('suscripcion.autorizada', SUSCRIPCION));
    expect(mockClient.from).toHaveBeenCalledTimes(1);
    expect(eventoAuditado()).toBeUndefined();
  });

  it('lanza si falla la escritura (sin ack → reintento)', async () => {
    mockClient.from
      .mockReturnValueOnce(queryResult({ data: null, error: null }))
      .mockReturnValueOnce(queryResult({ data: null, error: { message: 'db caída' } }));

    await expect(manejarEvento(evento('suscripcion.autorizada', SUSCRIPCION))).rejects.toThrow('db caída');
    expect(eventoAuditado()).toBeUndefined();
  });
});

describe('facturación — suscriptor pago.aprobado', () => {
  it('registra la factura y audita', async () => {
    const insert = queryResult({ data: null, error: null });
    mockClient.from
      .mockReturnValueOnce(queryResult({ data: { id: 'sus-1' }, error: null })) // suscripción
      .mockReturnValueOnce(queryResult({ data: null, error: null }))            // factura no existe
      .mockReturnValueOnce(insert);

    await manejarEvento(evento('pago.aprobado', PAGO));

    expect(insert.insert).toHaveBeenCalledWith({
      suscripcion_id: 'sus-1', monto: 11.9, estado: 'pagado',
      periodo_inicio: '2026-10-21', periodo_fin: '2026-11-21', mp_payment_id: 'pay-1',
    });
    expect(eventoAuditado()).toMatchObject({ user_id: 'admin-1', metadata: { payment_id: 'pay-1' } });
  });

  it('es idempotente: no duplica la factura de un mismo payment_id', async () => {
    mockClient.from
      .mockReturnValueOnce(queryResult({ data: { id: 'sus-1' }, error: null }))
      .mockReturnValueOnce(queryResult({ data: { id: 'fac-1' }, error: null }));

    await manejarEvento(evento('pago.aprobado', PAGO));
    expect(mockClient.from).toHaveBeenCalledTimes(2);
    expect(eventoAuditado()).toBeUndefined();
  });

  it('lanza si aún no existe la suscripción (el pago llegó antes que la preaprobación)', async () => {
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null }));
    await expect(manejarEvento(evento('pago.aprobado', PAGO))).rejects.toThrow('Aún no existe la suscripción');
  });
});

describe('facturación — temas desconocidos', () => {
  it('los ignora sin error (se confirman)', async () => {
    await expect(manejarEvento(evento('otro.tema', {}))).resolves.toBeUndefined();
    expect(mockClient.from).not.toHaveBeenCalled();
  });
});

describe('POST /api/eventos/procesar', () => {
  afterEach(() => { delete process.env.EVENTS_WORKER_SECRET; });

  const req = (secret?: string) => new NextRequest('http://localhost:3003/api/eventos/procesar', {
    method: 'POST', headers: secret ? { 'x-worker-secret': secret } : {},
  });

  it('rechaza sin el secreto del worker', async () => {
    process.env.EVENTS_WORKER_SECRET = 's3creto';
    expect((await POST(req('otro'))).status).toBe(401);
  });

  it('drena la cola de facturación con el secreto correcto', async () => {
    process.env.EVENTS_WORKER_SECRET = 's3creto';
    mockClient.rpc.mockResolvedValueOnce({ data: [], error: null });

    const res = await POST(req('s3creto'));
    expect(res.status).toBe(200);
    expect(mockClient.rpc).toHaveBeenCalledWith('read', expect.objectContaining({ queue_name: 'facturacion_eventos' }));
  });
});
