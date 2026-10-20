import { describe, it, expect, vi, afterEach } from 'vitest';
import { logEvent, getClientIp, AUDIT_QUEUE } from '../audit';

/** Cliente Supabase falso cuyo schema().rpc es el mock dado */
function clientWith(rpc: ReturnType<typeof vi.fn>) {
  return { schema: vi.fn(() => ({ rpc })) } as any;
}

/** Request mínimo con los headers dados */
const req = (headers: Record<string, string> = {}) => ({ headers: new Headers(headers) });

describe('audit — logEvent', () => {
  it('encola el evento en pgmq_public.send con IP y timestamp', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [1], error: null });
    const client = clientWith(rpc);

    await logEvent(client, req({ 'x-forwarded-for': '200.1.1.1' }), {
      evento: 'Subida', accion: 'Subió a.pdf', user_id: 'u1', documento_id: 'd1',
    });

    expect(client.schema).toHaveBeenCalledWith('pgmq_public');
    expect(rpc).toHaveBeenCalledWith('send', expect.objectContaining({
      queue_name:    AUDIT_QUEUE,
      sleep_seconds: 0,
      message:       expect.objectContaining({
        evento:       'Subida',
        user_id:      'u1',
        documento_id: 'd1',
        ip:           '200.1.1.1',
        ocurrido_en:  expect.any(String),
      }),
    }));
  });

  it('no lanza si la cola devuelve error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'queue down' } });

    await expect(logEvent(clientWith(rpc), req(), { evento: 'Acceso', accion: 'x', user_id: 'u1' })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('no lanza si el cliente explota', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = { schema: vi.fn(() => { throw new Error('boom'); }) } as any;

    await expect(logEvent(client, req(), { evento: 'Acceso', accion: 'x', user_id: 'u1' })).resolves.toBeUndefined();
    warn.mockRestore();
  });
});

describe('audit — getClientIp', () => {
  const BFF = { 'x-client-ip': '190.5.5.5', 'x-forwarded-for': '100.48.64.118' };

  afterEach(() => { delete process.env.INTERNAL_PROXY_SECRET; });

  it('usa x-client-ip cuando el BFF envía el secreto interno correcto', () => {
    process.env.INTERNAL_PROXY_SECRET = 'secreto-bff';
    expect(getClientIp(req({ ...BFF, 'x-internal-secret': 'secreto-bff' }))).toBe('190.5.5.5');
  });

  it('ignora x-client-ip si el secreto es incorrecto o no está configurado', () => {
    const falso = req({ ...BFF, 'x-internal-secret': 'adivinado' });
    expect(getClientIp(falso)).toBe('100.48.64.118');

    process.env.INTERNAL_PROXY_SECRET = 'secreto-bff';
    expect(getClientIp(falso)).toBe('100.48.64.118');
  });

  it('toma la primera IP de x-forwarded-for', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '200.1.1.1, 10.0.0.1' }))).toBe('200.1.1.1');
  });

  it('usa x-real-ip como respaldo', () => {
    expect(getClientIp(req({ 'x-real-ip': '10.0.0.9' }))).toBe('10.0.0.9');
  });

  it('devuelve null si no hay headers de IP', () => {
    expect(getClientIp(req())).toBeNull();
  });
});
