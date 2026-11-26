-- Only users linked in public.usuario (by auth_id) count as app users.
create function public.is_app_user() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.usuario where auth_id = auth.uid()) $$;
revoke execute on function public.is_app_user() from public, anon;
grant execute on function public.is_app_user() to authenticated;

-- usuario: no public access; app users read codigo/login/auth_id only (never senha).
drop policy dev_select_usuario on public.usuario;
drop policy dev_insert_usuario on public.usuario;
create policy usuario_select_app_users on public.usuario for select to authenticated using ((select public.is_app_user()));
revoke all on public.usuario from anon, authenticated;
grant select (codigo, login, auth_id) on public.usuario to authenticated;

-- nota / endereco: authenticated is not enough, must be an app user.
alter policy nota_select_all_authenticated on public.nota using ((select public.is_app_user()));
alter policy nota_insert_all_authenticated on public.nota with check ((select public.is_app_user()));
alter policy nota_update_all_authenticated on public.nota using ((select public.is_app_user())) with check ((select public.is_app_user()));
alter policy nota_delete_all_authenticated on public.nota using ((select public.is_app_user()));
alter policy endereco_select_all_authenticated on public.endereco using ((select public.is_app_user()));
alter policy endereco_insert_all_authenticated on public.endereco with check ((select public.is_app_user()));
alter policy endereco_update_all_authenticated on public.endereco using ((select public.is_app_user())) with check ((select public.is_app_user()));
alter policy endereco_delete_all_authenticated on public.endereco using ((select public.is_app_user()));

-- romaneios: replace public dev policies.
drop policy dev_select_romaneio on public.romaneios;
drop policy dev_insert_romaneio on public.romaneios;
create policy romaneios_select_app_users on public.romaneios for select to authenticated using ((select public.is_app_user()));
create policy romaneios_insert_app_users on public.romaneios for insert to authenticated with check ((select public.is_app_user()));
