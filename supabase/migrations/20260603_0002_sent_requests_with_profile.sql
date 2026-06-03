-- ============================================================================
-- get_sent_friend_requests v2 — adiciona dados de perfil do destinatário
--
-- Necessário para exibir nome/avatar dos pedidos enviados na FriendsPage.
-- Rollback: re-aplicar 20260603_0001_get_sent_friend_requests.sql
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
          'to_user',          r.to_user,
          'created_at',       r.created_at,
          'nickname',         p.nickname,
          'display_name',     p.display_name,
          'avatar_url',       p.avatar_url,
          'avatar_palette_id', p.avatar_palette_id
        )
        order by r.created_at desc
      )
      from public.friend_requests r
      left join public.profiles p on p.user_id = r.to_user
      where r.from_user = v_caller
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.get_sent_friend_requests() from public;
grant execute on function public.get_sent_friend_requests() to authenticated;
