-- ============================================================================
-- Ranking: expose avatar_palette_id (issue #245)
--
-- Updates get_public_ranking() to include avatar_palette_id so RankingRow
-- can render the gradient Avatar component.
--
-- Rollback: re-apply get_public_ranking from 20260531_0002_ranking_and_trading_rpcs.sql
-- ============================================================================

create or replace function public.get_public_ranking()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user   uuid := auth.uid();
  v_result jsonb;
  v_total  bigint;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select count(*) into v_total from public.stickers_catalog;

  with owned as (
    select user_id, count(*) as owned_count
    from public.user_stickers
    where quantity >= 1
    group by user_id
  ),
  ranked as (
    select
      p.user_id,
      p.nickname::text as nickname,
      p.display_name,
      p.avatar_url,
      p.avatar_palette_id,
      coalesce(o.owned_count, 0) as owned_count,
      round(coalesce(o.owned_count, 0)::numeric / v_total * 100, 1) as completion_pct,
      rank() over (order by coalesce(o.owned_count, 0) desc) as rank
    from public.profiles p
    left join owned o on o.user_id = p.user_id
    where p.ranking_public = true
      and (p.is_test_user is null or p.is_test_user = false)
  ),
  top20 as (
    select * from ranked limit 20
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id',           user_id,
        'nickname',          nickname,
        'display_name',      display_name,
        'avatar_url',        avatar_url,
        'avatar_palette_id', avatar_palette_id,
        'owned_count',       owned_count,
        'completion_pct',    completion_pct,
        'rank',              rank
      ) order by rank
    ),
    '[]'::jsonb
  )
  into v_result
  from top20;

  return v_result;
end;
$$;

revoke all on function public.get_public_ranking() from public;
grant execute on function public.get_public_ranking() to authenticated;
