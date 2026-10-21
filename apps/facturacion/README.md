# Microservicio Facturación — WorkFolder

Microservicio de procesamiento de pagos y gestión de suscripciones. Integra el SDK de Mercado Pago para crear preferencias de pago, manejar webhooks y registrar transacciones en Supabase.

- **Puerto:** 3003
- **Framework:** Next.js 14
- **Base de datos:** Supabase
- **Pagos:** Mercado Pago SDK v2
- **Testing:** Vitest

## Prerrequisitos

- Node.js v18 o superior
- pnpm v11 o superior
- Cuenta de Mercado Pago (credenciales de prueba o producción)
- Proyecto Supabase configurado

## Variables de Entorno

Crea el archivo `apps/facturacion/.env.local` con:

```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>

FRONTEND_URL=http://localhost:3000

# Secreto compartido con el frontend (BFF): valida la IP del cliente (x-client-ip) para la auditoría
INTERNAL_PROXY_SECRET=<mismo valor que en apps/frontend>

# Mercado Pago
MP_ACCESS_TOKEN=<tu-access-token>        # De "Credenciales de prueba" para sandbox
MP_SANDBOX=true                          # true habilita /api/pago/simular; false en producción real
MP_CURRENCY=CLP
MP_BACK_URL=http://localhost:3000/admin/enterprise-panel

# Pub/Sub de eventos de pago (suscriptor de la cola facturacion_eventos)
EVENTS_WORKER_SECRET=<string largo aleatorio>   # protege POST /api/eventos/procesar
EVENTS_POLL_MS=5000                             # opcional
EVENTS_POLLER=on                                # "off" en serverless (usar cron)
```

> Para pruebas, usa el Access Token de **Credenciales de prueba** y `MP_SANDBOX=true`. Las credenciales de prueba nuevas también empiezan con `APP_USR-`, por eso el modo sandbox se define con `MP_SANDBOX` y no por el prefijo del token.

## Instalación

Desde la raíz del monorepo:

```bash
pnpm install
```

## Desarrollo

```bash
# Desde la raíz
pnpm --filter facturacion dev

# O desde esta carpeta
pnpm dev
```

La API estará disponible en http://localhost:3003

## Build de Producción

```bash
pnpm --filter facturacion build
pnpm --filter facturacion start
```

## Tests

```bash
# Correr tests una vez
pnpm --filter facturacion test
```

Los tests se encuentran en `src/__tests__/`.

## Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/payments/create-preference` | Crear preferencia de pago en Mercado Pago |
| POST | `/api/payments/webhook` | Webhook de notificaciones de Mercado Pago |
| GET | `/api/subscriptions` | Listar suscripciones del usuario |
| POST | `/api/subscriptions` | Crear o actualizar suscripción |

## Flujo de Pago

```
1. Frontend llama a POST /api/payments/create-preference
2. Se crea una preferencia en Mercado Pago y se retorna un init_point
3. El usuario completa el pago en Mercado Pago
4. Mercado Pago notifica via webhook POST /api/payments/webhook
5. El webhook actualiza el estado de la suscripción en Supabase
6. El usuario es redirigido a MP_BACK_URL
```

## Eventos de pago (Publish/Subscribe + acknowledge)

El webhook de Mercado Pago ya no escribe en la base: verifica la notificación contra la API de MP y **publica** un evento. Cada microservicio suscrito lo procesa desde su propia cola (Supabase Queues / pgmq).

```
MP ──webhook──▶ facturacion ──publicar_evento──┬─▶ [facturacion_eventos] ─▶ facturacion: suscripción / factura ─ack
     ◀── 200 = ack a MP                        └─▶ [usuarios_eventos]    ─▶ usuarios: app_metadata.plan      ─ack
     ◀── 500 = MP reintenta
```

| Tema | Suscriptores | Lo publica |
|---|---|---|
| `suscripcion.autorizada` | facturación, usuarios | webhook, `/api/pago/sync`, `/api/pago/simular` |
| `pago.aprobado` | facturación | webhook |

- **Ack al productor:** el webhook responde 200 solo si el evento quedó publicado; si MP o la cola fallan responde 500 y MP reintenta.
- **Ack del suscriptor:** el mensaje se archiva solo si se procesó bien. Si falla, reaparece a los 30 s; tras 5 entregas se archiva como dead-letter.
- **Idempotencia:** la suscripción no se reescribe si ya está aplicada y la factura no se duplica por `mp_payment_id`.
- Un `pago.aprobado` que llega antes que la suscripción se reintenta hasta que ésta exista.
- Suscriptor: `src/instrumentation.ts` (poller local) o `POST /api/eventos/procesar` con `x-worker-secret` (cron en serverless).
- Setup: ejecutar `supabase/migrations/20261021120000_pubsub_pagos.sql`. Para sumar un suscriptor: crear su cola e insertarla en `public.event_subscriptions`.

## Modo Sandbox

Para probar pagos sin dinero real, usa el Access Token de **Credenciales de prueba** con `MP_SANDBOX=true`. Mercado Pago provee tarjetas de prueba en su documentación oficial.

## Estructura

```
apps/facturacion/
├── src/
│   ├── app/
│   │   └── api/       # Rutas API (Next.js route handlers)
│   ├── lib/           # Helpers y configuración Supabase / Mercado Pago
│   └── __tests__/     # Tests unitarios
├── .env.local         # Variables de entorno (no commitear)
├── next.config.js
└── package.json
```
