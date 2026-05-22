-- Slice 2 + 3: friend_requests, friendships tables + lifecycle + discovery RPCs.
-- Canonical friendship: user_a < user_b (UUID ordering). initiated_by tracks sender.
-- Rate limit: 30 friend requests per hour per user (server-side, no extra table).

-- ============================================================================
-- FRIEND REQUESTS
-- ============================================================================
create table public.friend_requests (
  id          uuid        primary key default gen_random_uuid(),
  from_user   uuid        not null references auth.users(id) on delete cascade,
  to_user     uuid        not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (from_user, to_user),
  check (from_user <> to_user)
);

create index friend_requests_to_user_idx   on public.friend_requests(to_user,   created_at desc);
create index friend_requests_from_user_idx on public.friend_requests(from_user, created_at desc);

alter table public.friend_requests enable row level security;

create policy "friend_requests: participant select"
  on public.friend_requests for select to authenticated
  using (auth.uid() in (from_user, to_user));

-- INSERT/DELETE intentionally blocked at table level — done via RPCs only.
create policy "friend_requests: deny direct insert"
  on public.friend_requests for insert to authenticated
  with check (false);

create policy "friend_requests: deny direct delete"
  on public.friend_requests for delete to authenticated
  using (false);

-- ============================================================================
-- FRIENDSHIPS
-- ============================================================================
create table public.friendships (
  user_a       uuid        not null references auth.users(id) on delete cascade,
  user_b       uuid        not null references auth.users(id) on delete cascade,
  initiated_by uuid        not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b),
  check (initiated_by in (user_a, user_b))
);

create index friendships_user_a_idx on public.friendships(user_a, created_at desc);
create index friendships_user_b_idx on public.friendships(user_b, created_at desc);

alter table public.friendships enable row level security;

create policy "friendships: participant select"
  on public.friendships for select to authenticated
  using (auth.uid() in (user_a, user_b));

create policy "friendships: deny direct insert"
  on public.friendships for insert to authenticated
  with check (false);

create policy "friendships: deny direct delete"
  on public.friendships for delete to authenticated
  using (false);

-- ============================================================================
-- HELPER: are_friends(a, b) — internal use by SECURITY DEFINER RPCs
-- ============================================================================
create or replace function public._are_friends(p_a uuid, p_b uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.friendships
    where (user_a = least(p_a, p_b) and user_b = greatest(p_a, p_b))
  );
$$;

-- Internal-only: block direct invocation via PostgREST
revoke all on function public._are_friends(uuid, uuid) from public;

-- ============================================================================
-- HELPER: rate limit check for outgoing friend requests (30/hour)
-- ============================================================================
create or replace function public._check_friend_request_rate(p_user uuid)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.friend_requests
  where from_user = p_user
    and created_at > now() - interval '1 hour';

  if v_count >= 30 then
    raise exception 'rate_limit_exceeded'
      using hint = 'Too many friend requests in the past hour';
  end if;
end;
$$;

-- Internal-only: block direct invocation via PostgREST
revoke all on function public._check_friend_request_rate(uuid) from public;

-- ============================================================================
-- RPC: send_friend_request_by_nickname
-- Sends a friend request by the target's nickname.
-- Reveals whether the target exists (nicknames are public by design).
-- Rate limited: 30/hour per caller.
-- ============================================================================
create or replace function public.send_friend_request_by_nickname(p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
  v_target uuid;
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  -- Resolve nickname to user_id
  select user_id into v_target
  from public.profiles
  where lower(nickname::text) = lower(p_nickname);

  if not found then
    raise exception 'not_found' using hint = 'No user with that nickname';
  end if;

  if v_target = v_caller then
    raise exception 'self_request' using hint = 'Cannot send request to yourself';
  end if;

  -- Already friends?
  if public._are_friends(v_caller, v_target) then
    raise exception 'already_friends';
  end if;

  -- Already sent a request in this direction?
  if exists (select 1 from public.friend_requests where from_user = v_caller and to_user = v_target) then
    raise exception 'request_already_sent';
  end if;

  -- Rate limit
  perform public._check_friend_request_rate(v_caller);

  insert into public.friend_requests(from_user, to_user)
  values (v_caller, v_target);

  return jsonb_build_object('ok', true, 'to_user', v_target);
end;
$$;

revoke all on function public.send_friend_request_by_nickname(text) from public;
grant execute on function public.send_friend_request_by_nickname(text) to authenticated;

-- ============================================================================
-- RPC: send_friend_request_by_email
-- Anti-enumeration: always returns { ok: true } regardless of whether the
-- email maps to an existing account. Applies same rate limit.
-- Known residual risk: rate limit is checked before the email lookup, so a
-- caller who exceeds the limit gets an exception faster than one who does not.
-- This is a minor timing side-channel. Accepted for MVP; mitigate in v1.1 by
-- moving the rate check to after the email lookup and always sleeping a
-- constant interval before returning.
-- ============================================================================
create or replace function public.send_friend_request_by_email(p_email citext)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
  v_target uuid;
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  -- Rate limit always applied even when target not found
  perform public._check_friend_request_rate(v_caller);

  -- Look up target by email (auth.users) without revealing existence
  select id into v_target
  from auth.users
  where lower(email) = lower(p_email::text)
  limit 1;

  -- Silently create request only if account exists + not same user + not friends + no pending
  if found
    and v_target <> v_caller
    and not public._are_friends(v_caller, v_target)
    and not exists (
      select 1 from public.friend_requests
      where from_user = v_caller and to_user = v_target
    )
  then
    insert into public.friend_requests(from_user, to_user)
    values (v_caller, v_target);
  end if;

  -- Always return same response — anti-enumeration
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.send_friend_request_by_email(citext) from public;
grant execute on function public.send_friend_request_by_email(citext) to authenticated;

-- ============================================================================
-- RPC: lookup_by_nickname
-- Public search used by AddFriendDialog nickname tab.
-- Returns limited profile info or null.
-- ============================================================================
create or replace function public.lookup_by_nickname(p_nickname text)
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

  if not found then return null; end if;

  return jsonb_build_object(
    'user_id',      v_row.user_id,
    'nickname',     v_row.nickname,
    'display_name', v_row.display_name,
    'avatar_url',   v_row.avatar_url
  );
end;
$$;

revoke all on function public.lookup_by_nickname(text) from public;
grant execute on function public.lookup_by_nickname(text) to authenticated;

-- ============================================================================
-- RPC: accept_friend_request
-- Accepts a pending request. Inserts into friendships (canonical ordering).
-- Deletes the request row. Records initiated_by = from_user of the request.
-- ============================================================================
create or replace function public.accept_friend_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller  uuid := auth.uid();
  v_req     public.friend_requests;
  v_a       uuid;
  v_b       uuid;
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  select * into v_req
  from public.friend_requests
  where id = p_request_id and to_user = v_caller;

  if not found then
    raise exception 'not_found' using hint = 'Request not found or not addressed to you';
  end if;

  -- Canonical ordering
  v_a := least(v_req.from_user, v_req.to_user);
  v_b := greatest(v_req.from_user, v_req.to_user);

  -- Idempotent — ignore if already friends
  insert into public.friendships(user_a, user_b, initiated_by)
  values (v_a, v_b, v_req.from_user)
  on conflict (user_a, user_b) do nothing;

  -- Clean up request
  delete from public.friend_requests where id = p_request_id;

  return jsonb_build_object(
    'ok',          true,
    'friend_id',   v_req.from_user
  );
end;
$$;

revoke all on function public.accept_friend_request(uuid) from public;
grant execute on function public.accept_friend_request(uuid) to authenticated;

-- ============================================================================
-- RPC: decline_friend_request
-- Silently deletes the request. Does not notify sender.
-- ============================================================================
create or replace function public.decline_friend_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  delete from public.friend_requests
  where id = p_request_id
    and to_user = v_caller;
end;
$$;

revoke all on function public.decline_friend_request(uuid) from public;
grant execute on function public.decline_friend_request(uuid) to authenticated;

-- ============================================================================
-- RPC: remove_friend
-- Removes a friendship symmetrically. Silent — no notification.
-- ============================================================================
create or replace function public.remove_friend(p_other_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  delete from public.friendships
  where user_a = least(v_caller, p_other_user)
    and user_b = greatest(v_caller, p_other_user);
end;
$$;

revoke all on function public.remove_friend(uuid) from public;
grant execute on function public.remove_friend(uuid) to authenticated;

-- ============================================================================
-- RPC: get_my_friends
-- Returns friends list with profile info, ordered by friendship created_at desc.
-- ============================================================================
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
        'avatar_url',            p.avatar_url
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

-- ============================================================================
-- RPC: get_friend_requests
-- Returns incoming pending requests + recently accepted friendships (7d).
-- ============================================================================
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
          'id',         r.id,
          'from_user',  r.from_user,
          'created_at', r.created_at,
          'nickname',   p.nickname,
          'display_name', p.display_name,
          'avatar_url', p.avatar_url
        )
        order by r.created_at desc
      ), '[]'::jsonb)
      from public.friend_requests r
      left join public.profiles p on p.user_id = r.from_user
      where r.to_user = v_caller
    ),
    'recently_accepted', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'friendship_created_at', f.created_at,
          'initiated_by',          f.initiated_by,
          'user_id',               p.user_id,
          'nickname',              p.nickname,
          'display_name',          p.display_name,
          'avatar_url',            p.avatar_url
        )
        order by f.created_at desc
      ), '[]'::jsonb)
      from public.friendships f
      join public.profiles p
        on p.user_id = case
          when f.user_a = v_caller then f.user_b
          else f.user_a
        end
      where v_caller in (f.user_a, f.user_b)
        and f.created_at > now() - interval '7 days'
    )
  );
end;
$$;

revoke all on function public.get_friend_requests() from public;
grant execute on function public.get_friend_requests() to authenticated;
