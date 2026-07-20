-- Perfis de acesso: visão, esteira e diretorias permitidas

alter table public.profiles
  add column if not exists visao text not null default 'lider'
    check (visao in ('admin', 'diretor', 'lider', 'usuario')),
  add column if not exists esteira text not null default 'TODAS'
    check (esteira in ('TODAS', 'GERAL', 'ECONOMICO')),
  add column if not exists diretoria_ids text[] not null default '{}';

drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles"
  on public.profiles for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
