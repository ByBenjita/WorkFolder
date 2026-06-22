import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { queryResult } from './helpers/mocks';

const mockClient = vi.hoisted(() => ({
  auth: { getUser: vi.fn(), admin: { getUserById: vi.fn() } },
  from: vi.fn(),
  storage: { from: vi.fn() },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { GET, POST, DELETE } from '../app/api/rrhh/route';

function authHeaders(token = 'tok-x') {
  return { Authorization: `Bearer ${token}` };
}

beforeEach(() => {
  mockClient.auth.getUser.mockReset();
  mockClient.auth.admin.getUserById.mockReset();
  mockClient.from.mockReset();
  mockClient.storage.from.mockReset();
});

describe('GET /api/rrhh (descarga binaria)', () => {
  it('devuelve 401 sin token', async () => {
    const req = new NextRequest('http://localhost:3002/api/rrhh?download=d1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('rechaza con 400 si falta el parámetro download', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    const req = new NextRequest('http://localhost:3002/api/rrhh', { headers: authHeaders() });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('devuelve 404 si el documento no existe', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: {} } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: null }));

    const req = new NextRequest('http://localhost:3002/api/rrhh?download=no-existe', { headers: authHeaders() });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('devuelve 403 si un usuario intenta descargar un documento que no es suyo', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'standard' } } } });
    mockClient.from.mockReturnValueOnce(
      queryResult({ data: { id: 'd1', storage_path: 'x', nombre_original: 'liquidacion.pdf', asignado_a: 'otro-usuario' }, error: null })
    );

    const req = new NextRequest('http://localhost:3002/api/rrhh?download=d1', { headers: authHeaders() });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('un administrador puede descargar documentos aunque no estén asignados a él', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'admin' } } } });
    mockClient.from.mockReturnValueOnce(
      queryResult({ data: { id: 'd1', storage_path: 'u2/file.pdf', nombre_original: 'contrato.pdf', asignado_a: 'u2' }, error: null })
    );
    mockClient.storage.from.mockReturnValueOnce({
      download: vi.fn().mockResolvedValue({ data: { arrayBuffer: async () => Buffer.from('contrato') }, error: null }),
    });

    const req = new NextRequest('http://localhost:3002/api/rrhh?download=d1', { headers: authHeaders() });
    const res = await GET(req);
    const buf = Buffer.from(await res.arrayBuffer());

    expect(res.status).toBe(200);
    expect(buf.toString()).toBe('contrato');
  });

  it('un usuario RRHH puede descargar su propio documento asignado', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'standard' } } } });
    mockClient.from.mockReturnValueOnce(
      queryResult({ data: { id: 'd1', storage_path: 'u2/file.pdf', nombre_original: 'liquidacion.pdf', asignado_a: 'u2' }, error: null })
    );
    mockClient.storage.from.mockReturnValueOnce({
      download: vi.fn().mockResolvedValue({ data: { arrayBuffer: async () => Buffer.from('liquidacion') }, error: null }),
    });

    const req = new NextRequest('http://localhost:3002/api/rrhh?download=d1', { headers: authHeaders() });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/rrhh (subir y asignar documento — solo admins)', () => {
  function formReq(fields: Record<string, string | Blob>, headers: Record<string, string> = {}) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v as any);
    return new NextRequest('http://localhost:3002/api/rrhh', { method: 'POST', body: form, headers });
  }

  it('devuelve 401 sin token', async () => {
    const res = await POST(formReq({ asignadoA: 'u2' }));
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si quien sube no es administrador', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'standard' } } } });

    const res = await POST(formReq({ asignadoA: 'u2' }, authHeaders()));
    expect(res.status).toBe(403);
  });

  it('rechaza con 400 si faltan campos requeridos', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'admin' } } } });

    const res = await POST(formReq({ asignadoA: 'u2' }, authHeaders()));
    expect(res.status).toBe(400);
  });

  it('sube y asigna el documento correctamente', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'admin' } } } });

    const bucket = { upload: vi.fn().mockResolvedValue({ error: null }), remove: vi.fn() };
    mockClient.storage.from.mockReturnValueOnce(bucket);
    mockClient.from.mockReturnValueOnce(queryResult({ data: { id: 'rrhh-doc-1' }, error: null }));

    const file = new File(['contrato firmado'], 'contrato.pdf', { type: 'application/pdf' });
    const res = await POST(formReq(
      { file, asignadoA: 'u2', asignadoAEmail: 'colaborador@workfolder.com', tipo: 'contrato' },
      authHeaders()
    ));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(bucket.upload).toHaveBeenCalledOnce();
  });

  it('revierte el archivo subido si falla la inserción en BD', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'admin' } } } });

    const bucket = { upload: vi.fn().mockResolvedValue({ error: null }), remove: vi.fn().mockResolvedValue({ error: null }) };
    mockClient.storage.from.mockReturnValue(bucket);
    mockClient.from.mockReturnValueOnce(queryResult({ data: null, error: { message: 'constraint violada' } }));

    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const res = await POST(formReq(
      { file, asignadoA: 'u2', asignadoAEmail: 'colaborador@workfolder.com', tipo: 'contrato' },
      authHeaders()
    ));

    expect(res.status).toBe(500);
    expect(bucket.remove).toHaveBeenCalledOnce();
  });
});

describe('DELETE /api/rrhh (solo admins)', () => {
  it('devuelve 401 sin token', async () => {
    const req = new NextRequest('http://localhost:3002/api/rrhh?id=d1', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si quien elimina no es administrador', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u2' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'standard' } } } });

    const req = new NextRequest('http://localhost:3002/api/rrhh?id=d1', { method: 'DELETE', headers: authHeaders() });
    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });

  it('devuelve 400 si falta el id', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'admin' } } } });

    const req = new NextRequest('http://localhost:3002/api/rrhh', { method: 'DELETE', headers: authHeaders() });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('elimina correctamente el documento y su archivo en Storage', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'admin' } } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { storage_path: 'u2/file.pdf' }, error: null }));
    const bucket = { remove: vi.fn().mockResolvedValue({ error: null }) };
    mockClient.storage.from.mockReturnValueOnce(bucket);
    mockClient.from.mockReturnValueOnce(queryResult({ data: {}, error: null }));

    const req = new NextRequest('http://localhost:3002/api/rrhh?id=d1', { method: 'DELETE', headers: authHeaders() });
    const res = await DELETE(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(bucket.remove).toHaveBeenCalledWith(['u2/file.pdf']);
  });
});
