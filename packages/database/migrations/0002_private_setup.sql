-- Phase 1: safe private company bootstrap and administrator team creation.
-- No public sign-up endpoint. Provision the initial owner through Supabase Auth admin tools.
create or replace function public.create_private_company(company_name text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if length(trim(company_name)) < 2 or length(trim(company_name)) > 120 then raise exception 'Invalid company name'; end if;
  if exists(select 1 from public.memberships where user_id=(select auth.uid())) then
    raise exception 'Already a company member';
  end if;
  insert into public.companies(name) values(trim(company_name)) returning id into new_id;
  insert into public.memberships(company_id,user_id,role) values(new_id,(select auth.uid()),'owner');
  insert into public.company_plans(company_id,plan_code,billing_enabled) values(new_id,'private',false);
  return new_id;
end;
$$;
revoke all on function public.create_private_company(text) from public;
grant execute on function public.create_private_company(text) to authenticated;

create policy teams_admin_insert on public.teams for insert to authenticated
with check (public.is_admin(company_id));
create policy teams_admin_update on public.teams for update to authenticated
using (public.is_admin(company_id)) with check (public.is_admin(company_id));
create policy teams_admin_delete on public.teams for delete to authenticated
using (public.is_admin(company_id));
-- Membership writes are service-role only; team membership and chat writes remain disabled
-- until membership-checked endpoints and test coverage are implemented.
