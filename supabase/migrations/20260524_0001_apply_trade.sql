-- ============================================================================
-- APPLY_TRADE — atomic batch trade reconciliation
-- After an in-person trade, register everything at once: +1 for each sticker
-- received, -1 for each sticker given away. Writes ONLY the caller's own
-- user_stickers rows. Clamps at 0 (reuses adjust_sticker semantics). The whole
-- function runs in a single transaction, so it is all-or-nothing.
--
-- Net delta is aggregated per sticker (a sticker appearing N times in a list
-- counts N), unknown sticker ids are ignored (join against the catalog), and
-- zero-net stickers are skipped. Returns the resulting quantities so the client
-- can reconcile its optimistic state.
-- ============================================================================
create or replace function public.apply_trade(p_received text[], p_given text[])
returns table(out_sticker_id text, out_quantity int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  r record;
begin
  if v_user is null then
    raise exception 'not authenticated';
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
