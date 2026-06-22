import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { buildQueryBuilderMock } from './helpers/queryBuilderMock';

const mockClient = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
    admin: { getUserById: vi.fn() },
  },
  from: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { GET, PATCH } from '@/app/api/rrhh/route';

function makeGetRequest(token?: string) {
  return new NextRequest('http://localhost/api/rrhh', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function makePatchRequest(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/rrhh', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

describe('GET /api/rrhh', () => {
  beforeEach(() => {
    mockClient.auth.getUser.mockReset();
    mockClient.auth.admin.getUserById.mockReset();
    mockClient.from.mockReset();
  });

  it('devuelve 401 sin token', async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('un usuario RRHH estándar solo ve sus propios documentos (filtra por asignado_a)', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { app_metadata: { role: 'standard' } } },
    });

    const builder = buildQueryBuilderMock({ data: [{ id: 'doc1' }], error: null });
    mockClient.from.mockReturnValueOnce(builder);

    const res = await GET(makeGetRequest('tok-user'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isAdmin).toBe(false);
    expect(builder.eq).toHaveBeenCalledWith('asignado_a', 'u2');
  });

  it('un administrador ve todos los documentos (sin filtro adicional)', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { app_metadata: { role: 'admin' } } },
    });

    const builder = buildQueryBuilderMock({ data: [{ id: 'doc1' }, { id: 'doc2' }], error: null });
    mockClient.from.mockReturnValueOnce(builder);

    const res = await GET(makeGetRequest('tok-admin'));
    const json = await res.json();

    expect(json.isAdmin).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(builder.eq).not.toHaveBeenCalled();
  });

  it('devuelve 500 si la consulta a Supabase falla', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { app_metadata: {} } },
    });

    const builder = buildQueryBuilderMock({ data: null, error: { message: 'db down' } });
    mockClient.from.mockReturnValueOnce(builder);

    const res = await GET(makeGetRequest('tok-user'));
    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/rrhh (firmar documento)', () => {
  beforeEach(() => {
    mockClient.auth.getUser.mockReset();
    mockClient.auth.admin.getUserById.mockReset();
    mockClient.from.mockReset();
  });

  it('devuelve 401 sin token', async () => {
    const res = await PATCH(makePatchRequest({ id: 'doc1' }));
    expect(res.status).toBe(401);
  });

  it('rechaza con 400 si falta el id del documento', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });

    const res = await PATCH(makePatchRequest({}, 'tok-user'));
    expect(res.status).toBe(400);
  });

  it('devuelve 404 si el documento no existe', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.from.mockReturnValueOnce(buildQueryBuilderMock({ data: null, error: null }));

    const res = await PATCH(makePatchRequest({ id: 'no-existe' }, 'tok-user'));
    expect(res.status).toBe(404);
  });

  it('devuelve 403 si un usuario intenta firmar un documento que no es suyo', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.from.mockReturnValueOnce(
      buildQueryBuilderMock({ data: { id: 'doc1', asignado_a: 'otro-usuario', estado: 'pendiente' }, error: null })
    );
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { app_metadata: { role: 'standard' } } },
    });

    const res = await PATCH(makePatchRequest({ id: 'doc1' }, 'tok-user'));
    expect(res.status).toBe(403);
  });

  it('rechaza con 409 si el documento ya fue firmado', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.from.mockReturnValueOnce(
      buildQueryBuilderMock({ data: { id: 'doc1', asignado_a: 'u2', estado: 'firmado' }, error: null })
    );
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { app_metadata: { role: 'standard' } } },
    });

    const res = await PATCH(makePatchRequest({ id: 'doc1' }, 'tok-user'));
    expect(res.status).toBe(409);
  });

  it('firma correctamente un documento propio pendiente', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2', email: 'colaborador@workfolder.com' } } });
    mockClient.from.mockReturnValueOnce(
      buildQueryBuilderMock({ data: { id: 'doc1', asignado_a: 'u2', estado: 'pendiente' }, error: null })
    );
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { app_metadata: { role: 'standard' } } },
    });
    // Promise.all([insert(...), update(...).eq(...)])
    mockClient.from
      .mockReturnValueOnce(buildQueryBuilderMock({ data: {}, error: null })) // rrhh_firmas.insert
      .mockReturnValueOnce(buildQueryBuilderMock({ data: {}, error: null })); // rrhh_documentos.update

    const res = await PATCH(makePatchRequest({ id: 'doc1' }, 'tok-user'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('un Administrador puede firmar un documento aunque no esté asignado a él', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1', email: 'admin@workfolder.com' } } });
    mockClient.from.mockReturnValueOnce(
      buildQueryBuilderMock({ data: { id: 'doc1', asignado_a: 'u2', estado: 'pendiente' }, error: null })
    );
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { app_metadata: { role: 'admin' } } },
    });
    mockClient.from
      .mockReturnValueOnce(buildQueryBuilderMock({ data: {}, error: null }))
      .mockReturnValueOnce(buildQueryBuilderMock({ data: {}, error: null }));

    const res = await PATCH(makePatchRequest({ id: 'doc1' }, 'tok-admin'));
    expect(res.status).toBe(200);
  });
});
