import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/services/supabase';
import { getAuditViewer } from '@/lib/auth';
import { EVENTOS_VALIDOS } from '@/lib/consumer';
import { ok, err } from '@/lib/response';

export { OPTIONS } from '@/lib/response';

const MAX_LIMIT = 200;

/**
 * GET /api/logs?limit=50&evento=Seguridad&userId=<uuid>&documentoId=<uuid>&antesDe=<ISO>
 * Devuelve los registros de auditoría más recientes. Requiere admin o permiso view_audit.
 */
export async function GET(req: NextRequest) {
  try {
    const { viewer, status, message } = await getAuditViewer(req);
    if (!viewer) return err(message!, status);

    const { searchParams } = new URL(req.url);
    const limit       = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), MAX_LIMIT);
    const evento      = searchParams.get('evento');
    const userId      = searchParams.get('userId');
    const documentoId = searchParams.get('documentoId');
    const antesDe     = searchParams.get('antesDe'); // paginación por cursor

    if (evento && !EVENTOS_VALIDOS.includes(evento as any)) {
      return err(`evento inválido. Valores: ${EVENTOS_VALIDOS.join(', ')}`, 400);
    }

    let query = supabaseAdmin
      .from('audit_log')
      .select('id, evento, accion, user_id, user_email, documento_id, ip, metadata, ocurrido_en')
      .order('ocurrido_en', { ascending: false })
      .limit(limit);

    if (evento)      query = query.eq('evento', evento);
    if (userId)      query = query.eq('user_id', userId);
    if (documentoId) query = query.eq('documento_id', documentoId);
    if (antesDe)     query = query.lt('ocurrido_en', antesDe);

    const { data, error } = await query;
    if (error) return err('Error obteniendo la auditoría', 500);

    const logs = data ?? [];
    return ok({
      data:      logs,
      siguiente: logs.length === limit ? logs[logs.length - 1].ocurrido_en : null,
    });
  } catch (e: any) {
    console.error('[auditoria] GET /api/logs:', e);
    return err('Error en la solicitud', 500);
  }
}