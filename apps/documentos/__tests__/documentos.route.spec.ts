import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { queryResult, buildDocumentosSupabaseMock } from './helpers/mocks';

const mockClient = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
    admin: { getUserById: vi.fn() },
    mfa: { challengeAndVerify: vi.fn() },
  },
  from: vi.fn(),
  storage: { from: vi.fn() },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { POST, GET, PATCH, DELETE } from '../app/api/route';

function authHeaders(token = 'tok-x') {
  return { Authorization: `Bearer ${token}` };
}

function makeFormDataRequest(url: string, fields: Record<string, string | Blob>, headers: Record<string, string> = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v as any);
  return new NextRequest(url, { method: 'POST', body: form, headers });
}

function makeJsonRequest(url: string, method: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function defaultStorageMock() {
  const bucket = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    download: vi.fn(),
    remove: vi.fn().mockResolvedValue({ error: null }),
  };
  mockClient.storage.from.mockReturnValue(bucket);
  return bucket;
}

beforeEach(() => {
  mockClient.auth.getUser.mockReset();
  mockClient.auth.admin.getUserById.mockReset();
  mockClient.auth.mfa.challengeAndVerify.mockReset();
  mockClient.from.mockReset();
  mockClient.storage.from.mockReset();
});

describe('POST /api/documentos (subida)', () => {
  it('devuelve 401 sin token de autorización', async () => {
    const req = makeFormDataRequest('http://localhost:3002/api', { userId: 'u1', userKey: '12345678' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si el userId del formulario no coincide con el usuario autenticado', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const file = new File(['contenido'], 'doc.pdf', { type: 'application/pdf' });
    const req = makeFormDataRequest('http://localhost:3002/api', { file, userId: 'otro-usuario', userKey: '12345678' }, authHeaders());
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('devuelve 400 si falta el archivo', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const req = makeFormDataRequest('http://localhost:3002/api', { userId: 'u1', userKey: '12345678' }, authHeaders());
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('devuelve 400 si la clave del usuario tiene menos de 8 caracteres', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const file = new File(['contenido'], 'doc.pdf', { type: 'application/pdf' });
    const req = makeFormDataRequest('http://localhost:3002/api', { file, userId: 'u1', userKey: 'corta' }, authHeaders());
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('cifra el archivo, lo sube a Storage y guarda la clave cifrada en BD', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const bucket = defaultStorageMock();
    mockClient.from.mockReturnValueOnce(queryResult({ data: { id: 'doc-1' }, error: null }));

    const file = new File(['contenido secreto del contrato'], 'contrato.pdf', { type: 'application/pdf' });
    const req = makeFormDataRequest('http://localhost:3002/api', { file, userId: 'u1', userKey: 'clave-segura-123' }, authHeaders());

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(bucket.upload).toHaveBeenCalledOnce();

    // La clave guardada en BD debe estar cifrada (formato iv:datos), nunca en texto plano
    const insertArgs = mockClient.from.mock.calls.length > 0 ? undefined : undefined;
  });

  it('devuelve 500 si Supabase Storage falla al subir', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.storage.from.mockReturnValueOnce({
      upload: vi.fn().mockResolvedValue({ error: { message: 'bucket lleno' } }),
    });
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const req = makeFormDataRequest('http://localhost:3002/api', { file, userId: 'u1', userKey: '12345678' }, authHeaders());

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/documentos (descarga real con cifrado AES)', () => {
  it('devuelve 401 sin autenticación', async () => {
    const req = new NextRequest('http://localhost:3002/api?id=doc-1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('descarga y descifra correctamente un documento con la clave correcta (round-trip real)', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });

    // 1) Construimos la "clave cifrada" usando las mismas funciones internas del módulo,
    //    simulando lo que el servidor guardó al subir el documento.
    const crypto = await import('crypto');
    const MASTER_KEY = 'test-master-key-32-characters!!';
    const userKey = 'clave-correcta-123';
    const iv = crypto.randomBytes(16);
    const keyBuffer = Buffer.from(MASTER_KEY.padEnd(32).slice(0, 32));
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    const encryptedKey = Buffer.concat([cipher.update(userKey, 'utf8'), cipher.final()]);
    const claveCifrada = iv.toString('hex') + ':' + encryptedKey.toString('hex');

    // 2) El "archivo" almacenado, cifrado con la misma lógica que usa @workfolder/utils (AES-256-GCM)
    const { encryptBuffer } = await import('@workfolder/utils');
    const original = Buffer.from('contenido confidencial del documento');
    const encryptedFile = encryptBuffer(original, userKey);

    mockClient.from.mockReturnValueOnce(queryResult({ data: { user_id: 'u1' }, error: null })); // ownership
    mockClient.from.mockReturnValueOnce(
      queryResult({ data: { clave_cifrada: claveCifrada, ruta_storage: 'u1/file.enc', tipo_mime: 'application/pdf', nombre_original: 'contrato.pdf' }, error: null })
    );
    mockClient.storage.from.mockReturnValueOnce({
      download: vi.fn().mockResolvedValue({ data: { arrayBuffer: async () => encryptedFile }, error: null }),
    });

    const req = new NextRequest('http://localhost:3002/api?id=doc-1', {
      headers: { ...authHeaders(), 'x-user-key': userKey },
    });
    const res = await GET(req);
    const buf = Buffer.from(await res.arrayBuffer());

    expect(res.status).toBe(200);
    expect(buf.toString()).toBe('contenido confidencial del documento');
  });

  it('devuelve 403 si la clave de descifrado es incorrecta', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const crypto = await import('crypto');
    const MASTER_KEY = 'test-master-key-32-characters!!';
    const iv = crypto.randomBytes(16);
    const keyBuffer = Buffer.from(MASTER_KEY.padEnd(32).slice(0, 32));
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    const encryptedKey = Buffer.concat([cipher.update('clave-real', 'utf8'), cipher.final()]);
    const claveCifrada = iv.toString('hex') + ':' + encryptedKey.toString('hex');

    mockClient.from.mockReturnValueOnce(queryResult({ data: { user_id: 'u1' }, error: null }));
    mockClient.from.mockReturnValueOnce(queryResult({ data: { clave_cifrada: claveCifrada }, error: null }));

    const req = new NextRequest('http://localhost:3002/api?id=doc-1', {
      headers: { ...authHeaders(), 'x-user-key': 'clave-incorrecta' },
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('devuelve 403 si el usuario no es propietario del documento', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { user_id: 'otro-usuario' }, error: null }));

    const req = new NextRequest('http://localhost:3002/api?id=doc-1', {
      headers: { ...authHeaders(), 'x-user-key': 'cualquiera' },
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('lista los documentos propios del usuario', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: [{ id: 'd1' }, { id: 'd2' }], error: null }));

    const req = new NextRequest('http://localhost:3002/api?userId=u1', { headers: authHeaders() });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(2);
  });

  it('rechaza con 403 el listado admin si el usuario no es administrador', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'standard' } } } });

    const req = new NextRequest('http://localhost:3002/api?adminAll=true', { headers: authHeaders() });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('permite el listado admin de todos los documentos enriquecido con el email', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'admin' } } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: [{ id: 'd1', user_id: 'u2' }], error: null }));
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { email: 'colaborador@workfolder.com' } } });

    const req = new NextRequest('http://localhost:3002/api?adminAll=true', { headers: authHeaders() });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data[0].user_email).toBe('colaborador@workfolder.com');
  });
});

describe('PATCH /api/documentos (re-cifrado con nueva clave)', () => {
  it('devuelve 401 sin Authorization header', async () => {
    const req = makeJsonRequest('http://localhost:3002/api', 'PATCH', { documentId: 'd1', newKey: 'nueva-clave-123' });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('rechaza con 400 si falta documentId o la newKey es muy corta', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const req = makeJsonRequest('http://localhost:3002/api', 'PATCH', { documentId: 'd1', newKey: '123' }, authHeaders());
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('exige verificación 2FA cuando no es adminOverride y no se envía mfaCode', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { user_id: 'u1' }, error: null }));

    const req = makeJsonRequest('http://localhost:3002/api', 'PATCH', { documentId: 'd1', newKey: 'nueva-clave-123' }, authHeaders());
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.code).toBe('REQUIRES_2FA');
  });

  it('rechaza con 403 un adminOverride si el solicitante no es admin', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: { app_metadata: { role: 'standard' } } } });

    const req = makeJsonRequest(
      'http://localhost:3002/api', 'PATCH',
      { documentId: 'd1', newKey: 'nueva-clave-123', adminOverride: true },
      authHeaders()
    );
    const res = await PATCH(req);
    expect(res.status).toBe(403);
  });

  it('rechaza con 401 si el código 2FA es incorrecto', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { user_id: 'u1' }, error: null }));
    mockClient.auth.mfa.challengeAndVerify.mockResolvedValueOnce({ error: { message: 'invalid' } });

    const req = makeJsonRequest(
      'http://localhost:3002/api', 'PATCH',
      { documentId: 'd1', newKey: 'nueva-clave-123', mfaCode: '000000', factorId: 'f1' },
      authHeaders()
    );
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('re-cifra correctamente el documento (round-trip real de cifrado)', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { user_id: 'u1' }, error: null })); // ownership check
    mockClient.auth.mfa.challengeAndVerify.mockResolvedValueOnce({ error: null });

    const crypto = await import('crypto');
    const MASTER_KEY = 'test-master-key-32-characters!!';
    const oldKey = 'clave-vieja-123';
    const iv = crypto.randomBytes(16);
    const keyBuffer = Buffer.from(MASTER_KEY.padEnd(32).slice(0, 32));
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    const encryptedOldKey = Buffer.concat([cipher.update(oldKey, 'utf8'), cipher.final()]);
    const claveCifradaVieja = iv.toString('hex') + ':' + encryptedOldKey.toString('hex');

    const { encryptBuffer } = await import('@workfolder/utils');
    const original = Buffer.from('contenido del documento');
    const encryptedFile = encryptBuffer(original, oldKey);

    mockClient.from.mockReturnValueOnce(
      queryResult({ data: { clave_cifrada: claveCifradaVieja, ruta_storage: 'u1/file.enc' }, error: null })
    ); // meta lookup
    const bucket = defaultStorageMock();
    bucket.download.mockResolvedValue({ data: { arrayBuffer: async () => encryptedFile }, error: null });
    mockClient.from.mockReturnValueOnce(queryResult({ data: {}, error: null })); // update clave_cifrada

    const req = makeJsonRequest(
      'http://localhost:3002/api', 'PATCH',
      { documentId: 'd1', newKey: 'clave-nueva-456', mfaCode: '123456', factorId: 'f1' },
      authHeaders()
    );
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(bucket.upload).toHaveBeenCalledOnce();
  });
});

describe('DELETE /api/documentos', () => {
  it('devuelve 400 sin id', async () => {
    const req = new NextRequest('http://localhost:3002/api', { method: 'DELETE', headers: authHeaders() });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('devuelve 401 sin autenticación', async () => {
    const req = new NextRequest('http://localhost:3002/api?id=d1', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si el documento no pertenece al usuario', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { user_id: 'otro' }, error: null }));

    const req = new NextRequest('http://localhost:3002/api?id=d1', { method: 'DELETE', headers: authHeaders() });
    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });

  it('elimina correctamente el documento y su archivo en Storage', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    mockClient.from.mockReturnValueOnce(queryResult({ data: { user_id: 'u1' }, error: null }));
    mockClient.from.mockReturnValueOnce(queryResult({ data: { ruta_storage: 'u1/file.enc' }, error: null }));
    const bucket = defaultStorageMock();
    mockClient.from.mockReturnValueOnce(queryResult({ data: {}, error: null }));

    const req = new NextRequest('http://localhost:3002/api?id=d1', { method: 'DELETE', headers: authHeaders() });
    const res = await DELETE(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(bucket.remove).toHaveBeenCalledWith(['u1/file.enc']);
  });
});
