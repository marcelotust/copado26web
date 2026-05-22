-- Slice 4 + 5: get_friend_profile + suggest_trades RPCs.
-- Both are SECURITY DEFINER and validate friendship + visibility before
-- touching user_stickers (which keeps its strict per-user RLS).

-- ============================================================================
-- RPC: get_friend_profile
-- Returns a friend's profile + their sticker collection (if visibility allows).
-- Validates: caller is authenticated, target has a profile, friendship exists
-- OR target visibility = 'public'.
-- ============================================================================
create or replace function public.get_friend_profile(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller  uuid := auth.uid();
  v_profile public.profiles;
  v_stickers jsonb;
  v_progress jsonb;
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  select * into v_profile
  from public.profiles where user_id = p_user_id;

  if not found then
    raise exception 'not_found' using hint = 'User has no profile';
  end if;

  -- Access check
  if v_profile.collection_visibility = 'private' then
    -- Return profile only, no stickers
    return jsonb_build_object(
      'user_id',                p_user_id,
      'nickname',               v_profile.nickname,
      'display_name',           v_profile.display_name,
      'avatar_url',             v_profile.avatar_url,
      'collection_visibility',  'private',
      'stickers',               null,
      'progress',               null
    );
  end if;

  if v_profile.collection_visibility = 'friends'
    and not public._are_friends(v_caller, p_user_id)
    and v_caller <> p_user_id
  then
    return jsonb_build_object(
      'user_id',               p_user_id,
      'nickname',              v_profile.nickname,
      'display_name',          v_profile.display_name,
      'avatar_url',            v_profile.avatar_url,
      'collection_visibility', 'friends',
      'stickers',              null,
      'progress',              null
    );
  end if;

  -- Load stickers
  select jsonb_object_agg(sticker_id, quantity)
  into v_stickers
  from public.user_stickers
  where user_id = p_user_id and quantity > 0;

  -- Progress stats
  select jsonb_build_object(
    'collected', count(*) filter (where quantity > 0),
    'total',     (select count(*) from public.stickers_catalog)
  )
  into v_progress
  from public.user_stickers
  where user_id = p_user_id;

  return jsonb_build_object(
    'user_id',               p_user_id,
    'nickname',              v_profile.nickname,
    'display_name',          v_profile.display_name,
    'avatar_url',            v_profile.avatar_url,
    'collection_visibility', v_profile.collection_visibility,
    'stickers',              coalesce(v_stickers, '{}'::jsonb),
    'progress',              v_progress
  );
end;
$$;

revoke all on function public.get_friend_profile(uuid) from public;
grant execute on function public.get_friend_profile(uuid) to authenticated;

-- ============================================================================
-- RPC: suggest_trades
-- Returns sticker IDs for a mutual trade between caller and a friend.
--   they_have_i_need: friend has quantity >= 2 AND caller has quantity = 0
--   i_have_they_need: caller has quantity >= 2 AND friend has quantity = 0
-- Validates friendship + friend's visibility before touching user_stickers.
-- ============================================================================
create or replace function public.suggest_trades(p_friend_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller   uuid := auth.uid();
  v_profile  public.profiles;
  v_they_have_i_need text[];
  v_i_have_they_need text[];
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  if not public._are_friends(v_caller, p_friend_user_id) then
    return jsonb_build_object(
      'ok',              false,
      'reason',          'not_friends',
      'they_have_i_need', '[]'::jsonb,
      'i_have_they_need', '[]'::jsonb
    );
  end if;

  select * into v_profile
  from public.profiles where user_id = p_friend_user_id;

  if not found or v_profile.collection_visibility = 'private' then
    return jsonb_build_object(
      'ok',              false,
      'reason',          'collection_private',
      'they_have_i_need', '[]'::jsonb,
      'i_have_they_need', '[]'::jsonb
    );
  end if;

  -- Stickers friend has as duplicate (qty >= 2) that caller doesn't have (qty = 0 / no row)
  select array_agg(friend.sticker_id)
  into v_they_have_i_need
  from public.user_stickers friend
  left join public.user_stickers me
    on me.user_id = v_caller and me.sticker_id = friend.sticker_id
  where friend.user_id = p_friend_user_id
    and friend.quantity >= 2
    and (me.quantity is null or me.quantity = 0);

  -- Stickers caller has as duplicate (qty >= 2) that friend doesn't have (qty = 0 / no row)
  select array_agg(me.sticker_id)
  into v_i_have_they_need
  from public.user_stickers me
  left join public.user_stickers friend
    on friend.user_id = p_friend_user_id and friend.sticker_id = me.sticker_id
  where me.user_id = v_caller
    and me.quantity >= 2
    and (friend.quantity is null or friend.quantity = 0);

  return jsonb_build_object(
    'ok',               true,
    'reason',           null,
    'they_have_i_need', coalesce(to_jsonb(v_they_have_i_need), '[]'::jsonb),
    'i_have_they_need', coalesce(to_jsonb(v_i_have_they_need), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.suggest_trades(uuid) from public;
grant execute on function public.suggest_trades(uuid) to authenticated;
