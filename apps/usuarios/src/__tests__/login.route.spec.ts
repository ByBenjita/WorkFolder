import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// IMPORTANTE: los imports estáticos de ES Modules se hoistean por encima de
// cualquier `const` normal. Como services/supabase.ts ejecuta `createClient()`
// en el nivel superior del módulo (al importarse), el mock necesita existir
// ANTES de que se resuelva ese import. `vi.hoisted` es el mecanismo de
// Vitest diseñado exactamente para este caso.
const mockClient = vi.hoisted(() => {
  const rpc = vi.fn();
  return {
    rpc,
    schema: vi.fn(() => ({ rpc })),
    auth: {
      signInWithPassword: vi.fn(),
      mfa: {
        listFactors: vi.fn(),
      },
    },
  };
});

/** Último mensaje enviado a la cola de auditoría (pgmq_public.send) */
const eventoEncolado = () => mockClient.rpc.mock.calls.filter(([fn]) => fn === 'send').at(-1)?.[1].message;


vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST } from '@/app/api/auth/login/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    mockClient.auth.signInWithPassword.mockReset();
    mockClient.auth.mfa.listFactors.mockReset();
    mockClient.rpc.mockReset().mockResolvedValue({ error: null });
  });

  it('rechaza la petición si falta email o password', async () => {
    const res = await POST(makeRequest({ email: 'a@a.com' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toMatch(/requeridos/i);
  });

  it('devuelve 401 si Supabase rechaza las credenciales', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });

    const res = await POST(makeRequest({ email: 'a@a.com', password: 'wrong' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toMatch(/credenciales incorrectas/i);
    // No expone el mensaje interno de Supabase al cliente
    expect(json.message).not.toMatch(/invalid login/i);
    // Se registra el intento fallido sin la contraseña
    expect(eventoEncolado()).toMatchObject({ evento: 'Seguridad', accion: 'Inicio de sesión fallido', metadata: { email: 'a@a.com' } });
    expect(JSON.stringify(mockClient.rpc.mock.calls)).not.toContain('wrong');
  });

  it('devuelve 500 si Supabase no entrega sesión', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const res = await POST(makeRequest({ email: 'a@a.com', password: 'ok' }));
    expect(res.status).toBe(500);
  });

  it('devuelve tokens y next_step="setup" cuando el usuario no tiene MFA configurado', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: 'tok-123', refresh_token: 'ref-123' } },
      error: null,
    });
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [] },
      error: null,
    });

    const res = await POST(makeRequest({ email: 'a@a.com', password: 'ok' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.access_token).toBe('tok-123');
    expect(json.mfa.configured).toBe(false);
    expect(json.mfa.next_step).toBe('setup');
    expect(eventoEncolado()).toMatchObject({ evento: 'Acceso', accion: 'Inició sesión' });
  });

  it('marca next_step="verify" cuando el usuario ya tiene un factor TOTP verificado', async () => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: 'tok-456', refresh_token: 'ref-456' } },
      error: null,
    });
    mockClient.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [{ factor_type: 'totp', status: 'verified' }] },
      error: null,
    });

    const res = await POST(makeRequest({ email: 'a@a.com', password: 'ok' }));
    const json = await res.json();

    expect(json.mfa.configured).toBe(true);
    expect(json.mfa.next_step).toBe('verify');
  });
});
