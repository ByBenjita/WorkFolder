import { getAccessToken } from './authApi';

const BASE = '/api/reportes';

export interface PuntoMinuto {
  minuto:    string;
  actividad: number;
  seguridad: number;
  pagos:     number;
}

export interface EventoReciente {
  topico:      string;
  tipo:        string;
  categoria:   string | null;
  origen:      string;
  ocurrido_en: string;
}

/** Foto que devuelve public.metricas_snapshot() vía el microservicio de reportes */
export interface MetricasSnapshot {
  generado_en:      string;
  total_eventos:    number;
  ultimo_evento_en: string | null;
  por_tipo:         Record<string, number>;
  por_categoria:    Record<string, number>;
  por_origen:       Record<string, number>;
  kpis: {
    logins_ok:              number;
    logins_fallidos:        number;
    subidas:                number;
    descargas:              number;
    alertas_seguridad_5min: number;
    usuarios_activos_15min: number;
    pagos_aprobados:        number;
    suscripciones:          number;
    ingresos:               Record<string, number>;
  };
  suscripciones_por_plan: Record<string, number>;
  serie_por_minuto:       PuntoMinuto[];
  ultimos:                EventoReciente[];
}

export interface MetricasResponse {
  success:  boolean;
  data?:    MetricasSnapshot;
  message?: string;
}

/** Obtiene las métricas vía BFF con el token de la sesión. Nunca lanza: devuelve success=false. */
export async function getMetricas(ventana = 30): Promise<MetricasResponse> {
  const token = getAccessToken();
  if (!token) return { success: false, message: 'No autenticado' };

  try {
    const res = await fetch(`${BASE}/metricas?ventana=${ventana}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache:   'no-store',
    });
    const json = await res.json();
    if (!res.ok) return { success: false, message: json.message ?? 'Error obteniendo las métricas' };
    return json;
  } catch {
    return { success: false, message: 'Error de conexión con el servicio de reportes' };
  }
}
