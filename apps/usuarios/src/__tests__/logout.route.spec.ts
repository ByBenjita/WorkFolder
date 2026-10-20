import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => {
  const rpc = vi.fn();
  return { rpc, schema: vi.fn(() => ({ rpc })), auth: { signOut: vi.fn(), getUser: vi.fn() } };
});

/** Último mensaje enviado a la cola de auditoría (pgmq_public.send) */
const eventoEncolado = () => mockClient.rpc.mock.calls.filter(([fn]) => fn === 'send').at(-1)?.[1].message;


vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST } from '@/app/api/auth/logout/route';

function makeRequest() {
  return new NextRequest('http://localhost/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: 'Bearer tok-x' },
  });
}

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    mockClient.auth.signOut.mockReset();
    mockClient.rpc.mockReset().mockResolvedValue({ error: null });
    mockClient.auth.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  });

  it('cierra sesión correctamente', async () => {
    mockClient.auth.signOut.mockResolvedValueOnce({ error: null });

    const res = await POST(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(eventoEncolado()).toMatchObject({ evento: 'Acceso', accion: 'Cerró sesión', user_id: 'u1' });
  });

  it('devuelve error si Supabase falla al cerrar sesión', async () => {
    mockClient.auth.signOut.mockResolvedValueOnce({ error: { message: 'fallo de red' } });

    const res = await POST(makeRequest());
    const json = await res.json();

    expect(json.success).toBe(false);
  });

  it('devuelve 500 ante un error inesperado', async () => {
    mockClient.auth.signOut.mockRejectedValueOnce(new Error('boom'));

    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
