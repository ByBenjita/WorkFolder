import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => {
  const rpc = vi.fn();
  return {
    rpc,
    schema: vi.fn(() => ({ rpc })),
    auth: {
      getUser: vi.fn(),
      admin: { deleteUser: vi.fn(), getUserById: vi.fn() },
    },
  };
});

/** Último mensaje enviado a la cola de auditoría (pgmq_public.send) */
const eventoEncolado = () => mockClient.rpc.mock.calls.filter(([fn]) => fn === 'send').at(-1)?.[1].message;


vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST } from '@/app/api/admin/delete/route';

function makeRequest(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/admin/delete', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

describe('POST /api/admin/delete', () => {
  beforeEach(() => {
    mockClient.auth.getUser.mockReset();
    mockClient.auth.admin.deleteUser.mockReset();
    mockClient.rpc.mockReset().mockResolvedValue({ error: null });
    mockClient.auth.admin.getUserById.mockReset().mockResolvedValue({ data: { user: { email: 'colaborador@empresa.cl' } }, error: null });
  });

  it('devuelve 401 sin token', async () => {
    const res = await POST(makeRequest({ userId: 'u2' }));
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si quien solicita no es admin', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', app_metadata: { role: 'standard' } } },
      error: null,
    });

    const res = await POST(makeRequest({ userId: 'u2' }, 'tok-user'));
    expect(res.status).toBe(403);
  });

  it('rechaza con 400 si el admin intenta eliminarse a sí mismo', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });

    const res = await POST(makeRequest({ userId: 'admin-1' }, 'tok-admin'));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/eliminarte a ti mismo/i);
  });

  it('elimina correctamente a un usuario distinto del solicitante', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mockClient.auth.admin.deleteUser.mockResolvedValueOnce({ error: null });

    const res = await POST(makeRequest({ userId: 'u2' }, 'tok-admin'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockClient.auth.admin.deleteUser).toHaveBeenCalledWith('u2');
    expect(eventoEncolado()).toMatchObject({
      evento:   'Eliminación',
      accion:   'Eliminó el usuario colaborador@empresa.cl',
      user_id:  'admin-1',
      metadata: { usuario_afectado: 'u2' },
    });
  });

  it('devuelve 500 si Supabase falla al eliminar', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
      error: null,
    });
    mockClient.auth.admin.deleteUser.mockResolvedValueOnce({
      error: { message: 'db down' },
    });

    const res = await POST(makeRequest({ userId: 'u2' }, 'tok-admin'));
    expect(res.status).toBe(500);
  });
});
