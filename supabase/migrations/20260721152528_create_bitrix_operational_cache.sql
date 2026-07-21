create table if not exists public.bitrix_deals (
  id text primary key,
  title text not null default '',
  assigned_by_id text not null default '',
  assigned_by_name text not null default '',
  equipe text not null default '',
  diretoria text not null default '',
  stage_id text not null default '',
  category_id text not null default '',
  date_create timestamptz,
  date_modify timestamptz,
  date_arrived timestamptz not null,
  date_last_movement timestamptz,
  modified_by_id text not null default '',
  modified_by_name text not null default '',
  source_id text not null default '',
  roleta text not null default '',
  synced_at timestamptz not null default now()
);

create index if not exists bitrix_deals_arrived_category_idx
  on public.bitrix_deals (date_arrived, category_id);
create index if not exists bitrix_deals_assigned_arrived_idx
  on public.bitrix_deals (assigned_by_id, date_arrived);
create index if not exists bitrix_deals_roleta_arrived_idx
  on public.bitrix_deals (roleta, date_arrived);
create index if not exists bitrix_deals_modified_idx
  on public.bitrix_deals (date_modify);

create table if not exists public.bitrix_sync_snapshots (
  key text primary key,
  payload jsonb not null,
  synced_at timestamptz not null default now()
);

create table if not exists public.bitrix_sync_state (
  id text primary key,
  status text not null default 'idle'
    check (status in ('idle', 'running', 'success', 'error')),
  lock_owner uuid,
  lock_until timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  coverage_start date,
  last_error text,
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.bitrix_sync_state (id)
values ('main')
on conflict (id) do nothing;

alter table public.bitrix_deals enable row level security;
alter table public.bitrix_sync_snapshots enable row level security;
alter table public.bitrix_sync_state enable row level security;

revoke all on public.bitrix_deals from anon, authenticated;
revoke all on public.bitrix_sync_snapshots from anon, authenticated;
revoke all on public.bitrix_sync_state from anon, authenticated;
grant select, insert, update, delete on public.bitrix_deals to service_role;
grant select, insert, update, delete on public.bitrix_sync_snapshots to service_role;
grant select, insert, update, delete on public.bitrix_sync_state to service_role;

create or replace function public.claim_bitrix_sync(
  p_owner uuid,
  p_lock_seconds integer default 1500
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer := 0;
begin
  update public.bitrix_sync_state
  set
    status = 'running',
    lock_owner = p_owner,
    lock_until = now() + make_interval(secs => greatest(p_lock_seconds, 60)),
    started_at = now(),
    last_error = null,
    updated_at = now()
  where id = 'main'
    and (lock_until is null or lock_until < now() or lock_owner = p_owner);

  get diagnostics affected_rows = row_count;
  return affected_rows > 0;
end;
$$;

create or replace function public.finish_bitrix_sync(
  p_owner uuid,
  p_success boolean,
  p_coverage_start date default null,
  p_details jsonb default '{}'::jsonb,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer := 0;
begin
  update public.bitrix_sync_state
  set
    status = case when p_success then 'success' else 'error' end,
    lock_owner = null,
    lock_until = null,
    completed_at = case when p_success then now() else completed_at end,
    coverage_start = coalesce(p_coverage_start, coverage_start),
    last_error = case when p_success then null else left(coalesce(p_error, 'Erro desconhecido'), 4000) end,
    details = coalesce(p_details, '{}'::jsonb),
    updated_at = now()
  where id = 'main' and lock_owner = p_owner;

  get diagnostics affected_rows = row_count;
  return affected_rows > 0;
end;
$$;

revoke all on function public.claim_bitrix_sync(uuid, integer) from public, anon, authenticated;
revoke all on function public.finish_bitrix_sync(uuid, boolean, date, jsonb, text) from public, anon, authenticated;
grant execute on function public.claim_bitrix_sync(uuid, integer) to service_role;
grant execute on function public.finish_bitrix_sync(uuid, boolean, date, jsonb, text) to service_role;

comment on table public.bitrix_deals is
  'Espelho operacional do Bitrix usado exclusivamente pelas APIs server-side do dashboard.';
comment on table public.bitrix_sync_snapshots is
  'Snapshots JSON de estrutura, fases, fontes, roletas e vínculos sincronizados do Bitrix.';
