-- Exercise catalog for Stretchi.
-- Run this once in the Supabase SQL editor.
-- The service role bypasses RLS. No anon policies are created.

create table public.body_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  wger_muscle_id integer unique
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  wger_equipment_id integer unique
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  wger_id integer unique,
  wger_uuid uuid unique,
  slug text not null unique,
  name text not null,
  category text,
  steps text,
  setup text,
  dosage text,
  frequency text,
  stop_if text,
  purpose text,
  license_name text,
  license_author text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercise_areas (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  area_id uuid not null references public.body_areas (id) on delete cascade,
  is_primary boolean not null default true,
  primary key (exercise_id, area_id)
);

create table public.exercise_equipment (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  primary key (exercise_id, equipment_id)
);

create index exercise_areas_area_id_idx on public.exercise_areas (area_id);
create index exercise_equipment_equipment_id_idx on public.exercise_equipment (equipment_id);

alter table public.body_areas enable row level security;
alter table public.equipment enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_areas enable row level security;
alter table public.exercise_equipment enable row level security;
