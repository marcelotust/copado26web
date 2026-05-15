-- Album reset should also clear challenge completion rows so re-testing and
-- re-earning completions behave consistently with an empty album.

create or replace function public.reset_my_album()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_deleted int;
  v_challenges_deleted int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  delete from public.user_stickers where user_id = v_user;
  get diagnostics v_deleted = row_count;

  delete from public.user_challenge_completions where user_id = v_user;
  get diagnostics v_challenges_deleted = row_count;

  insert into public.audit_events (user_id, action, metadata)
  values (
    v_user,
    'album_reset',
    jsonb_build_object(
      'rows_deleted', v_deleted,
      'challenge_rows_deleted', v_challenges_deleted
    )
  );
end;
$$;
