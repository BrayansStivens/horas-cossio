-- =====================================================================
-- Schema para "Horas Cossio" — Supabase
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- 1. Tabla principal de registros de horas extras
create table if not exists public.hours_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  hora_inicio time not null,
  hora_final time not null,
  total_horas numeric(5, 2) not null,
  manifiesto text,
  conductor text not null default 'COSSIO',
  placa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice para acelerar consultas por fecha
create index if not exists hours_entries_user_fecha_idx
  on public.hours_entries (user_id, fecha desc);

-- 2. Row Level Security: cada usuario solo ve/edita lo suyo
alter table public.hours_entries enable row level security;

drop policy if exists "users_select_own" on public.hours_entries;
create policy "users_select_own"
  on public.hours_entries for select
  using (auth.uid() = user_id);

drop policy if exists "users_insert_own" on public.hours_entries;
create policy "users_insert_own"
  on public.hours_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "users_update_own" on public.hours_entries;
create policy "users_update_own"
  on public.hours_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users_delete_own" on public.hours_entries;
create policy "users_delete_own"
  on public.hours_entries for delete
  using (auth.uid() = user_id);

-- 3. Trigger para mantener updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hours_entries_updated_at on public.hours_entries;
create trigger hours_entries_updated_at
  before update on public.hours_entries
  for each row
  execute function public.set_updated_at();

-- =====================================================================
-- LISTO. Ahora crea el usuario:
-- Supabase Dashboard → Authentication → Users → Add user → "Create new user"
--   Email:    cc8039507@horas3tc.local
--   Password: 8039507
--   Auto Confirm User: SÍ (importante, para que no necesite verificar email)
-- =====================================================================
