import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/planes/route';
import { PLANES } from '@/data/planes';

describe('GET /api/planes', () => {
  it('devuelve los 3 planes definidos', async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.planes).toHaveLength(3);
  });

  it('cada plan trae id, precio y características', () => {
    for (const plan of PLANES) {
      expect(plan.id).toBeDefined();
      expect(plan.precio_mensual).toBeGreaterThan(0);
      expect(plan.caracteristicas.length).toBeGreaterThan(0);
    }
  });

  it('solo el plan Enterprise incluye el módulo RRHH', () => {
    const startup = PLANES.find((p) => p.id === 'startup');
    const business = PLANES.find((p) => p.id === 'business');
    const enterprise = PLANES.find((p) => p.id === 'enterprise');

    expect(startup?.modulo_rrhh).toBeUndefined();
    expect(business?.modulo_rrhh).toBeUndefined();
    expect(enterprise?.modulo_rrhh).toBeDefined();
  });
});
