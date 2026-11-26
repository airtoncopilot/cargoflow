-- Company names for the issuing CNPJ found in the NF-e key (positions 7-20).
create table public.empresa (
  cnpj varchar(14) primary key,
  nome varchar not null
);

alter table public.empresa enable row level security;
create policy empresa_select_app_users on public.empresa for select to authenticated using ((select public.is_app_user()));
revoke all on public.empresa from anon;
