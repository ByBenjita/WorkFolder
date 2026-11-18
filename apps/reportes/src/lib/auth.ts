import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/services/supabase';

export interface MetricasViewer {
  id:    string;
  email: string | null;
}

/**
 * Valida el token de Supabase y exige rol admin o el permiso `view_audit`
 * (las métricas salen de los mismos eventos que la auditoría).
 * getUser() lee el usuario actual, así un cambio de permisos aplica de inmediato.
 */
export async function getMetricasViewer(req: NextRequest): Promise<{ viewer?: MetricasViewer; status?: number; message?: string }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return { status: 401, message: 'No autorizado' };

  const { data, error } = await supabaseAdmin.auth.getUser(authHeader.slice(7).trim());
  const user = data?.user;
  if (error || !user) return { status: 401, message: 'No autorizado' };

  const meta = (user.app_metadata ?? {}) as { role?: string; permissions?: { view_audit?: boolean } };
  if (meta.role !== 'admin' && meta.permissions?.view_audit !== true) {
    return { status: 403, message: 'Permisos insuficientes para ver las métricas' };
  }
  return { viewer: { id: user.id, email: user.email ?? null } };
}
