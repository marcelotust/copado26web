-- supabase/migrations/20260601_0003_trade_partner_detail.sql
-- Returns the actual sticker ID lists for a specific trade partner.
-- Similar to suggest_trades but requires trading_public = true instead of friendship.

create or replace function public.get_trade_partner_detail(p_partner_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller             uuid := auth.uid();
  v_they_have_i_need   text[];
  v_i_have_they_need   text[];
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;

  -- Partner must have trading_public = true and not be a test user
  if not exists (
    select 1 from public.profiles
    where user_id = p_partner_id
      and trading_public = true
      and (is_test_user is null or is_test_user = false)
  ) then
    raise exception 'partner_not_eligible';
  end if;

  -- Stickers partner has qty >= 2 that I have qty = 0 (they have, I need)
  select array_agg(partner.sticker_id order by partner.sticker_id)
  into v_they_have_i_need
  from public.user_stickers partner
  left join public.user_stickers me
    on me.user_id = v_caller and me.sticker_id = partner.sticker_id
  where partner.user_id = p_partner_id
    and partner.quantity >= 2
    and (me.quantity is null or me.quantity = 0);

  -- Stickers I have qty >= 2 that partner has qty = 0 (I have, they need)
  select array_agg(me.sticker_id order by me.sticker_id)
  into v_i_have_they_need
  from public.user_stickers me
  left join public.user_stickers partner
    on partner.user_id = p_partner_id and partner.sticker_id = me.sticker_id
  where me.user_id = v_caller
    and me.quantity >= 2
    and (partner.quantity is null or partner.quantity = 0);

  return jsonb_build_object(
    'they_have_i_need', coalesce(to_jsonb(v_they_have_i_need), '[]'::jsonb),
    'i_have_they_need', coalesce(to_jsonb(v_i_have_they_need), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_trade_partner_detail(uuid) from public;
grant execute on function public.get_trade_partner_detail(uuid) to authenticated;
