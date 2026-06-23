import { describe, it, expect } from 'vitest';
import { buildSwaggerSpec } from '@/lib/swagger';

describe('buildSwaggerSpec (facturacion)', () => {
  const spec = buildSwaggerSpec('http://localhost:3003');

  it('genera un documento OpenAPI 3.0', () => {
    expect(spec.openapi).toBe('3.0.0');
  });

  it('configura el server URL recibido como parámetro', () => {
    expect(spec.servers[0].url).toBe('http://localhost:3003');
  });

  it('incluye todos los endpoints de facturación y pagos', () => {
    expect(spec.paths['/api/planes']).toBeDefined();
    expect(spec.paths['/api/suscripcion']).toBeDefined();
    expect(spec.paths['/api/facturas']).toBeDefined();
    expect(spec.paths['/api/pago/iniciar']).toBeDefined();
    expect(spec.paths['/api/pago/sync']).toBeDefined();
    expect(spec.paths['/api/pago/simular']).toBeDefined();
    expect(spec.paths['/api/pago/webhook']).toBeDefined();
  });

  it('/api/planes es público (sin security)', () => {
    expect(spec.paths['/api/planes'].get.security).toBeUndefined();
  });

  it('/api/pago/webhook es público (lo invoca Mercado Pago directamente)', () => {
    expect(spec.paths['/api/pago/webhook'].post.security).toBeUndefined();
  });

  it('los endpoints administrativos requieren BearerAuth', () => {
    expect(spec.paths['/api/suscripcion'].get.security).toContainEqual({ BearerAuth: [] });
    expect(spec.paths['/api/pago/iniciar'].post.security).toContainEqual({ BearerAuth: [] });
  });

  it('el spec es serializable a JSON sin errores', () => {
    expect(() => JSON.stringify(spec)).not.toThrow();
  });

  it('acepta distintos baseUrl', () => {
    const prodSpec = buildSwaggerSpec('https://workfolder-facturacion.vercel.app');
    expect(prodSpec.servers[0].url).toBe('https://workfolder-facturacion.vercel.app');
  });
});
