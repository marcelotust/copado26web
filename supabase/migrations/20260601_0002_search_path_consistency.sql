-- ============================================================================
-- Re-declare apply_trade / adjust_sticker with `search_path = public, pg_temp`
-- to match every other SECURITY DEFINER function in the project. They were
-- shipped in `20260524_0002_trade_input_caps.sql` with `search_path = public`
-- only — flagged by the 2026-06 security re-sweep.
--
-- Bodies and signatures are byte-for-byte identical to the previous version;
-- only the `set search_path` clause changes. Behaviour, grants, security
-- properties and the input caps from #199 are unchanged.
--
-- Rollback: re-apply the original create-or-replace from
-- `20260524_0002_trade_input_caps.sql:14-58` (apply_trade) and
-- `20260524_0002_trade_input_caps.sql:62-96` (adjust_sticker).
-- ============================================================================

create or replace function public.apply_trade(p_received text[], p_given text[])
returns table(out_sticker_id text, out_quantity int)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  r record;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if coalesce(cardinality(p_received), 0) + coalesce(cardinality(p_given), 0) > 2000 then
    raise exception 'trade_too_large';
  end if;

  for r in
    select s.id as sid, sum(s.d)::int as delta
    from (
      select unnest(coalesce(p_received, '{}'::text[])) as id, 1 as d
      union all
      select unnest(coalesce(p_given, '{}'::text[])) as id, -1 as d
    ) s
    join public.stickers_catalog c on c.id = s.id
    group by s.id
    having sum(s.d) <> 0
  loop
    insert into public.user_stickers(user_id, sticker_id, quantity, updated_at)
    values (v_user, r.sid, greatest(0, r.delta), now())
    on conflict (user_id, sticker_id) do update
      set quantity   = greatest(0, public.user_stickers.quantity + r.delta),
          updated_at = now()
    returning public.user_stickers.sticker_id, public.user_stickers.quantity
    into out_sticker_id, out_quantity;
    return next;
  end loop;

  return;
end;
$$;

revoke all on function public.apply_trade(text[], text[]) from public;
grant execute on function public.apply_trade(text[], text[]) to authenticated;

create or replace function public.adjust_sticker(p_sticker_id text, p_delta int)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_qty  int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  p_delta := greatest(-99, least(99, p_delta));

  -- Verify sticker exists in catalog (FK would catch this, but explicit error is friendlier)
  perform 1 from public.stickers_catalog where id = p_sticker_id;
  if not found then
    raise exception 'unknown sticker %', p_sticker_id;
  end if;

  insert into public.user_stickers(user_id, sticker_id, quantity, updated_at)
  values (v_user, p_sticker_id, greatest(0, p_delta), now())
  on conflict (user_id, sticker_id) do update
    set quantity   = greatest(0, public.user_stickers.quantity + p_delta),
        updated_at = now()
  returning quantity into v_qty;

  return v_qty;
end;
$$;

revoke all on function public.adjust_sticker(text, int) from public;
grant execute on function public.adjust_sticker(text, int) to authenticated;
