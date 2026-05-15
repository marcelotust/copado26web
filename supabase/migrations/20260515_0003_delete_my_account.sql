-- Self-service account deletion (LGPD). Cascades user_stickers and challenge completions.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.audit_events (user_id, action, metadata)
  values (v_user, 'account_deleted', '{}'::jsonb);

  delete from auth.users where id = v_user;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
