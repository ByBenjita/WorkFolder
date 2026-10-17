-- ════════════════════════════════════════════════════════════════
-- Auditoría con Supabase Queues (pgmq)
--
-- Flujo: apps/documentos → cola `audit_events` → apps/auditoria → public.audit_log
--
-- REQUISITO PREVIO (una sola vez, en el Dashboard):
--   Integrations → Queues → Settings → activar "Expose Queues via PostgREST".
--   Eso crea el schema `pgmq_public` y lo expone en la Data API.
-- ════════════════════════════════════════════════════════════════

-- ── 0. Validaciones ─────────────────────────────────────────────
create extension if not exists pgmq;

do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'pgmq_public') then
    raise exception 'Falta el schema pgmq_public. Activa "Expose Queues via PostgREST" en Integrations → Queues → Settings y vuelve a ejecutar esta migración.';
  end if;
end $$;

-- ── 1. Cola ─────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pgmq.meta where queue_name = 'audit_events') then
    perform pgmq.create('audit_events');
  end if;
end $$;

-- RLS sin políticas: anon/authenticated no pueden tocar la cola.
-- service_role ignora RLS (BYPASSRLS), por eso solo los microservicios la usan.
alter table pgmq.q_audit_events enable row level security;
alter table pgmq.a_audit_events enable row level security;

-- ── 2. Permisos: solo service_role ─────────────────────────────
grant usage on schema pgmq to service_role;
grant execute on all functions in schema pgmq to service_role;
grant select, insert, update, delete on pgmq.q_audit_events, pgmq.a_audit_events to service_role;

grant usage on schema pgmq_public to service_role;
grant execute on all functions in schema pgmq_public to service_role;

-- La cola nunca se expone al cliente (navegador)
revoke execute on all functions in schema pgmq_public from public, anon, authenticated;

-- ── 3. Tabla de auditoría ──────────────────────────────────────
create table if not exists public.audit_log (
  id            bigint generated always as identity primary key,
  msg_id        bigint      not null unique,          -- id del mensaje en la cola (idempotencia)
  evento        text        not null check (evento in ('Acceso', 'Subida', 'Modificación', 'Eliminación', 'Seguridad')),
  accion        text        not null,
  user_id       uuid,
  user_email    text,
  documento_id  uuid,
  ip            text,
  metadata      jsonb       not null default '{}'::jsonb,
  ocurrido_en   timestamptz not null,                 -- cuándo pasó (lo pone el productor)
  registrado_en timestamptz not null default now()    -- cuándo lo procesó el consumidor
);

create index if not exists audit_log_ocurrido_en_idx on public.audit_log (ocurrido_en desc);
create index if not exists audit_log_evento_idx      on public.audit_log (evento);
create index if not exists audit_log_user_id_idx     on public.audit_log (user_id);

-- RLS sin políticas: solo service_role (microservicio auditoria) lee y escribe
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;

-- ── 4. Inmutabilidad: nadie puede modificar ni borrar registros ─
create or replace function public.audit_log_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log es inmutable: % no está permitido', tg_op;
end;
$$;

drop trigger if exists audit_log_no_update_delete on public.audit_log;
create trigger audit_log_no_update_delete
  before update or delete on public.audit_log
  for each row execute function public.audit_log_inmutable();

drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement execute function public.audit_log_inmutable();
