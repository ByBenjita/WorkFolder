import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock de Supabase
const mockClient = vi.hoisted(() => ({
  auth: { getUser: vi.fn(), admin: { createUser: vi.fn() } },
}));

// Mock de la función createClient para devolver el mockClient
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

// Mock de la función sendEmail para no enviar correos reales durante las pruebas
import { POST } from '@/app/api/admin/invite/route';

// Función auxiliar para crear una solicitud NextRequest simulada
function makeRequest(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/admin/invite', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// Función auxiliar para simular que el usuario que hace la solicitud es un admin
function asAdminRequester() {
  mockClient.auth.getUser.mockResolvedValueOnce({
    data: { user: { id: 'admin-1', app_metadata: { role: 'admin' } } },
    error: null,
  });
}

// Grupo de pruebas para la ruta POST /api/admin/invite
describe('POST /api/admin/invite', () => {
  beforeEach(() => {
    mockClient.auth.getUser.mockReset();
    mockClient.auth.admin.createUser.mockReset();
  });

  // Prueba que verifica que se devuelve un 401 si no se proporciona un token de autenticación
  it('devuelve 401 sin token', async () => {
    const res = await POST(makeRequest({ email: 'a@a.com', password: '12345678' }));
    expect(res.status).toBe(401);
  });

  // Prueba que verifica que se devuelve un 403 si el usuario que hace la solicitud no es un admin
  it('devuelve 403 si quien invita no es admin', async () => {
    mockClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', app_metadata: { role: 'standard' } } },
      error: null,
    });

    // Simula que el usuario autenticado es un usuario estándar
    const res = await POST(makeRequest({ email: 'a@a.com', password: '12345678' }, 'tok-user'));
    expect(res.status).toBe(403);
  });

  // Prueba que verifica que se devuelve un 400 si falta el email o la contraseña en la solicitud
  it('rechaza con 400 si falta email o password', async () => {
    asAdminRequester();
    const res = await POST(makeRequest({ email: 'a@a.com' }, 'tok-admin'));
    expect(res.status).toBe(400);
  });

  // Prueba que verifica que se asigna el rol de admin cuando el nivel es admin_delegado
  it('asigna role=admin cuando level es admin_delegado', async () => {
    asAdminRequester();
    mockClient.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: { id: 'u9', email: 'nuevo@workfolder.com' } },
      error: null,
    });

    // Simula la creación de un usuario con nivel admin_delegado
    await POST(
      makeRequest({ email: 'nuevo@workfolder.com', password: '12345678', level: 'admin_delegado' }, 'tok-admin')
    );

    // Verifica que la función createUser de Supabase se haya llamado con el rol correcto
    expect(mockClient.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ app_metadata: expect.objectContaining({ role: 'admin', level: 'admin_delegado' }) })
    );
  });

  // Prueba que verifica que no se asigna ningún rol cuando el nivel es estándar
  it('no asigna role para un nivel estándar (usuario RRHH/colaborador)', async () => {
    asAdminRequester();
    mockClient.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: { id: 'u10', email: 'rrhh@workfolder.com' } },
      error: null,
    });

    // Simula la creación de un usuario con nivel estándar
    await POST(
      makeRequest({ email: 'rrhh@workfolder.com', password: '12345678', level: 'estandar' }, 'tok-admin')
    );

    // Verifica que la función createUser de Supabase se haya llamado sin asignar ningún rol
    const callArgs = mockClient.auth.admin.createUser.mock.calls[0][0];
    expect(callArgs.app_metadata.role).toBeUndefined();
  });

  // Prueba que verifica que se crea correctamente un usuario y se devuelve su ID
  it('crea el usuario correctamente y devuelve su id', async () => {
    asAdminRequester();
    mockClient.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: { id: 'u11', email: 'colaborador@workfolder.com' } },
      error: null,
    });

    // Simula la creación de un usuario estándar
    const res = await POST(
      makeRequest({ email: 'colaborador@workfolder.com', password: '12345678' }, 'tok-admin')
    );
    const json = await res.json();

    // Verifica que la respuesta tenga un estado 200 y que el ID del usuario creado sea el esperado
    expect(res.status).toBe(200);
    expect(json.userId).toBe('u11');
  });

  // Prueba que verifica que se devuelve un 500 si Supabase falla al crear el usuario
  it('devuelve 500 si Supabase falla al crear el usuario', async () => {
    asAdminRequester();
    mockClient.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'email ya registrado' },
    });

    // Simula un intento de crear un usuario con un email ya registrado
    const res = await POST(makeRequest({ email: 'dup@workfolder.com', password: '12345678' }, 'tok-admin'));
    expect(res.status).toBe(500);
  });
});
