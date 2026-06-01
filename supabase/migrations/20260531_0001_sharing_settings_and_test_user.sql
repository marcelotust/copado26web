-- supabase/migrations/20260531_0001_sharing_settings_and_test_user.sql
-- Adds sharing preference columns, is_test_user flag, and update_sharing_settings RPC.
-- Also updates get_my_profile() to return the 4 new columns.

-- ============================================================================
-- COLUMNS
-- ============================================================================
ALTER TABLE public.profiles
  ADD COLUMN ranking_public    boolean NOT NULL DEFAULT false,
  ADD COLUMN trading_public    boolean NOT NULL DEFAULT false,
  ADD COLUMN email_trade_optin boolean NOT NULL DEFAULT false,
  ADD COLUMN is_test_user      boolean NOT NULL DEFAULT false;

-- ============================================================================
-- RLS NOTE: is_test_user
-- The existing "profiles: owner select" policy covers SELECT for the row owner.
-- The existing "profiles: owner update" policy is broad (covers the whole row),
-- so we explicitly revoke column-level UPDATE on is_test_user from authenticated.
-- Writes to is_test_user are service_role only (Supabase dashboard or scripts).
-- ============================================================================
REVOKE UPDATE (is_test_user) ON public.profiles FROM authenticated;

-- ============================================================================
-- RPC: update_sharing_settings
-- Updates only the 3 sharing columns. Never touches is_test_user.
-- ============================================================================
create or replace function public.update_sharing_settings(
  p_ranking_public    boolean,
  p_trading_public    boolean,
  p_email_trade_optin boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
  set
    ranking_public    = p_ranking_public,
    trading_public    = p_trading_public,
    email_trade_optin = p_email_trade_optin,
    updated_at        = now()
  where user_id = v_user;
end;
$$;

revoke all on function public.update_sharing_settings(boolean, boolean, boolean) from public;
grant execute on function public.update_sharing_settings(boolean, boolean, boolean) to authenticated;

-- ============================================================================
-- RPC: get_my_profile (replace to include new columns)
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
