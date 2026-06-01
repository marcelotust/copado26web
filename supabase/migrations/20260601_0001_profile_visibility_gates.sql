-- ============================================================================
-- Profile visibility gates (security follow-up to PR #203 sweep, June 2026)
--
-- Background:
--   - `get_public_profile(p_nickname)` is granted to `anon`. Today it returns
--     `user_id`, `display_name`, `avatar_url` for ANY matching nickname
--     regardless of `collection_visibility`. Anyone (including unauthenticated
--     visitors) can enumerate the nickname namespace and harvest user IDs and
--     display names of profiles whose owners chose `friends` or `private`.
--   - `lookup_by_nickname(p_nickname)` is granted to `authenticated` and has
--     the same shape, so any logged-in attacker can do the same.
--
-- Fix:
--   - `get_public_profile`: only return the row when the profile is `public`
--     OR the caller is the owner OR the caller is a friend. Else return null.
--   - `lookup_by_nickname`: still returns a row (the AddFriendDialog send-
--     request flow needs the nickname to exist) but masks `display_name` and
--     `avatar_url` when the caller has no relationship with the target.
--
-- Behaviour unchanged for: callers viewing public profiles, owners viewing
-- themselves, friends viewing each other.
--
-- Rollback: re-apply `create or replace function public.get_public_profile`
-- from `20260521_0001_create_profiles.sql:138-166` and
-- `create or replace function public.lookup_by_nickname` from
-- `20260521_0002_create_friendships.sql:220-245`. Both are idempotent.
-- ============================================================================

create or replace function public.get_public_profile(p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row    public.profiles;
  v_caller uuid := auth.uid();
  v_can_see boolean;
begin
  select * into v_row
  from public.profiles
  where lower(nickname::text) = lower(p_nickname);

  if not found then
    return null;
  end if;

  v_can_see :=
    v_row.collection_visibility = 'public'
    or (v_caller is not null and v_row.user_id = v_caller)
    or (v_caller is not null and public._are_friends(v_caller, v_row.user_id));

  if not v_can_see then
    -- Withhold even existence — do not let anon / strangers enumerate.
    return null;
  end if;

  return jsonb_build_object(
    'user_id',                v_row.user_id,
    'nickname',               v_row.nickname,
    'display_name',           v_row.display_name,
    'avatar_url',             v_row.avatar_url,
    'collection_visibility',  v_row.collection_visibility
  );
end;
$$;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to authenticated, anon;

-- ============================================================================

create or replace function public.lookup_by_nickname(p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row    public.profiles;
  v_caller uuid := auth.uid();
  v_can_see_name boolean;
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;

  select * into v_row
  from public.profiles
  where lower(nickname::text) = lower(p_nickname);

  if not found then
    return null;
  end if;

  v_can_see_name :=
    v_row.collection_visibility = 'public'
    or v_row.user_id = v_caller
    or public._are_friends(v_caller, v_row.user_id);

  -- Always reveal nickname existence + user_id (the AddFriendDialog needs
  -- enough to call send_friend_request_by_nickname). Strangers do NOT see
  -- display_name or avatar_url of `friends` / `private` profiles.
  return jsonb_build_object(
    'user_id',      v_row.user_id,
    'nickname',     v_row.nickname,
    'display_name', case when v_can_see_name then v_row.display_name else null end,
    'avatar_url',   case when v_can_see_name then v_row.avatar_url   else null end
  );
end;
$$;

revoke all on function public.lookup_by_nickname(text) from public;
grant execute on function public.lookup_by_nickname(text) to authenticated;
