import type { NextRequest } from 'next/server';
import { logEvent, type AuditEvent } from '@workfolder/utils';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { err } from '@/lib/response';

/** Encola un evento de auditoría de usuarios (IP tomada del request). Nunca lanza error. */
export const auditar = (req: NextRequest, event: AuditEvent) => logEvent(getSupabaseAdmin(), req, event);

/** Registra el intento de una acción de administrador sin permisos y responde 403 */
export async function denegarNoAdmin(req: NextRequest, userId: string, accion: string) {
  await auditar(req, {
    evento:  'Seguridad',
    accion:  `Intento sin permisos de administrador: ${accion}`,
    user_id: userId,
  });
  return err('Permisos insuficientes', 403);
}
