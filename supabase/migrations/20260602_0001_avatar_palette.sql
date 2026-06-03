-- ============================================================================
-- Avatar palette (issue #245)
--
-- Adds avatar_palette_id (1-20) to profiles so each user can have a unique
-- gradient avatar. The id is set randomly on first nickname and updateable
-- via a new update_avatar_palette RPC.
--
-- RPCs updated: set_nickname, get_my_profile, get_my_friends,
--               get_friend_requests.
-- New RPC: update_avatar_palette
--
-- Rollback: DROP COLUMN profiles.avatar_palette_id CASCADE;
--           Drop update_avatar_palette function.
--           Re-apply previous versions of the updated RPCs from their
--           original migration files.
-- ============================================================================

-- 1. Column -----------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_palette_id smallint
  check (avatar_palette_id between 1 and 20);

-- 2. RPC: update_avatar_palette --------------------------------------------
create or replace function public.update_avatar_palette(p_palette_id smallint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_palette_id not between 1 and 20 then
    raise exception 'invalid_palette_id' using hint = 'id must be 1-20';
  end if;

  update public.profiles
  set avatar_palette_id = p_palette_id,
      updated_at        = now()
  where user_id = v_user;
end;
$$;

revoke all on function public.update_avatar_palette(smallint) from public;
grant execute on function public.update_avatar_palette(smallint) to authenticated;

-- 3. RPC: set_nickname — assign random palette on first profile creation --
create or replace function public.set_nickname(
  p_nickname     text,
  p_display_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user         uuid := auth.uid();
  v_old_nickname text;
  v_is_new       boolean;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if p_nickname !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'invalid_nickname_format'
      using hint = 'Nickname must be 3-20 chars: a-z, 0-9, _';
  end if;

  if public.is_reserved_nickname(p_nickname) then
    raise exception 'reserved_nickname'
      using hint = 'This nickname is reserved';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(nickname::text) = lower(p_nickname)
      and user_id <> v_user
  ) then
    raise exception 'nickname_taken'
      using hint = 'Nickname already in use';
  end if;

  select nickname::text into v_old_nickname
  from public.profiles where user_id = v_user;

  v_is_new := v_old_nickname is null;

  insert into public.profiles(user_id, nickname, display_name, avatar_palette_id, updated_at)
  values (
    v_user,
    lower(p_nickname),
    coalesce(p_display_name, lower(p_nickname)),
    floor(random() * 20 + 1)::smallint,
    now()
  )
  on conflict (user_id) do update
    set nickname     = lower(p_nickname),
        display_name = coalesce(p_display_name, profiles.display_name),
        updated_at   = now();
  -- avatar_palette_id is NOT overwritten on nickname change

  return jsonb_build_object('ok', true, 'is_new', v_is_new);
end;
$$;

revoke all on function public.set_nickname(text, text) from public;
grant execute on function public.set_nickname(text, text) to authenticated;

-- 4. RPC: get_my_profile — expose avatar_palette_id -----------------------
create or replace function public.get_my_profile()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_row  public.profiles;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select * into v_row
  from public.profiles where user_id = v_user;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'user_id',                v_row.user_id,
    'nickname',               v_row.nickname,
    'display_name',           v_row.display_name,
    'avatar_url',             v_row.avatar_url,
    'avatar_palette_id',      v_row.avatar_palette_id,
    'collection_visibility',  v_row.collection_visibility,
    'ranking_public',         v_row.ranking_public,
    'trading_public',         v_row.trading_public,
    'email_trade_optin',      v_row.email_trade_optin,
    'is_test_user',           v_row.is_test_user,
    'created_at',             v_row.created_at,
    'updated_at',             v_row.updated_at
  );
end;
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

-- 5. RPC: get_my_friends — expose avatar_palette_id -----------------------
create or replace function public.get_my_friends()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  return (
    select jsonb_agg(
      jsonb_build_object(
        'friendship_created_at', f.created_at,
        'initiated_by',          f.initiated_by,
        'user_id',               p.user_id,
        'nickname',              p.nickname,
        'display_name',          p.display_name,
        'avatar_url',            p.avatar_url,
        'avatar_palette_id',     p.avatar_palette_id
      )
      order by f.created_at desc
    )
    from public.friendships f
    join public.profiles p
      on p.user_id = case
        when f.user_a = v_caller then f.user_b
        else f.user_a
      end
    where v_caller in (f.user_a, f.user_b)
  );
end;
$$;

revoke all on function public.get_my_friends() from public;
grant execute on function public.get_my_friends() to authenticated;

-- 6. RPC: get_friend_requests — expose avatar_palette_id ------------------
create or replace function public.get_friend_requests()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  return jsonb_build_object(
    'pending', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id',                r.id,
          'from_user',         r.from_user,
          'created_at',        r.created_at,
          'nickname',          p.nickname,
          'display_name',      p.display_name,
          'avatar_url',        p.avatar_url,
          'avatar_palette_id', p.avatar_palette_id
        )
        order by r.created_at desc
      ), '[]'::jsonb)
      from public.friend_requests r
      left join public.profiles p on p.user_id = r.from_user
      where r.to_user = v_caller
    )
  );
end;
$$;

revoke all on function public.get_friend_requests() from public;
grant execute on function public.get_friend_requests() to authenticated;
