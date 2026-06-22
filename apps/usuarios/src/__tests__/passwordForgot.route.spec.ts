import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockClient = vi.hoisted(() => ({
  auth: { resetPasswordForEmail: vi.fn() },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST } from '@/app/api/auth/password/forgot/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/password/forgot', () => {
  beforeEach(() => {
    mockClient.auth.resetPasswordForEmail.mockReset();
  });

  it('rechaza con 400 si falta el email', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('responde éxito genérico aunque el email no exista (no filtra info)', async () => {
    mockClient.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });

    const res = await POST(makeRequest({ email: 'inexistente@workfolder.com' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toMatch(/si el email existe/i);
  });

  it('devuelve error si Supabase falla al enviar el correo', async () => {
    mockClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
      error: { message: 'rate limit' },
    });

    const res = await POST(makeRequest({ email: 'a@a.com' }));
    const json = await res.json();

    expect(json.success).toBe(false);
  });

  it('devuelve 500 ante un error inesperado', async () => {
    mockClient.auth.resetPasswordForEmail.mockRejectedValueOnce(new Error('boom'));

    const res = await POST(makeRequest({ email: 'a@a.com' }));
    expect(res.status).toBe(500);
  });
});
