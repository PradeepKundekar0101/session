-- Safer role parsing when auth.users row is created (invalid metadata won't fail signup)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  assigned_role public.user_role := 'learner';
begin
  if requested_role in ('learner', 'mentor', 'admin') then
    assigned_role := requested_role::public.user_role;
  end if;

  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    assigned_role
  );
  return new;
end;
$$;
