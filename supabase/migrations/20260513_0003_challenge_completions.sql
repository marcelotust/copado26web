-- Tracks which users have completed each challenge.
-- Used to compute global completion rates for the "Top 5 rarest" dashboard widget.

create table if not exists public.user_challenge_completions (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  challenge_id text        not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

alter table public.user_challenge_completions enable row level security;

-- All authenticated users can read (needed for global aggregation)
create policy "challenge_completions_select"
  on public.user_challenge_completions
  for select
  using (auth.role() = 'authenticated');

-- Users can only insert/delete their own rows
create policy "challenge_completions_insert"
  on public.user_challenge_completions
  for insert
  with check (auth.uid() = user_id);

create policy "challenge_completions_delete"
  on public.user_challenge_completions
  for delete
  using (auth.uid() = user_id);

-- View: completion count and % per challenge (among users who have any completion)
create or replace view public.challenge_completion_rates as
with totals as (
  select count(distinct user_id) as total_users
  from public.user_challenge_completions
)
select
  c.challenge_id,
  count(distinct c.user_id)                                            as completions,
  case
    when t.total_users > 0
    then round(count(distinct c.user_id)::numeric / t.total_users * 100)::int
    else 0
  end                                                                  as completion_pct
from public.user_challenge_completions c
cross join totals t
group by c.challenge_id, t.total_users;
