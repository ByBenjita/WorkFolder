import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  upsert:  vi.fn(),
  rpc:     vi.fn(),
  getUser: vi.fn(),
  send:    vi.fn(),
}));

vi.mock('@/services/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({ upsert: mocks.upsert })),
    rpc:  mocks.rpc,
    auth: { getUser: mocks.getUser },
  },
}));
vi.mock('@vercel/queue', () => ({
  send: mocks.send,
  handleCallback: (fn: unknown) => fn,
}));

import { validarEvento, aFila, claveDedupe } from '@/lib/eventos';
import { modoCola, publicarEvento, RETENCION_SEGUNDOS } from '@/lib/cola';
import { procesarMensaje, politicaReintento, MAX_ENTREGAS } from '@/lib/consumidor';
import { POST as ingestar } from '@/app/api/eventos/route';
import { GET as metricas } from '@/app/api/metricas/route';

const actividad = (extra: Record<string, unknown> = {}) => ({
  evento_id:   'ev-1',
  topico:      'workfolder-actividad',
  tipo:        'Subida',
  origen:      'documentos',
  ocurrido_en: '2026-11-17T12:00:00.000Z',
  clave:       'u1',
  datos:       { categoria: 'subida', user_id: 'u1', documento_id: 'd1', email: 'no@debe.guardarse' },
  ...extra,
});

const pago = (extra: Record<string, unknown> = {}) => ({
  evento_id:   'ev-2',
  topico:      'workfolder-pagos',
  tipo:        'pago.aprobado',
  origen:      'facturacion',
  ocurrido_en: '2026-11-17T12:00:00.000Z',
  clave:       'pay-9',
  datos:       { admin_id: 'adm', payment_id: 'pay-9', monto: 9990, moneda: 'CLP' },
  ...extra,
});

const meta = (deliveryCount = 1) => ({
  messageId: 'msg-1', deliveryCount, createdAt: new Date(), expiresAt: new Date(),
  topicName: 'workfolder-actividad', consumerGroup: 'g', region: 'iad1',
});

const ingesta = (body: unknown, secret: string | null = 'ingest-test-secret') =>
  new NextRequest('http://localhost:3005/api/eventos', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-ingest-secret': secret } : {}) },
    body:    typeof body === 'string' ? body : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.send.mockResolvedValue({ messageId: 'msg-123' });
  vi.stubEnv('REPORTES_COLA', 'vercel');
});
afterEach(() => vi.unstubAllEnvs());

describe('eventos — validación y filas', () => {
  it('acepta un evento válido y normaliza la fecha', () => {
    expect(validarEvento(actividad({ ocurrido_en: '2026-11-17T09:00:00-03:00' }))?.ocurrido_en).toBe('2026-11-17T12:00:00.000Z');
  });

  it.each([
    ['sin evento_id', { evento_id: '' }],
    ['tópico desconocido', { topico: 'otro' }],
    ['fecha inválida', { ocurrido_en: 'ayer' }],
    ['datos no es objeto', { datos: [1] }],
  ])('rechaza %s', (_n, extra) => {
    expect(validarEvento(actividad(extra))).toBeNull();
  });

  it('la fila de actividad no guarda datos personales', () => {
    const fila = aFila(validarEvento(actividad())!);
    expect(fila).toEqual({
      dedupe_key: 'ev-1', topico: 'workfolder-actividad', tipo: 'Subida', categoria: 'subida',
      origen: 'documentos', user_id: 'u1', monto: null, moneda: null, plan_id: null,
      ocurrido_en: '2026-11-17T12:00:00.000Z',
    });
    expect(JSON.stringify(fila)).not.toContain('no@debe');
  });

  it('en pagos deduplica por tipo + id de Mercado Pago', () => {
    const e = validarEvento(pago())!;
    expect(claveDedupe(e)).toBe('pago.aprobado:pay-9');
    expect(aFila(e)).toMatchObject({ user_id: 'adm', monto: 9990, moneda: 'CLP', categoria: null });
  });
});

describe('cola — publicación', () => {
  it('elige modo directo sin credenciales de Vercel y vercel en Vercel', () => {
    vi.stubEnv('REPORTES_COLA', '');
    vi.stubEnv('VERCEL', '');
    vi.stubEnv('VERCEL_OIDC_TOKEN', '');
    expect(modoCola()).toBe('directo');
    vi.stubEnv('VERCEL', '1');
    expect(modoCola()).toBe('vercel');
  });

  it('publica en el tópico del evento con idempotencia y retención de 7 días', async () => {
    const e = validarEvento(pago())!;
    await expect(publicarEvento(e)).resolves.toEqual({ modo: 'vercel', messageId: 'msg-123' });
    expect(mocks.send).toHaveBeenCalledWith('workfolder-pagos', e, {
      idempotencyKey: 'pago.aprobado:pay-9', retentionSeconds: RETENCION_SEGUNDOS,
    });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('en modo directo guarda sin pasar por la cola', async () => {
    vi.stubEnv('REPORTES_COLA', 'directo');
    await publicarEvento(validarEvento(actividad())!);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ dedupe_key: 'ev-1' }), { onConflict: 'dedupe_key', ignoreDuplicates: true });
  });
});

describe('consumidor — Vercel Queues push', () => {
  it('guarda el evento (ack al terminar)', async () => {
    await procesarMensaje(actividad(), meta());
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it('descarta (ack) un mensaje inválido sin reintentar', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(procesarMensaje({ basura: true }, meta())).resolves.toBeUndefined();
    expect(mocks.upsert).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('lanza si Supabase falla, para que la cola reintente', async () => {
    mocks.upsert.mockResolvedValue({ error: { message: 'db down' } });
    await expect(procesarMensaje(actividad(), meta())).rejects.toThrow('db down');
  });

  it('reintenta con backoff y descarta tras el máximo de entregas', () => {
    expect(politicaReintento(new Error('x'), meta(1))).toEqual({ afterSeconds: 10 });
    expect(politicaReintento(new Error('x'), meta(8))).toEqual({ afterSeconds: 300 });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(politicaReintento(new Error('x'), meta(MAX_ENTREGAS))).toEqual({ acknowledge: true });
    error.mockRestore();
  });
});

describe('POST /api/eventos', () => {
  it('401 sin el secreto o con uno incorrecto', async () => {
    expect((await ingestar(ingesta(actividad(), null))).status).toBe(401);
    expect((await ingestar(ingesta(actividad(), 'otro'))).status).toBe(401);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('400 con JSON o evento inválido', async () => {
    expect((await ingestar(ingesta('{no json'))).status).toBe(400);
    expect((await ingestar(ingesta({ tipo: 'x' }))).status).toBe(400);
  });

  it('202 al publicar en la cola', async () => {
    const res = await ingestar(ingesta(actividad()));
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ success: true, modo: 'vercel', messageId: 'msg-123' });
    expect(mocks.send).toHaveBeenCalledWith('workfolder-actividad', expect.objectContaining({ evento_id: 'ev-1' }), expect.any(Object));
  });

  it('503 si la cola no acepta el mensaje', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.send.mockRejectedValue(new Error('UnauthorizedError'));
    expect((await ingestar(ingesta(actividad()))).status).toBe(503);
    error.mockRestore();
  });
});

describe('GET /api/metricas', () => {
  const conToken = (url = 'http://localhost:3005/api/metricas') =>
    new NextRequest(url, { headers: { Authorization: 'Bearer tok' } });
  const usuario = (app_metadata: Record<string, unknown>) =>
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.cl', app_metadata } }, error: null });

  it('401 sin token', async () => {
    expect((await metricas(new NextRequest('http://localhost:3005/api/metricas'))).status).toBe(401);
  });

  it('403 sin rol admin ni permiso view_audit', async () => {
    usuario({ role: 'user' });
    expect((await metricas(conToken())).status).toBe(403);
  });

  it('devuelve la foto de metricas_snapshot con la ventana acotada', async () => {
    usuario({ permissions: { view_audit: true } });
    mocks.rpc.mockResolvedValue({ data: { total_eventos: 3 }, error: null });
    const res = await metricas(conToken('http://localhost:3005/api/metricas?ventana=999'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { total_eventos: 3 } });
    expect(mocks.rpc).toHaveBeenCalledWith('metricas_snapshot', { p_ventana_minutos: 120 });
  });

  it('500 si falla la consulta', async () => {
    usuario({ role: 'admin' });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect((await metricas(conToken())).status).toBe(500);
    error.mockRestore();
  });
});
