import { randomUUID } from 'crypto';
import { safeEqual } from './safeEqual';
import type { RequestConHeaders } from './audit';

// ── Eventos de negocio → apps/reportes → Vercel Queues ────────────
// Los microservicios ya emiten cada hecho relevante por logEvent() (auditoría) y
// publicar() (pagos). Además de pgmq, esos eventos se envían a apps/reportes, que los
// publica en Vercel Queues; su consumidor los guarda para las métricas en tiempo real.
//
// ¿Por qué pasar por reportes y no publicar directo? En Vercel Queues los tópicos
// pertenecen a un proyecto (el token OIDC lleva el proyecto). Cada microservicio es un
// proyecto distinto, así que reportes es el dueño de los tópicos y expone /api/eventos
// como puerta de entrada (mismo patrón que un REST Proxy de Kafka).
//
// Opcional: sin REPORTES_API_URL / REPORTES_INGEST_SECRET no se envía nada.
// Nunca lanza error ni bloquea la operación principal.

/** Tópicos de Vercel Queues (solo letras, números, - y _) */
export const TOPICOS_NEGOCIO = {
  /** Actividad de usuarios (mismo contenido que la auditoría, sin IP ni metadata) */
  ACTIVIDAD: 'workfolder-actividad',
  /** Pagos y suscripciones (pago.aprobado, suscripcion.autorizada) */
  PAGOS:     'workfolder-pagos',
} as const;

export type TopicoNegocio = (typeof TOPICOS_NEGOCIO)[keyof typeof TOPICOS_NEGOCIO];

/** Evento de negocio tal como viaja a reportes y por la cola */
export interface EventoNegocio<D = Record<string, unknown>> {
  /** Id único generado por el productor: deduplica reintentos de punta a punta */
  evento_id:   string;
  topico:      TopicoNegocio;
  /** 'Acceso', 'Subida', ... o 'pago.aprobado', 'suscripcion.autorizada' */
  tipo:        string;
  /** Microservicio que lo produjo */
  origen:      string;
  ocurrido_en: string;
  /** Id del hecho de negocio (user_id, payment_id...). En pagos deduplica reintentos de MP */
  clave:       string | null;
  datos:       D;
}

const TIMEOUT_MS          = 2000;
const PAUSA_TRAS_FALLO_MS = 30_000; // si reportes no responde, no reintentar en cada request

declare global {
  // eslint-disable-next-line no-var
  var __eventosPausadoHasta: number | undefined;
}

/** Nombre del microservicio. En Vercel definir SERVICIO_NOMBRE; en local pnpm define npm_package_name */
export function origenActual(): string {
  return process.env.SERVICIO_NOMBRE ?? process.env.npm_package_name ?? 'workfolder';
}

/**
 * Envía un evento de negocio a apps/reportes. Nunca lanza error.
 * `clave` identifica el hecho (mismo usuario, mismo pago).
 */
export async function emitirEventoNegocio(
  topico: TopicoNegocio,
  clave: string | null,
  evento: { tipo: string; datos: Record<string, unknown>; ocurrido_en?: string }
): Promise<void> {
  const url    = process.env.REPORTES_API_URL;
  const secret = process.env.REPORTES_INGEST_SECRET;
  if (!url || !secret) return;
  if (Date.now() < (globalThis.__eventosPausadoHasta ?? 0)) return;

  const cuerpo: EventoNegocio = {
    evento_id:   randomUUID(),
    topico,
    tipo:        evento.tipo,
    origen:      origenActual(),
    ocurrido_en: evento.ocurrido_en ?? new Date().toISOString(),
    clave,
    datos:       evento.datos,
  };

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/eventos`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-ingest-secret': secret },
      body:    JSON.stringify(cuerpo),
      signal:  AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.warn(`[eventos] reportes respondió ${res.status} para ${cuerpo.tipo}`);
  } catch (e: any) {
    globalThis.__eventosPausadoHasta = Date.now() + PAUSA_TRAS_FALLO_MS;
    console.warn('[eventos] No se pudo enviar a reportes:', e?.message ?? e);
  }
}

/** Protege POST /api/eventos de reportes (comparación en tiempo constante) */
export function ingestaAutorizada(req: RequestConHeaders): boolean {
  const secret   = process.env.REPORTES_INGEST_SECRET;
  const recibido = req.headers.get('x-ingest-secret');
  if (!secret || !recibido) return false;
  return safeEqual(recibido, secret);
}

/** Categorías de actividad que mide apps/reportes */
export const CATEGORIAS_ACTIVIDAD = [
  'login_ok', 'login_fallido', 'logout', 'subida', 'descarga', 'eliminacion',
  'firma', 'cambio_clave', 'admin', 'pago_iniciado', 'facturacion', 'seguridad', 'otro',
] as const;

export type CategoriaActividad = (typeof CATEGORIAS_ACTIVIDAD)[number];

/**
 * Reduce la acción de auditoría (texto libre con emails y nombres de archivo)
 * a una categoría fija. Así a la cola no viaja información personal.
 */
export function categorizarAccion(evento: string, accion: string): CategoriaActividad {
  // Solo prefijos: el resto del texto trae nombres de archivo y emails arbitrarios
  const a = accion.trim().toLowerCase();
  const empieza = (...prefijos: string[]) => prefijos.some((p) => a.startsWith(p));

  if (empieza('inicio de sesión fallido'))                     return 'login_fallido';
  if (evento === 'Seguridad')                                  return 'seguridad';
  if (empieza('inició sesión'))                                return 'login_ok';
  if (empieza('cerró sesión'))                                 return 'logout';
  if (empieza('inició el pago'))                               return 'pago_iniciado';
  if (empieza('activó el plan', 'cambió su suscripción', 'suscripción al plan', 'pago aprobado')) return 'facturacion';
  if (empieza('creó el usuario', 'eliminó el usuario', 'promovió', 'restableció la contraseña')) return 'admin';
  if (evento === 'Subida' || empieza('subió'))                 return 'subida';
  if (empieza('descargó'))                                     return 'descarga';
  if (evento === 'Eliminación' || empieza('eliminó'))          return 'eliminacion';
  if (empieza('firmó'))                                        return 'firma';
  if (empieza('cambió su contraseña', 'solicitó recuperar', 'cambió la clave')) return 'cambio_clave';
  return 'otro';
}
