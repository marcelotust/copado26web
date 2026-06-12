-- ============================================================================
-- Ranking: show all users + order completed users by completion date (issue)
--
-- Changes:
--   - Removes LIMIT 20 so the full ranked list is returned.
--   - Adds last_sticker_at as tiebreaker: among users with the same owned_count
--     (especially 100%), the one who completed earlier ranks higher.
--   - Adds completed_at field (non-null only for 100%-completion users).
--
-- Rollback: re-apply get_public_ranking from 20260602_0002_ranking_avatar_palette.sql
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
    select
      user_id,
      count(*) as owned_count,
      max(updated_at) as last_sticker_at
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
      o.last_sticker_at,
      -- For users with identical owned_count, resolve ties by who collected last;
      -- among 100%-complete users this becomes the completion date ordering.
      rank() over (
        order by
          coalesce(o.owned_count, 0) desc,
          coalesce(o.last_sticker_at, 'infinity'::timestamptz) asc
      ) as rank
    from public.profiles p
    left join owned o on o.user_id = p.user_id
    where p.ranking_public = true
      and (p.is_test_user is null or p.is_test_user = false)
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
        'rank',              rank,
        'completed_at',      case when owned_count = v_total then last_sticker_at else null end
      ) order by rank
    ),
    '[]'::jsonb
  )
  into v_result
  from ranked;

  return v_result;
end;
$$;

revoke all on function public.get_public_ranking() from public;
grant execute on function public.get_public_ranking() to authenticated;
