import { getAccessToken } from './authApi';

const BASE = '/api/facturacion';

export type PlanId = 'startup' | 'business' | 'enterprise';

export interface ModuloRRHH {
  titulo: string;
  extras: string[];
}

export interface Plan {
  id: PlanId;
  nombre: string;
  precio_mensual: number;
  iva_porcentaje: number;
  caracteristicas: string[];
  modulo_rrhh?: ModuloRRHH;
}

export interface Suscripcion {
  id?: string;
  admin_id?: string;
  plan_id: PlanId;
  estado: string;
  fecha_inicio: string;
  fecha_proximo_cobro: string | null;
}

export interface Factura {
  id: string;
  suscripcion_id: string;
  monto: number;
  estado: 'pagado' | 'pendiente' | 'fallido';
  periodo_inicio: string;
  periodo_fin: string;
  creado_en: string;
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const facturacionService = {
  async getPlanes(): Promise<Plan[]> {
    const res = await fetch(`${BASE}/planes`);
    const data = await res.json();
    return data.planes ?? [];
  },

  async getSuscripcion(): Promise<Suscripcion | null> {
    const res = await fetch(`${BASE}/suscripcion`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.suscripcion ?? null;
  },

  async cambiarPlan(plan_id: PlanId): Promise<Suscripcion> {
    const res = await fetch(`${BASE}/suscripcion`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message ?? 'Error al cambiar plan');
    return data.suscripcion;
  },

  async getFacturas(): Promise<Factura[]> {
    const res = await fetch(`${BASE}/facturas`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.facturas ?? [];
  },

  async iniciarPago(plan_id: PlanId, payer_email: string): Promise<{
    init_point: string;
    sandbox_init_point: string | null;
    preapproval_id: string;
  }> {
    const res = await fetch(`${BASE}/pago/iniciar`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id, payer_email }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message ?? 'Error al iniciar pago');
    return {
      init_point:         data.init_point,
      sandbox_init_point: data.sandbox_init_point ?? null,
      preapproval_id:     data.preapproval_id,
    };
  },

  async simularPago(plan_id: PlanId): Promise<{ simulado: boolean; plan_id: string }> {
    const res = await fetch(`${BASE}/pago/simular`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message ?? 'Error al simular pago');
    return { simulado: data.simulado, plan_id: data.plan_id };
  },

  async sincronizar(preapproval_id: string): Promise<{ sincronizado: boolean; plan_id?: string }> {
    const res = await fetch(`${BASE}/pago/sync?preapproval_id=${preapproval_id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return { sincronizado: data.sincronizado ?? false, plan_id: data.plan_id };
  },
};
