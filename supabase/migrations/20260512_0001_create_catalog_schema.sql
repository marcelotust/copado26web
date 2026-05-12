-- Album catalog schema for Panini WC 2026.
-- Splits static catalog (teams, stickers_catalog) from per-user state (user_stickers).
-- Old public.stickers table is left untouched; it is dropped in a later migration
-- after the client switches over.

-- ============================================================================
-- TEAMS  (48 nations + virtual sections WAP / FWC / CC)
-- ============================================================================
create table public.teams (
  code         text        primary key,                  -- 'BRA', 'WAP', 'FWC', 'CC'
  name_key     text        not null,                     -- i18n key, e.g. 'teams.BRA'
  flag         text        not null,
  conf         text        not null,                     -- CONMEBOL, UEFA, CAF, AFC, CONCACAF, OFC, WAP, FWC, CC
  group_letter text,                                     -- 'A'..'L' or null for virtual sections
  sort_order   int         not null unique
);

-- ============================================================================
-- STICKERS_CATALOG  (994 rows, immutable reference data)
-- ============================================================================
create table public.stickers_catalog (
  id          text    primary key,                       -- 'BRA-02', 'WAP-00', 'FWC-09', 'CC-01'
  team_code   text    not null references public.teams(code) on delete restrict,
  number      int     not null,                          -- sticker number within the team
  player_name text,                                      -- nullable: crest / team photo / non-player
  is_special  boolean not null default false,            -- crest, team photo, foil
  sort_order  int     not null
);
create index stickers_catalog_team_number_idx on public.stickers_catalog(team_code, number);
create index stickers_catalog_sort_idx        on public.stickers_catalog(sort_order);

-- ============================================================================
-- USER_STICKERS  (sparse: row exists only when user has ever owned the sticker)
-- ============================================================================
create table public.user_stickers (
  user_id    uuid not null references auth.users(id) on delete cascade,
  sticker_id text not null references public.stickers_catalog(id) on delete cascade,
  quantity   int  not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, sticker_id)
);
create index user_stickers_user_qty_idx on public.user_stickers(user_id) where quantity > 0;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.teams             enable row level security;
alter table public.stickers_catalog  enable row level security;
alter table public.user_stickers     enable row level security;

create policy "teams: authenticated read"
  on public.teams for select to authenticated using (true);

create policy "catalog: authenticated read"
  on public.stickers_catalog for select to authenticated using (true);

create policy "user_stickers: select own"
  on public.user_stickers for select to authenticated using (auth.uid() = user_id);

create policy "user_stickers: insert own"
  on public.user_stickers for insert to authenticated with check (auth.uid() = user_id);

create policy "user_stickers: update own"
  on public.user_stickers for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_stickers: delete own"
  on public.user_stickers for delete to authenticated using (auth.uid() = user_id);

-- ============================================================================
-- ATOMIC INCREMENT/DECREMENT RPC
-- Upserts the user_stickers row and applies p_delta atomically.
-- Clamps quantity at 0 (no negative counts).
-- ============================================================================
create or replace function public.adjust_sticker(p_sticker_id text, p_delta int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_qty  int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

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
