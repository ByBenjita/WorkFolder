import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const result = { data: [] as unknown[], error: null as unknown };
  const builder: any = {};
  for (const m of ['select', 'order', 'limit', 'eq', 'lt']) builder[m] = vi.fn(() => builder);
  builder.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve);
  return {
    result,
    builder,
    client: {
      from: vi.fn(() => builder),
      auth: { getUser: vi.fn() },
    },
    drenarCola: vi.fn(),
  };
});

vi.mock('@/services/supabase', () => ({ supabaseAdmin: mocks.client }));
vi.mock('@/lib/consumer', async (orig) => ({
  ...(await orig<typeof import('@/lib/consumer')>()),
  drenarCola: mocks.drenarCola,
}));

import { GET } from '@/app/api/logs/route';
import { POST } from '@/app/api/procesar/route';

/** Request con Bearer token */
const conToken = (url: string) =>
  new NextRequest(url, { headers: { Authorization: 'Bearer tok' } });

/** Simula el usuario autenticado con los app_metadata dados (rol / permisos) */
function usuario(app_metadata: Record<string, unknown>) {
  mocks.client.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.cl', app_metadata } }, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.result.data = [];
  mocks.result.error = null;
});

describe('GET /api/logs', () => {
  it('401 sin token', async () => {
    const res = await GET(new NextRequest('http://localhost:3004/api/logs'));
    expect(res.status).toBe(401);
  });

  it('401 con token inválido', async () => {
    mocks.client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad jwt' } });
    const res = await GET(conToken('http://localhost:3004/api/logs'));
    expect(res.status).toBe(401);
  });

  it('403 si no es admin ni tiene view_audit', async () => {
    usuario({ role: 'user', permissions: { view_audit: false } });
    const res = await GET(conToken('http://localhost:3004/api/logs'));
    expect(res.status).toBe(403);
  });

  it('permite a un usuario con permiso view_audit', async () => {
    usuario({ role: 'user', permissions: { view_audit: true } });
    const res = await GET(conToken('http://localhost:3004/api/logs'));
    expect(res.status).toBe(200);
  });

  it('devuelve los logs del admin con filtros y cursor', async () => {
    usuario({ role: 'admin' });
    mocks.result.data = [
      { id: 2, evento: 'Seguridad', ocurrido_en: '2026-09-26T13:00:00Z' },
      { id: 1, evento: 'Seguridad', ocurrido_en: '2026-09-26T12:00:00Z' },
    ];

    const res = await GET(conToken('http://localhost:3004/api/logs?limit=2&evento=Seguridad&antesDe=2026-09-27T00:00:00Z'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mocks.client.from).toHaveBeenCalledWith('audit_log');
    expect(mocks.builder.limit).toHaveBeenCalledWith(2);
    expect(mocks.builder.eq).toHaveBeenCalledWith('evento', 'Seguridad');
    expect(mocks.builder.lt).toHaveBeenCalledWith('ocurrido_en', '2026-09-27T00:00:00Z');
    expect(json.data).toHaveLength(2);
    expect(json.siguiente).toBe('2026-09-26T12:00:00Z');
  });

  it('acota el limit a 200', async () => {
    usuario({ role: 'admin' });
    await GET(conToken('http://localhost:3004/api/logs?limit=9999'));
    expect(mocks.builder.limit).toHaveBeenCalledWith(200);
  });

  it('400 con evento inválido', async () => {
    usuario({ role: 'admin' });
    const res = await GET(conToken('http://localhost:3004/api/logs?evento=Otro'));
    expect(res.status).toBe(400);
  });

  it('500 si falla la consulta', async () => {
    usuario({ role: 'admin' });
    mocks.result.error = { message: 'db down' };
    const res = await GET(conToken('http://localhost:3004/api/logs'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/procesar', () => {
  it('401 sin el secreto del worker', async () => {
    const res = await POST(new NextRequest('http://localhost:3004/api/procesar', { method: 'POST' }));
    expect(res.status).toBe(401);
    expect(mocks.drenarCola).not.toHaveBeenCalled();
  });

  it('procesa la cola con el secreto correcto', async () => {
    mocks.drenarCola.mockResolvedValue({ leidos: 3, registrados: 3, descartados: 0, fallidos: 0 });
    const res = await POST(new NextRequest('http://localhost:3004/api/procesar', {
      method: 'POST',
      headers: { 'x-worker-secret': 'worker-test-secret' },
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.resultado.registrados).toBe(3);
  });
});