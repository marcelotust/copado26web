-- supabase/migrations/20260720_0001_trade_partners_limit_100.sql
-- Raises the default result limit of get_best_trade_partners() from 20 to 100.
-- Body is identical to 20260531_0002_ranking_and_trading_rpcs.sql except for the
-- p_limit default. Recreated in full so the SECURITY DEFINER function stays intact.

create or replace function public.get_best_trade_partners(p_limit int default 100)
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
