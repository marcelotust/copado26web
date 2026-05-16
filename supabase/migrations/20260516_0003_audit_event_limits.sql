-- Bound client-writeable audit payloads to keep authenticated abuse from growing storage.

create or replace function public.log_audit_event(
  p_action text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_action text := trim(coalesce(p_action, ''));
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_recent_events int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if length(v_action) = 0 then
    raise exception 'action required';
  end if;

  if length(v_action) > 64 then
    raise exception 'action too long';
  end if;

  if octet_length(v_metadata::text) > 4096 then
    raise exception 'metadata too large';
  end if;

  select count(*)
    into v_recent_events
    from public.audit_events
   where user_id = v_user
     and created_at > now() - interval '1 minute';

  if v_recent_events >= 60 then
    raise exception 'audit event rate limit exceeded';
  end if;

  insert into public.audit_events (user_id, action, metadata)
  values (v_user, v_action, v_metadata);
end;
$$;

revoke all on function public.log_audit_event(text, jsonb) from public;
grant execute on function public.log_audit_event(text, jsonb) to authenticated;
