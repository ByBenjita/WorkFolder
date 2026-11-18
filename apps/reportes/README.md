# Microservicio Reportes (Vercel Queues)

Recibe los eventos de negocio de los microservicios, los publica en **Vercel Queues** y los procesa con consumidores push que alimentan las **métricas en tiempo real** del panel enterprise (sección *Métricas Live*).

Vercel Queues cumple el rol de Apache Kafka en la arquitectura cloud: tópicos durables de solo escritura al final, consumer groups independientes, retención configurable, entrega al menos una vez con reintentos y escalado gestionado.

| | |
|---|---|
| Puerto | `3005` |
| Broker | Vercel Queues (gestionado, beta pública) |
| Tópicos | `workfolder-actividad`, `workfolder-pagos` (retención 7 días) |
| Productores | `usuarios`, `documentos`, `facturacion` (vía `@workfolder/utils`) |
| Consumidores | `src/app/api/queues/actividad`, `src/app/api/queues/pagos` (push, un consumer group cada uno) |
| Almacenamiento | `public.metricas_evento` + `public.metricas_snapshot()` en Supabase |

## Flujo de eventos

```
usuarios    ─┐                       ┌─▶ pgmq audit_events ─▶ auditoria ─▶ audit_log   (fuente de verdad)
documentos  ─┼─ logEvent() ──────────┤
facturacion ─┘                       └─▶ POST /api/eventos ─┐
facturacion ── publicar() ─▶ pgmq pub/sub                   │  (x-ingest-secret)
                         └─▶ POST /api/eventos ─────────────┤
                                                            ▼
                                   reportes ──send()──▶ Vercel Queues
                                                  ├─ [workfolder-actividad] ──push──▶ /api/queues/actividad ─┐
                                                  └─ [workfolder-pagos]     ──push──▶ /api/queues/pagos     ─┤
                                                                                                             ▼
                                                                                 Supabase public.metricas_evento
                                                                                                             │
 panel enterprise (Métricas Live) ──BFF /api/reportes/metricas──▶ reportes /api/metricas ──rpc──▶ metricas_snapshot()
```

1. Cada microservicio registra sus hechos con `logEvent()` (login, subida, descarga, firma, cambio de clave, administración, intentos sin permiso) y `publicar()` (`pago.aprobado`, `suscripcion.autorizada`).
2. Esas funciones envían una copia a `POST /api/eventos` de reportes con `emitirEventoNegocio()`. Si reportes no responde, la operación principal sigue (timeout de 2 s y pausa de 30 s).
3. Reportes valida el evento y lo publica con `send()` en el tópico correspondiente.
4. Vercel Queues invoca el consumidor push de cada tópico. Si termina sin error, el mensaje queda confirmado (ack). Si falla, se reintenta con backoff exponencial (5 s a 5 min) y se descarta tras 10 entregas.
5. El consumidor guarda el evento en `metricas_evento`. El panel consulta `metricas_snapshot()` cada 5 s.

### Por qué los productores pasan por reportes

En Vercel Queues los tópicos pertenecen a **un proyecto**: el token OIDC con que se publica identifica al proyecto, y en push el mensaje vuelve al mismo deployment que lo publicó. Cada microservicio es un proyecto de Vercel distinto, así que reportes es el dueño de los tópicos y expone `/api/eventos` como puerta de entrada (el mismo patrón que el REST Proxy de Kafka).

### Garantías

| Problema | Solución |
|---|---|
| Entrega al menos una vez (la cola puede reenviar) | `dedupe_key` único en `metricas_evento`: un reenvío choca y se ignora |
| El productor reintenta | Cada evento lleva un `evento_id` (UUID) que es la clave de idempotencia de `send()` |
| Mercado Pago reintenta webhooks (cada reintento genera un `evento_id` nuevo) | En pagos la clave es `tipo:payment_id` / `tipo:preapproval_id` |
| Mensaje inválido | Se confirma (ack) y se descarta: reintentar no lo arregla |
| Datos personales | La acción de auditoría se reduce a una categoría fija (`categorizarAccion`); no viajan IP, email, metadata ni nombres de archivo |

### Formato del evento

```json
{
  "evento_id": "4b9c…",
  "topico": "workfolder-actividad",
  "tipo": "Subida",
  "origen": "documentos",
  "ocurrido_en": "2026-11-17T12:30:10.000Z",
  "clave": "<user_id>",
  "datos": { "categoria": "subida", "user_id": "…", "documento_id": "…" }
}
```

En `workfolder-pagos`, `tipo` es `pago.aprobado` o `suscripcion.autorizada` y `datos` es el payload del evento sin la IP.

## Métricas (`metricas_snapshot`)

| Métrica | Ventana |
|---|---|
| Usuarios activos distintos | últimos 15 min |
| Alertas de seguridad (eventos `Seguridad` y logins fallidos) | últimos 5 min |
| Eventos por minuto: actividad / seguridad / pagos | últimos 30 min (configurable de 5 a 120) |
| Logins OK y fallidos, subidas, descargas, por categoría, por microservicio | histórico |
| Pagos aprobados, ingresos por moneda, suscripciones por plan | histórico |

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/eventos` | Header `x-ingest-secret` | Entrada de eventos de los microservicios → publica en la cola (202) |
| `GET` | `/api/metricas` | Bearer, rol `admin` o permiso `view_audit` | Foto de métricas. Query: `ventana` (minutos) |
| `POST` | `/api/queues/actividad` | Solo Vercel Queues (sin URL pública) | Consumidor push de `workfolder-actividad` |
| `POST` | `/api/queues/pagos` | Solo Vercel Queues (sin URL pública) | Consumidor push de `workfolder-pagos` |

Los consumidores se declaran en [`vercel.json`](vercel.json) con triggers `queue/v2beta`.

## Despliegue en Vercel

1. Crear el proyecto de Vercel con **Root Directory** `apps/reportes`. Vercel Queues está disponible en beta en todos los planes; los tópicos se crean al publicar.
2. Ejecutar `supabase/migrations/20261117120000_metricas_negocio.sql` (SQL Editor o `supabase db push`).
3. Variables de entorno:

   | Proyecto | Variables |
   |---|---|
   | reportes | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REPORTES_INGEST_SECRET`, `FRONTEND_URL` |
   | usuarios, documentos, facturacion | `REPORTES_API_URL`, `REPORTES_INGEST_SECRET`, `SERVICIO_NOMBRE` (`usuarios` / `documentos` / `facturacion`) |
   | frontend | `REPORTES_API_URL` |

   `REPORTES_INGEST_SECRET` debe ser el mismo string largo aleatorio en reportes y en los productores.

## Desarrollo local

```bash
pnpm --filter reportes dev   # http://localhost:3005
```

- **Sin credenciales de Vercel** (modo `directo`): `/api/eventos` guarda el evento directo en Supabase, sin cola. Sirve para desarrollar sin depender de la nube.
- **Con la cola real:** dentro de `apps/reportes` ejecutar `vercel link` y `vercel env pull .env.local` (trae `VERCEL_OIDC_TOKEN`). El SDK publica en Vercel Queues y entrega el mensaje al consumidor local según `vercel.json`.
- `REPORTES_COLA=vercel|directo` fuerza el modo.

En los productores (`.env.local` de usuarios, documentos y facturación):

```env
REPORTES_API_URL=http://localhost:3005
REPORTES_INGEST_SECRET=<mismo valor que en reportes>
```

## Tests

```bash
pnpm --filter reportes test
```
