-- Slice 1: profiles table + nickname RPCs
-- Adds user profiles with nickname, display_name, and collection_visibility.

create extension if not exists citext with schema extensions;

-- ============================================================================
-- PROFILES
-- ============================================================================
create table public.profiles (
  user_id               uuid        primary key references auth.users(id) on delete cascade,
  nickname              citext      not null,
  display_name          text        not null default '',
  avatar_url            text,
  collection_visibility text        not null default 'friends'
                        check (collection_visibility in ('public','friends','private')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Case-insensitive unique index (citext handles this, but explicit for clarity)
create unique index profiles_nickname_lower_idx on public.profiles(lower(nickname::text));

alter table public.profiles enable row level security;

create policy "profiles: owner select"
  on public.profiles for select to authenticated
  using (auth.uid() = user_id);

create policy "profiles: owner insert"
  on public.profiles for insert to authenticated
  with check (auth.uid() = user_id);

create policy "profiles: owner update"
  on public.profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- RESERVED NICKNAMES CHECK
-- ============================================================================
create or replace function public.is_reserved_nickname(p_nickname text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select lower(p_nickname) = any(array[
    -- Brand/product
    'panini','fifa','fwc','fwc26','copa','copa26','mundial','worldcup','wc2026',
    'meualbum','meu_album','album','sticker','figurinha',
    -- System
    'admin','administrator','support','suporte','help','ajuda','root','system',
    'api','www','ftp','mail','email','anonymous','anonimo','guest','hidden',
    'null','undefined','none','deleted',
    -- App roles
    'moderator','moderador','mod','bot','official','oficial','staff','equipe',
    'team','owner','dono',
    -- Generic confusable
    'me','you','voce','eu','friend','amigo','user','usuario'
  ]);
$$;

-- ============================================================================
-- RPC: set_nickname
-- Creates or updates the caller's profile nickname.
-- Validates format, reserved list, and uniqueness.
-- Returns { ok, is_new, old_nickname }.
-- ============================================================================
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

  insert into public.profiles(user_id, nickname, display_name, updated_at)
  values (
    v_user,
    lower(p_nickname),
    coalesce(p_display_name, lower(p_nickname)),
    now()
  )
  on conflict (user_id) do update
    set nickname     = lower(p_nickname),
        display_name = coalesce(p_display_name, profiles.display_name),
        updated_at   = now();

  return jsonb_build_object(
    'ok',           true,
    'is_new',       v_is_new,
    'old_nickname', v_old_nickname
  );
end;
$$;

revoke all on function public.set_nickname(text, text) from public;
grant execute on function public.set_nickname(text, text) to authenticated;

-- ============================================================================
-- RPC: get_public_profile
-- Returns limited profile fields (safe for public display). Accessible by anon
-- so /u/:nickname pages work without auth (when visibility=public).
-- ============================================================================
create or replace function public.get_public_profile(p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.profiles;
begin
  select * into v_row
  from public.profiles
  where lower(nickname::text) = lower(p_nickname);

  if not found then
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
-- RPC: get_my_profile
-- Returns the caller's own profile row.
-- ============================================================================
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
    'collection_visibility',  v_row.collection_visibility,
    'created_at',             v_row.created_at,
    'updated_at',             v_row.updated_at
  );
end;
$$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

-- ============================================================================
-- RPC: update_profile_visibility
-- ============================================================================
create or replace function public.update_profile_visibility(p_visibility text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_visibility not in ('public','friends','private') then
    raise exception 'invalid_visibility';
  end if;
  update public.profiles
  set collection_visibility = p_visibility, updated_at = now()
  where user_id = v_user;
end;
$$;

revoke all on function public.update_profile_visibility(text) from public;
grant execute on function public.update_profile_visibility(text) to authenticated;

-- ============================================================================
-- RPC: update_display_name
-- ============================================================================
create or replace function public.update_display_name(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if length(trim(p_display_name)) < 1 or length(p_display_name) > 40 then
    raise exception 'invalid_display_name';
  end if;
  update public.profiles
  set display_name = trim(p_display_name), updated_at = now()
  where user_id = v_user;
end;
$$;

revoke all on function public.update_display_name(text) from public;
grant execute on function public.update_display_name(text) to authenticated;
