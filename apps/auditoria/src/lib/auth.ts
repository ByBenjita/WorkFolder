import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/services/supabase';

export interface AuditViewer {
  id:    string;
  email: string | null;
}

/**
 * Valida el token y exige rol admin o el permiso `view_audit`.
 * Usa getUser() (lee el usuario actual desde Auth), así un cambio de permisos
 * se refleja sin esperar a que expire el JWT.
 */
export async function getAuditViewer(req: NextRequest): Promise<{ viewer?: AuditViewer; status?: number; message?: string }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return { status: 401, message: 'No autorizado' };

  const token = authHeader.slice(7).trim();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return { status: 401, message: 'No autorizado' };

  const meta = (user.app_metadata ?? {}) as { role?: string; permissions?: { view_audit?: boolean } };
  const puedeVer = meta.role === 'admin' || meta.permissions?.view_audit === true;
  if (!puedeVer) return { status: 403, message: 'Permisos insuficientes para ver la auditoría' };

  return { viewer: { id: user.id, email: user.email ?? null } };
}

/** Protege /api/procesar: solo cron o servicios internos con el secreto */
export function isWorkerAuthorized(req: NextRequest): boolean {
  const secret = process.env.AUDIT_WORKER_SECRET;
  if (!secret) return false;
  return req.headers.get('x-worker-secret') === secret;
}