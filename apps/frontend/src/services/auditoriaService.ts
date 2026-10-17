import { getAccessToken } from './authApi';

const BASE = '/api/auditoria';

export type AuditEvento = 'Acceso' | 'Subida' | 'Modificación' | 'Eliminación' | 'Seguridad';

/** Registro tal como lo devuelve el microservicio de auditoría */
export interface AuditRecord {
  id:           number;
  evento:       AuditEvento;
  accion:       string;
  user_id:      string | null;
  user_email:   string | null;
  documento_id: string | null;
  ip:           string | null;
  metadata:     Record<string, unknown>;
  ocurrido_en:  string;
}

/** Respuesta de /api/logs; `siguiente` es el cursor para la página anterior */
export interface AuditLogsResponse {
  success:    boolean;
  data?:      AuditRecord[];
  siguiente?: string | null;
  message?:   string;
}

/** Filtros opcionales de la consulta de logs */
export interface AuditQuery {
  limit?:   number;
  evento?:  AuditEvento;
  antesDe?: string;
}

/** Obtiene los logs de auditoría vía BFF con el token de la sesión. Nunca lanza: devuelve success=false. */
export async function getAuditLogs(query: AuditQuery = {}): Promise<AuditLogsResponse> {
  const token = getAccessToken();
  if (!token) return { success: false, message: 'No autenticado' };

  const params = new URLSearchParams();
  if (query.limit)   params.set('limit', String(query.limit));
  if (query.evento)  params.set('evento', query.evento);
  if (query.antesDe) params.set('antesDe', query.antesDe);

  try {
    const res = await fetch(`${BASE}/logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache:   'no-store',
    });
    const json = await res.json();
    if (!res.ok) return { success: false, message: json.message ?? 'Error obteniendo la auditoría' };
    return json;
  } catch {
    return { success: false, message: 'Error de conexión con el servicio de auditoría' };
  }
}