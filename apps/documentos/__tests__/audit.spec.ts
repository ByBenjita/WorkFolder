import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { logEvent, getClientIp, AUDIT_QUEUE } from '../lib/audit';

/** Cliente Supabase falso cuyo schema().rpc es el mock dado */
function clientWith(rpc: ReturnType<typeof vi.fn>) {
  return { schema: vi.fn(() => ({ rpc })) } as any;
}

describe('lib/audit — logEvent', () => {
  it('encola el evento en pgmq_public.send con timestamp', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [1], error: null });
    const client = clientWith(rpc);

    await logEvent(client, { evento: 'Subida', accion: 'Subió a.pdf', user_id: 'u1', documento_id: 'd1' });

    expect(client.schema).toHaveBeenCalledWith('pgmq_public');
    expect(rpc).toHaveBeenCalledWith('send', expect.objectContaining({
      queue_name:    AUDIT_QUEUE,
      sleep_seconds: 0,
      message:       expect.objectContaining({
        evento:      'Subida',
        user_id:     'u1',
        documento_id: 'd1',
        ocurrido_en: expect.any(String),
      }),
    }));
  });

  it('no lanza si la cola devuelve error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'queue down' } });

    await expect(logEvent(clientWith(rpc), { evento: 'Acceso', accion: 'x', user_id: 'u1' })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('no lanza si el cliente explota', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = { schema: vi.fn(() => { throw new Error('boom'); }) } as any;

    await expect(logEvent(client, { evento: 'Acceso', accion: 'x', user_id: 'u1' })).resolves.toBeUndefined();
    warn.mockRestore();
  });
});

describe('lib/audit — getClientIp', () => {
  it('toma la primera IP de x-forwarded-for', () => {
    const req = new NextRequest('http://localhost/api', { headers: { 'x-forwarded-for': '200.1.1.1, 10.0.0.1' } });
    expect(getClientIp(req)).toBe('200.1.1.1');
  });

  it('usa x-real-ip como respaldo', () => {
    const req = new NextRequest('http://localhost/api', { headers: { 'x-real-ip': '10.0.0.9' } });
    expect(getClientIp(req)).toBe('10.0.0.9');
  });

  it('devuelve null si no hay headers de IP', () => {
    expect(getClientIp(new NextRequest('http://localhost/api'))).toBeNull();
  });
});