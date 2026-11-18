import { useCallback, useEffect, useState } from 'react';
import { getMetricas, type MetricasSnapshot } from '@/services/reportesService';

export const SERIES = [
  { clave: 'actividad', nombre: 'Actividad', color: 'var(--mx-serie-1)' },
  { clave: 'seguridad', nombre: 'Seguridad', color: 'var(--mx-serie-2)' },
  { clave: 'pagos',     nombre: 'Pagos',     color: 'var(--mx-serie-3)' },
] as const;

export const CATEGORIAS: Record<string, string> = {
  login_ok:      'Inicios de sesión',
  login_fallido: 'Logins fallidos',
  logout:        'Cierres de sesión',
  subida:        'Subidas',
  descarga:      'Descargas',
  eliminacion:   'Eliminaciones',
  firma:         'Firmas RRHH',
  cambio_clave:  'Cambios de clave',
  admin:         'Administración',
  pago_iniciado: 'Pagos iniciados',
  facturacion:   'Planes y pagos',
  seguridad:     'Seguridad',
  otro:          'Otros',
};

export const fmt    = (n: number) => n.toLocaleString('es-CL');
export const hora   = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
export const dinero = (monto: number, moneda: string) =>
  moneda === 'N/D'
    ? fmt(monto)
    : monto.toLocaleString('es-CL', { style: 'currency', currency: moneda, maximumFractionDigits: 0 });

/**
 * Métricas desde apps/reportes (alimentado por Vercel Queues).
 * Se refresca cada `intervaloMs` para el efecto "Live"; se pausa con la pestaña oculta.
 */
export const useMetricasPanel = (ventana = 30, intervaloMs = 5000) => {
  const [datos, setDatos]     = useState<MetricasSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const res = await getMetricas(ventana);
    if (res.success && res.data) {
      setDatos(res.data);
      setError(null);
    } else {
      setError(res.message ?? 'Error obteniendo las métricas');
    }
    setLoading(false);
  }, [ventana]);

  useEffect(() => {
    cargar();
    const timer = setInterval(cargar, intervaloMs);
    return () => clearInterval(timer);
  }, [cargar, intervaloMs]);

  return { datos, loading, error };
};
