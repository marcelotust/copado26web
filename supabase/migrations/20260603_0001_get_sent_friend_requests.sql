-- ============================================================================
-- get_sent_friend_requests (issue #248)
--
-- Returns pending outgoing friend requests sent by the caller.
-- Used by the ranking page to show persistent pending state.
--
-- Rollback: drop function public.get_sent_friend_requests();
-- ============================================================================

create or replace function public.get_sent_friend_requests()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'to_user',    r.to_user,
          'created_at', r.created_at
        )
        order by r.created_at desc
      )
      from public.friend_requests r
      where r.from_user = v_caller
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.get_sent_friend_requests() from public;
grant execute on function public.get_sent_friend_requests() to authenticated;
