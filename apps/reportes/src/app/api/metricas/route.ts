import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/services/supabase';
import { getMetricasViewer } from '@/lib/auth';
import { ok, err } from '@/lib/response';

export { OPTIONS } from '@/lib/response';
export const dynamic = 'force-dynamic';

/**
 * GET /api/metricas?ventana=30 — foto de las métricas en tiempo real.
 * Requiere admin o permiso view_audit. `ventana` = minutos de la serie (5 a 120).
 */
export async function GET(req: NextRequest) {
  const { viewer, status, message } = await getMetricasViewer(req);
  if (!viewer) return err(message!, status);

  const ventana = Math.min(Math.max(Number(new URL(req.url).searchParams.get('ventana')) || 30, 5), 120);

  const { data, error } = await supabaseAdmin.rpc('metricas_snapshot', { p_ventana_minutos: ventana });
  if (error) {
    console.error('[reportes] metricas_snapshot:', error.message);
    return err('Error obteniendo las métricas', 500);
  }
  return ok({ data });
}
