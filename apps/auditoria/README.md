# Microservicio Auditoría

Consume la cola `audit_events` de **Supabase Queues (pgmq)** y guarda cada evento en `public.audit_log` (tabla inmutable). Expone la consulta de logs para el panel enterprise.

| | |
|---|---|
| Puerto | `3004` |
| Productores | `apps/documentos` (subida, descarga, cambio de clave, eliminación, eventos de seguridad) |
| Tabla | `public.audit_log` (sin UPDATE/DELETE/TRUNCATE) |

## Flujo

```
documentos ──pgmq_public.send──▶ [audit_events] ──read──▶ auditoria ──upsert──▶ audit_log
                                        ▲                     │
                                        └──── archive ◀───────┘
```

1. `apps/documentos` encola el evento con `logEvent()` (nunca falla la operación principal).
2. El consumidor lee lotes de 20 con visibility timeout de 30 s.
3. Inserta con `upsert(onConflict: 'msg_id', ignoreDuplicates)` → idempotente ante reprocesos.
4. Archiva cada mensaje (queda copia en `pgmq.a_audit_events`).
5. Si falla, el mensaje no se archiva y reaparece al vencer el timeout. Tras 5 intentos se archiva como dead-letter.

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/logs` | Bearer, rol `admin` o permiso `view_audit` | Logs recientes. Query: `limit` (máx 200), `evento`, `userId`, `documentoId`, `antesDe` (cursor) |
| `POST` | `/api/procesar` | Header `x-worker-secret` | Procesa la cola bajo demanda (cron en serverless) |

## Consumidor

- **Local / `next start`:** `src/instrumentation.ts` arranca un poller cada `AUDIT_POLL_MS` (5000 por defecto).
- **Vercel (serverless):** no hay proceso persistente; configurar un cron que llame a `POST /api/procesar` y definir `AUDIT_POLLER=off`.

## Variables de entorno

```env
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
AUDIT_WORKER_SECRET=<string largo aleatorio>
AUDIT_POLL_MS=5000        # opcional
AUDIT_POLLER=on           # "off" para desactivar el poller
FRONTEND_URL=http://localhost:3000
```

## Setup en Supabase (una vez)

1. Dashboard → **Integrations → Queues → Settings** → activar **Expose Queues via PostgREST**.
2. Ejecutar `supabase/migrations/20260926140000_audit_queue.sql` (SQL Editor o `supabase db push`).

## Tests

```bash
cd apps/auditoria
pnpm vitest run
```