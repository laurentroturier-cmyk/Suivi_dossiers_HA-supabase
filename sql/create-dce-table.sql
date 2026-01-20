-- =============================================
-- Table DCE (Dossier de Consultation des Entreprises)
-- =============================================

create extension if not exists "uuid-ossp";

create table if not exists public.dce (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  numero_procedure text not null,
  procedure_id text,
  statut text not null default 'brouillon',
  titre_marche text,
  version int not null default 1,
  notes text,
  reglement_consultation jsonb,
  acte_engagement jsonb,
  ccap jsonb,
  cctp jsonb,
  bpu jsonb,
  dqe jsonb,
  dpgf jsonb,
  documents_annexes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, numero_procedure)
);

comment on table public.dce is 'DCE complet, par utilisateur et numéro de procédure';
comment on column public.dce.numero_procedure is 'Numéro court de procédure (5 chiffres)';
comment on column public.dce.user_id is 'Owner du DCE';

-- Trigger de mise à jour updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists dce_set_updated_at on public.dce;
create trigger dce_set_updated_at
before update on public.dce
for each row
execute function public.set_updated_at();

-- =============================================
-- RLS
-- =============================================

alter table public.dce enable row level security;

drop policy if exists "dce_select_own" on public.dce;
create policy "dce_select_own" on public.dce
for select
using (auth.uid() = user_id);

drop policy if exists "dce_insert_own" on public.dce;
create policy "dce_insert_own" on public.dce
for insert
with check (auth.uid() = user_id);

drop policy if exists "dce_update_own" on public.dce;
create policy "dce_update_own" on public.dce
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "dce_delete_own" on public.dce;
create policy "dce_delete_own" on public.dce
for delete
using (auth.uid() = user_id);

-- Optionnel: index pour recherche par numéro
create index if not exists dce_numero_procedure_idx on public.dce (numero_procedure);

-- Optionnel: index sur user_id
create index if not exists dce_user_id_idx on public.dce (user_id);
