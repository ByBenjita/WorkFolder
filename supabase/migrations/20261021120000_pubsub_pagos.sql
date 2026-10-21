-- ════════════════════════════════════════════════════════════════
-- Publish/Subscribe con acknowledge sobre Supabase Queues (pgmq)
--
-- pgmq no trae pub/sub nativo: cada suscriptor tiene su propia cola y
-- public.publicar_evento() copia el evento a todas las colas suscritas al tema.
--
--   facturacion (webhook MP) ──publicar_evento──┬─▶ [facturacion_eventos] ─▶ facturacion ─archive (ack)
--                                               └─▶ [usuarios_eventos]    ─▶ usuarios    ─archive (ack)
--
-- Cada suscriptor confirma (archive) solo lo que procesó bien; lo demás
-- reaparece al vencer el visibility timeout. Requiere la migración de audit_queue.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Una cola por suscriptor ─────────────────────────────────
do $$
begin
  if not exists (select 1 from pgmq.meta where queue_name = 'facturacion_eventos') then
    perform pgmq.create('facturacion_eventos');
  end if;
  if not exists (select 1 from pgmq.meta where queue_name = 'usuarios_eventos') then
    perform pgmq.create('usuarios_eventos');
  end if;
end $$;

-- RLS sin políticas: solo service_role (BYPASSRLS) usa las colas
alter table pgmq.q_facturacion_eventos enable row level security;
alter table pgmq.a_facturacion_eventos enable row level security;
alter table pgmq.q_usuarios_eventos    enable row level security;
alter table pgmq.a_usuarios_eventos    enable row level security;

grant select, insert, update, delete
  on pgmq.q_facturacion_eventos, pgmq.a_facturacion_eventos,
     pgmq.q_usuarios_eventos,    pgmq.a_usuarios_eventos
  to service_role;

-- ── 2. Suscripciones: qué cola recibe cada tema ────────────────
create table if not exists public.event_subscriptions (
  topic      text not null,
  queue_name text not null,
  creado_en  timestamptz not null default now(),
  primary key (topic, queue_name)
);

alter table public.event_subscriptions enable row level security;
revoke all on public.event_subscriptions from anon, authenticated;

insert into public.event_subscriptions (topic, queue_name) values
  ('suscripcion.autorizada', 'facturacion_eventos'),
  ('suscripcion.autorizada', 'usuarios_eventos'),
  ('pago.aprobado',          'facturacion_eventos')
on conflict do nothing;

-- ── 3. Publicar: copia el evento a cada cola suscrita ──────────
-- Todo en una transacción: o llega a todos los suscriptores o a ninguno.
create or replace function public.publicar_evento(p_topic text, p_payload jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  s        record;
  enviados integer := 0;
  mensaje  jsonb := jsonb_build_object(
    'evento_id',    gen_random_uuid(),
    'topic',        p_topic,
    'payload',      coalesce(p_payload, '{}'::jsonb),
    'publicado_en', now()
  );
begin
  for s in select queue_name from public.event_subscriptions where topic = p_topic loop
    perform pgmq.send(s.queue_name, mensaje);
    enviados := enviados + 1;
  end loop;

  if enviados = 0 then
    raise exception 'El tema % no tiene suscriptores', p_topic;
  end if;

  return enviados;
end;
$$;

revoke execute on function public.publicar_evento(text, jsonb) from public, anon, authenticated;
grant  execute on function public.publicar_evento(text, jsonb) to service_role;
