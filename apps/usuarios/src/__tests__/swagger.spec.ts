import { describe, it, expect } from 'vitest';
import { buildSwaggerSpec } from '../lib/swagger';

describe('buildSwaggerSpec (usuarios)', () => {
  const spec = buildSwaggerSpec('http://localhost:3001');

  it('genera un documento OpenAPI 3.0', () => {
    expect(spec.openapi).toBe('3.0.0');
  });

  it('configura el server URL recibido como parámetro', () => {
    expect(spec.servers[0].url).toBe('http://localhost:3001');
  });

  it('define el esquema de seguridad BearerAuth', () => {
    expect(spec.components.securitySchemes.BearerAuth).toBeDefined();
    expect(spec.components.securitySchemes.BearerAuth.scheme).toBe('bearer');
  });

  it('incluye todos los endpoints de autenticación', () => {
    expect(spec.paths['/api/auth/login']).toBeDefined();
    expect(spec.paths['/api/auth/logout']).toBeDefined();
    expect(spec.paths['/api/auth/session']).toBeDefined();
    expect(spec.paths['/api/auth/password/forgot']).toBeDefined();
    expect(spec.paths['/api/auth/password/reset']).toBeDefined();
    expect(spec.paths['/api/auth/password/verify-2fa']).toBeDefined();
  });

  it('incluye todos los endpoints MFA', () => {
    expect(spec.paths['/api/mfa/enroll']).toBeDefined();
    expect(spec.paths['/api/mfa/factor']).toBeDefined();
    expect(spec.paths['/api/mfa/verify']).toBeDefined();
  });

  it('incluye todos los endpoints de administración', () => {
    expect(spec.paths['/api/admin/users']).toBeDefined();
    expect(spec.paths['/api/admin/invite']).toBeDefined();
    expect(spec.paths['/api/admin/update']).toBeDefined();
    expect(spec.paths['/api/admin/delete']).toBeDefined();
    expect(spec.paths['/api/admin/reset-password']).toBeDefined();
    expect(spec.paths['/api/admin/promote']).toBeDefined();
  });

  it('el login define requestBody con email y password', () => {
    const schema = spec.paths['/api/auth/login'].post.requestBody.content['application/json'].schema;
    expect(schema.properties.email).toBeDefined();
    expect(schema.properties.password).toBeDefined();
    expect(schema.required).toContain('email');
    expect(schema.required).toContain('password');
  });

  it('los endpoints admin requieren BearerAuth', () => {
    const security = spec.paths['/api/admin/users'].get.security;
    expect(security).toContainEqual({ BearerAuth: [] });
  });

  it('los endpoints públicos no tienen security', () => {
    expect(spec.paths['/api/auth/login'].post.security).toBeUndefined();
    expect(spec.paths['/api/auth/password/forgot'].post.security).toBeUndefined();
  });

  it('define el schema AdminUser con los campos requeridos', () => {
    const { AdminUser } = spec.components.schemas;
    expect(AdminUser.properties.id).toBeDefined();
    expect(AdminUser.properties.email).toBeDefined();
    expect(AdminUser.properties.level).toBeDefined();
    expect(AdminUser.properties.permissions).toBeDefined();
    expect(AdminUser.properties.banned).toBeDefined();
  });

  it('el spec es serializable a JSON sin errores', () => {
    expect(() => JSON.stringify(spec)).not.toThrow();
  });

  it('acepta distintos baseUrl', () => {
    const prodSpec = buildSwaggerSpec('https://api-workfolder-usuarios.vercel.app');
    expect(prodSpec.servers[0].url).toBe('https://api-workfolder-usuarios.vercel.app');
  });
});
