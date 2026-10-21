import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { buildSupabaseClientMock } from './helpers/supabaseMock';

const mocks = vi.hoisted(() => ({ client: null as any }));

vi.mock('@/services/supabaseAdmin', () => ({
  getSupabaseAdmin: () => mocks.client,
}));

import { manejarEvento } from '@/lib/eventos';
import { POST } from '@/app/api/eventos/procesar/route';

const autorizada = (plan_id = 'business') => ({
  evento_id: 'ev-1',
  topic: 'suscripcion.autorizada',
  payload: { admin_id: 'admin-1', plan_id, preapproval_id: 'pre-1', origen: 'webhook' },
  publicado_en: '2026-10-21T12:00:00.000Z',
});

beforeEach(() => {
  const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
  mocks.client = { ...buildSupabaseClientMock(), rpc, schema: vi.fn(() => ({ rpc })) };
});

describe('usuarios — suscriptor suscripcion.autorizada', () => {
  it('guarda el plan en app_metadata conservando lo existente', async () => {
    mocks.client.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin', plan: 'startup' } } }, error: null,
    });

    await manejarEvento(autorizada());

    expect(mocks.client.auth.admin.updateUserById).toHaveBeenCalledWith('admin-1', {
      app_metadata: { role: 'admin', plan: 'business' },
    });
  });

  it('es idempotente: no actualiza si el plan ya está aplicado', async () => {
    mocks.client.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin', plan: 'business' } } }, error: null,
    });

    await manejarEvento(autorizada());
    expect(mocks.client.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it('confirma sin hacer nada si el admin ya no existe', async () => {
    await expect(manejarEvento(autorizada())).resolves.toBeUndefined();
    expect(mocks.client.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it('lanza si Auth falla (sin ack → reintento)', async () => {
    mocks.client.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: {} } }, error: null,
    });
    mocks.client.auth.admin.updateUserById.mockResolvedValueOnce({ data: null, error: { message: 'auth caído' } });

    await expect(manejarEvento(autorizada())).rejects.toThrow('auth caído');
  });

  it('ignora temas que no le interesan', async () => {
    await manejarEvento({ ...autorizada(), topic: 'pago.aprobado' });
    expect(mocks.client.auth.admin.getUserById).not.toHaveBeenCalled();
  });
});

describe('POST /api/eventos/procesar', () => {
  afterEach(() => { delete process.env.EVENTS_WORKER_SECRET; });

  const req = (secret?: string) => new NextRequest('http://localhost:3001/api/eventos/procesar', {
    method: 'POST', headers: secret ? { 'x-worker-secret': secret } : {},
  });

  it('rechaza sin el secreto del worker', async () => {
    expect((await POST(req())).status).toBe(401);
  });

  it('drena la cola de usuarios con el secreto correcto', async () => {
    process.env.EVENTS_WORKER_SECRET = 's3creto';
    const res = await POST(req('s3creto'));
    expect(res.status).toBe(200);
    expect(mocks.client.rpc).toHaveBeenCalledWith('read', expect.objectContaining({ queue_name: 'usuarios_eventos' }));
  });
});
