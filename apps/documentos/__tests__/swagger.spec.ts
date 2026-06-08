import { describe, it, expect } from 'vitest';
import { buildSwaggerSpec } from '../lib/swagger';

describe('buildSwaggerSpec (documentos)', () => {
  const spec = buildSwaggerSpec('http://localhost:3002');

  it('genera un documento OpenAPI 3.0', () => {
    expect(spec.openapi).toBe('3.0.0');
  });

  it('configura el server URL recibido como parámetro', () => {
    expect(spec.servers[0].url).toBe('http://localhost:3002');
  });

  it('define el esquema de seguridad BearerAuth', () => {
    expect(spec.components.securitySchemes.BearerAuth).toBeDefined();
    expect(spec.components.securitySchemes.BearerAuth.scheme).toBe('bearer');
  });

  it('expone el endpoint /api con los 4 métodos HTTP', () => {
    expect(spec.paths['/api'].post).toBeDefined();
    expect(spec.paths['/api'].get).toBeDefined();
    expect(spec.paths['/api'].patch).toBeDefined();
    expect(spec.paths['/api'].delete).toBeDefined();
  });

  it('POST /api define multipart/form-data con file, userId y userKey', () => {
    const schema = spec.paths['/api'].post.requestBody.content['multipart/form-data'].schema;
    expect(schema.properties.file).toBeDefined();
    expect(schema.properties.userId).toBeDefined();
    expect(schema.properties.userKey).toBeDefined();
    expect(schema.required).toContain('file');
    expect(schema.required).toContain('userId');
    expect(schema.required).toContain('userKey');
  });

  it('GET /api acepta parámetros userId, id y adminAll', () => {
    const params: any[] = spec.paths['/api'].get.parameters;
    const names = params.map((p: any) => p.name);
    expect(names).toContain('userId');
    expect(names).toContain('id');
    expect(names).toContain('adminAll');
  });

  it('GET /api acepta el header x-user-key', () => {
    const params: any[] = spec.paths['/api'].get.parameters;
    const headerParam = params.find((p: any) => p.name === 'x-user-key' && p.in === 'header');
    expect(headerParam).toBeDefined();
  });

  it('PATCH /api requiere documentId y newKey', () => {
    const schema = spec.paths['/api'].patch.requestBody.content['application/json'].schema;
    expect(schema.required).toContain('documentId');
    expect(schema.required).toContain('newKey');
  });

  it('DELETE /api requiere el parámetro id en query', () => {
    const params: any[] = spec.paths['/api'].delete.parameters;
    const idParam = params.find((p: any) => p.name === 'id' && p.in === 'query');
    expect(idParam).toBeDefined();
    expect(idParam.required).toBe(true);
  });

  it('todos los métodos requieren BearerAuth', () => {
    expect(spec.paths['/api'].post.security).toContainEqual({ BearerAuth: [] });
    expect(spec.paths['/api'].get.security).toContainEqual({ BearerAuth: [] });
    expect(spec.paths['/api'].patch.security).toContainEqual({ BearerAuth: [] });
    expect(spec.paths['/api'].delete.security).toContainEqual({ BearerAuth: [] });
  });

  it('define el schema DocumentoMetadata', () => {
    const { DocumentoMetadata } = spec.components.schemas;
    expect(DocumentoMetadata.properties.id).toBeDefined();
    expect(DocumentoMetadata.properties.nombre_original).toBeDefined();
    expect(DocumentoMetadata.properties.tamano_bytes).toBeDefined();
  });

  it('el spec es serializable a JSON sin errores', () => {
    expect(() => JSON.stringify(spec)).not.toThrow();
  });

  it('acepta distintos baseUrl', () => {
    const prodSpec = buildSwaggerSpec('https://api-workfolder-documentos.vercel.app');
    expect(prodSpec.servers[0].url).toBe('https://api-workfolder-documentos.vercel.app');
  });
});
