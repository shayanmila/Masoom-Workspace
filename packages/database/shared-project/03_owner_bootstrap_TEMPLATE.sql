-- TEMPLATE ONLY. Replace placeholder with ONE explicitly selected Supabase Auth user UUID.
-- Run only after the nine Workspace tables exist and have passed RLS checks.
-- Never paste passwords, service keys or connection URIs here.
begin;
do $$
declare selected_user uuid := '09da25de-ef52-43d4-8a17-a54ecd33d9b4';
declare new_company uuid;
begin
 if selected_user='09da25de-ef52-43d4-8a17-a54ecd33d9b4'::uuid then raise exception 'Replace the placeholder with your approved owner UUID'; end if;
 if not exists(select 1 from auth.users where id=selected_user) then raise exception 'Selected auth user does not exist'; end if;
 if exists(select 1 from masoom_workspace.approved_users where user_id=selected_user)
    or exists(select 1 from masoom_workspace.memberships where user_id=selected_user)
 then raise exception 'Owner already approved or assigned; stop'; end if;
 insert into masoom_workspace.companies(name) values('Masoom Workspace') returning id into new_company;
 insert into masoom_workspace.approved_users(user_id,note) values(selected_user,'Explicit initial owner approval');
 insert into masoom_workspace.memberships(company_id,user_id,role) values(new_company,selected_user,'owner');
 insert into masoom_workspace.company_plans(company_id,plan_code,billing_enabled) values(new_company,'private',false);
end $$;
commit;
