import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { buildSupabaseClientMock } from './helpers/supabaseMock';

const supabaseClientMock = buildSupabaseClientMock();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabaseClientMock),
}));

import { POST } from '@/app/api/mfa/enroll/route';

function makeRequest() {
  return new NextRequest('http://localhost/api/mfa/enroll', {
    method: 'POST',
    headers: { Authorization: 'Bearer tok-x' },
  });
}

describe('POST /api/mfa/enroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('elimina un factor TOTP pendiente antes de generar uno nuevo', async () => {
    supabaseClientMock.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [{ id: 'pending-1', factor_type: 'totp', status: 'unverified' }] },
      error: null,
    });

    await POST(makeRequest());

    expect(supabaseClientMock.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'pending-1' });
    expect(supabaseClientMock.auth.mfa.enroll).toHaveBeenCalled();
  });

  it('no intenta desenrolar si no hay factores pendientes', async () => {
    supabaseClientMock.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [] },
      error: null,
    });

    await POST(makeRequest());

    expect(supabaseClientMock.auth.mfa.unenroll).not.toHaveBeenCalled();
  });

  it('devuelve el QR y factor_id cuando el enroll es exitoso', async () => {
    supabaseClientMock.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [] },
      error: null,
    });
    supabaseClientMock.auth.mfa.enroll.mockResolvedValueOnce({
      data: { id: 'factor-999', totp: { qr_code: 'data:image/png;base64,ABC' } },
      error: null,
    });

    const res = await POST(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.factor_id).toBe('factor-999');
    expect(json.qr_code).toContain('data:image/png');
  });

  it('devuelve error de negocio (400) si Supabase falla al generar el QR', async () => {
    supabaseClientMock.auth.mfa.listFactors.mockResolvedValueOnce({
      data: { all: [] },
      error: null,
    });
    supabaseClientMock.auth.mfa.enroll.mockResolvedValueOnce({
      data: null,
      error: { message: 'No se pudo generar el factor' },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });
});
