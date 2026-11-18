-- ════════════════════════════════════════════════════════════════
-- Métricas de negocio en tiempo real (Vercel Queues → Supabase)
--
--   usuarios / documentos / facturacion ──POST /api/eventos──▶ reportes ──send──▶ Vercel Queues
--   Vercel Queues ──push──▶ reportes (consumidor) ──insert──▶ public.metricas_evento
--   panel enterprise ──▶ reportes /api/metricas ──rpc──▶ public.metricas_snapshot()
--
-- La cola entrega al menos una vez: dedupe_key (único) hace idempotente al consumidor.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Eventos (sin datos personales: ni IP, ni email, ni nombres de archivo) ──
create table if not exists public.metricas_evento (
  id            bigint generated always as identity primary key,
  dedupe_key    text        not null unique,          -- evento_id, o tipo:clave en pagos (reintentos de MP)
  topico        text        not null check (topico in ('workfolder-actividad', 'workfolder-pagos')),
  tipo          text        not null,                 -- Acceso, Subida, ... | pago.aprobado, suscripcion.autorizada
  categoria     text,                                 -- login_ok, subida, ... (solo actividad)
  origen        text        not null,                 -- microservicio productor
  user_id       text,                                 -- usuario (actividad) o admin (pagos)
  monto         numeric,
  moneda        text,
  plan_id       text,
  ocurrido_en   timestamptz not null,
  registrado_en timestamptz not null default now()
);

create index if not exists metricas_evento_ocurrido_en_idx on public.metricas_evento (ocurrido_en desc);
create index if not exists metricas_evento_topico_tipo_idx on public.metricas_evento (topico, tipo);
create index if not exists metricas_evento_categoria_idx   on public.metricas_evento (categoria);

-- RLS sin políticas: solo service_role (microservicio reportes) lee y escribe
alter table public.metricas_evento enable row level security;
revoke all on public.metricas_evento from anon, authenticated;

-- ── 2. Foto de métricas en una sola llamada ────────────────────
create or replace function public.metricas_snapshot(p_ventana_minutos integer default 30)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with
  e as (select * from public.metricas_evento),
  act as (select * from e where topico = 'workfolder-actividad'),
  pag as (select * from e where topico = 'workfolder-pagos'),
  minutos as (
    select m as minuto
    from generate_series(
      date_trunc('minute', now()) - make_interval(mins => greatest(p_ventana_minutos, 1) - 1),
      date_trunc('minute', now()),
      interval '1 minute'
    ) as m
  ),
  serie as (
    select
      mi.minuto,
      count(*) filter (where ev.topico = 'workfolder-actividad'
                         and ev.tipo <> 'Seguridad' and coalesce(ev.categoria, '') <> 'login_fallido') as actividad,
      count(*) filter (where ev.topico = 'workfolder-actividad'
                         and (ev.tipo = 'Seguridad' or ev.categoria = 'login_fallido'))                as seguridad,
      count(*) filter (where ev.topico = 'workfolder-pagos')                                           as pagos
    from minutos mi
    left join e ev on ev.ocurrido_en >= mi.minuto and ev.ocurrido_en < mi.minuto + interval '1 minute'
    group by mi.minuto
  )
  select jsonb_build_object(
    'generado_en',      now(),
    'total_eventos',    (select count(*) from e),
    'ultimo_evento_en', (select max(ocurrido_en) from e),
    'por_tipo',      coalesce((select jsonb_object_agg(tipo, n)      from (select tipo, count(*) n from e group by tipo) x), '{}'::jsonb),
    'por_categoria', coalesce((select jsonb_object_agg(categoria, n) from (select categoria, count(*) n from act where categoria is not null group by categoria) x), '{}'::jsonb),
    'por_origen',    coalesce((select jsonb_object_agg(origen, n)    from (select origen, count(*) n from e group by origen) x), '{}'::jsonb),
    'kpis', jsonb_build_object(
      'logins_ok',              (select count(*) from act where categoria = 'login_ok'),
      'logins_fallidos',        (select count(*) from act where categoria = 'login_fallido'),
      'subidas',                (select count(*) from act where categoria = 'subida'),
      'descargas',              (select count(*) from act where categoria = 'descarga'),
      'alertas_seguridad_5min', (select count(*) from act where (tipo = 'Seguridad' or categoria = 'login_fallido')
                                                            and ocurrido_en >= now() - interval '5 minutes'),
      'usuarios_activos_15min', (select count(distinct user_id) from act where user_id is not null
                                                                       and ocurrido_en >= now() - interval '15 minutes'),
      'pagos_aprobados',        (select count(*) from pag where tipo = 'pago.aprobado'),
      'suscripciones',          (select count(*) from pag where tipo = 'suscripcion.autorizada'),
      'ingresos', coalesce((
        select jsonb_object_agg(moneda, total)
        from (select coalesce(moneda, 'N/D') moneda, sum(monto) total from pag
              where tipo = 'pago.aprobado' and monto is not null group by 1) x
      ), '{}'::jsonb)
    ),
    'suscripciones_por_plan', coalesce((
      select jsonb_object_agg(plan, n)
      from (select coalesce(plan_id, 'desconocido') plan, count(*) n from pag
            where tipo = 'suscripcion.autorizada' group by 1) x
    ), '{}'::jsonb),
    'serie_por_minuto', (
      select jsonb_agg(jsonb_build_object('minuto', minuto, 'actividad', actividad, 'seguridad', seguridad, 'pagos', pagos) order by minuto)
      from serie
    ),
    'ultimos', coalesce((
      select jsonb_agg(jsonb_build_object('topico', topico, 'tipo', tipo, 'categoria', categoria, 'origen', origen, 'ocurrido_en', ocurrido_en) order by ocurrido_en desc)
      from (select topico, tipo, categoria, origen, ocurrido_en from e order by ocurrido_en desc limit 12) u
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.metricas_snapshot(integer) from public, anon, authenticated;
grant  execute on function public.metricas_snapshot(integer) to service_role;
