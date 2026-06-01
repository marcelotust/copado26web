-- supabase/migrations/20260531_0002_ranking_and_trading_rpcs.sql
-- Adds get_public_ranking(), get_my_rank(), and get_best_trade_partners() RPCs.

-- ============================================================================
-- RPC: get_public_ranking
-- Returns JSONB array of top 20 users by owned sticker count.
-- Excludes is_test_user and users with ranking_public = false.
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
        'user_id',        user_id,
        'nickname',       nickname,
        'display_name',   display_name,
        'avatar_url',     avatar_url,
        'owned_count',    owned_count,
        'completion_pct', completion_pct,
        'rank',           rank
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

-- ============================================================================
-- RPC: get_my_rank
-- Returns the caller's position among all ranking_public = true users.
-- Returns NULL if caller has ranking_public = false.
-- ============================================================================
create or replace function public.get_my_rank()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user  uuid := auth.uid();
  v_opted boolean;
  v_total bigint;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select ranking_public into v_opted
  from public.profiles where user_id = v_user;

  if not coalesce(v_opted, false) then
    return null;
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
      coalesce(o.owned_count, 0) as owned_count,
      rank() over (order by coalesce(o.owned_count, 0) desc) as rank
    from public.profiles p
    left join owned o on o.user_id = p.user_id
    where p.ranking_public = true
      and (p.is_test_user is null or p.is_test_user = false)
  )
  select jsonb_build_object(
    'rank',           r.rank,
    'owned_count',    r.owned_count,
    'completion_pct', round(r.owned_count::numeric / v_total * 100, 1)
  )
  into v_result
  from ranked r
  where r.user_id = v_user;

  return coalesce(v_result, null);
end;
$$;

revoke all on function public.get_my_rank() from public;
grant execute on function public.get_my_rank() to authenticated;

-- ============================================================================
-- RPC: get_best_trade_partners
-- Returns up to p_limit users ordered by total tradeable stickers (bi-directional).
-- they_have_i_need: partner has qty >= 2 for stickers I need (qty = 0)
-- i_have_they_need: I have qty >= 2 for stickers partner needs (qty = 0)
-- Only users with trading_public = true and is_test_user = false.
-- ============================================================================
create or replace function public.get_best_trade_partners(p_limit int default 20)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user   uuid := auth.uid();
  v_total  bigint;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select count(*) into v_total from public.stickers_catalog;

  with
  eligible as (
    select user_id from public.profiles
    where trading_public = true
      and (is_test_user is null or is_test_user = false)
      and user_id != v_user
  ),
  my_needs as (
    -- catalog stickers where I have qty = 0 (missing)
    select sc.id as sticker_id
    from public.stickers_catalog sc
    left join public.user_stickers ms
      on ms.user_id = v_user and ms.sticker_id = sc.id
    where coalesce(ms.quantity, 0) = 0
  ),
  my_dupes as (
    -- stickers where I have qty >= 2
    select sticker_id
    from public.user_stickers
    where user_id = v_user and quantity >= 2
  ),
  they_can_give as (
    -- for each eligible partner, count how many of my needs they can cover
    select us.user_id, count(*) as they_have_i_need
    from public.user_stickers us
    join my_needs mn on mn.sticker_id = us.sticker_id
    join eligible e on e.user_id = us.user_id
    where us.quantity >= 2
    group by us.user_id
  ),
  i_can_give as (
    -- for each eligible partner, count how many of my dupes they don't have
    select e.user_id, count(*) as i_have_they_need
    from eligible e
    cross join my_dupes md
    left join public.user_stickers us
      on us.user_id = e.user_id and us.sticker_id = md.sticker_id
    where coalesce(us.quantity, 0) = 0
    group by e.user_id
  ),
  scores as (
    select
      e.user_id,
      coalesce(tg.they_have_i_need, 0) as they_have_i_need,
      coalesce(ig.i_have_they_need, 0) as i_have_they_need
    from eligible e
    left join they_can_give tg on tg.user_id = e.user_id
    left join i_can_give    ig on ig.user_id = e.user_id
    where coalesce(tg.they_have_i_need, 0) + coalesce(ig.i_have_they_need, 0) > 0
    order by (coalesce(tg.they_have_i_need, 0) + coalesce(ig.i_have_they_need, 0)) desc
    limit p_limit
  ),
  owned as (
    select user_id, count(*) as owned_count
    from public.user_stickers where quantity >= 1
    group by user_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id',          p.user_id,
        'nickname',         p.nickname::text,
        'display_name',     p.display_name,
        'avatar_url',       p.avatar_url,
        'completion_pct',   round(coalesce(o.owned_count, 0)::numeric / v_total * 100, 1),
        'they_have_i_need', s.they_have_i_need,
        'i_have_they_need', s.i_have_they_need
      ) order by (s.they_have_i_need + s.i_have_they_need) desc
    ),
    '[]'::jsonb
  )
  into v_result
  from scores s
  join public.profiles p on p.user_id = s.user_id
  left join owned o on o.user_id = p.user_id;

  return v_result;
end;
$$;

revoke all on function public.get_best_trade_partners(int) from public;
grant execute on function public.get_best_trade_partners(int) to authenticated;
