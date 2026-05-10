-- =====================================================================
-- Migración: prevenir duplicados (mismo usuario + misma fecha)
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- 1. Deduplicar entradas existentes: por cada (user_id, fecha) duplicada,
--    conservamos la más reciente (created_at más alto) y borramos las otras
with ranked as (
  select id,
         row_number() over (
           partition by user_id, fecha
           order by created_at desc, id desc
         ) as rn
  from public.hours_entries
)
delete from public.hours_entries
where id in (select id from ranked where rn > 1);

-- 2. Añadir constraint UNIQUE para que la DB rechace duplicados a futuro
alter table public.hours_entries
  drop constraint if exists hours_entries_user_fecha_unique;

alter table public.hours_entries
  add constraint hours_entries_user_fecha_unique
  unique (user_id, fecha);

-- =====================================================================
-- LISTO. Ahora la DB rechaza duplicados a nivel de base de datos,
-- complementando la validación de la app.
-- =====================================================================
