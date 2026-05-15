-- SEC-03: stop cross-user reads on user_challenge_completions.
-- Global stats remain available via challenge_completion_rates (aggregates only, no user_id).

drop policy if exists "challenge_completions_select" on public.user_challenge_completions;

create policy "challenge_completions_select_own"
  on public.user_challenge_completions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- upsert(..., onConflict) updates existing rows for the same user/challenge
create policy "challenge_completions_update_own"
  on public.user_challenge_completions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- View is owned by postgres and reads all rows for aggregation (no user_id exposed).
grant select on public.challenge_completion_rates to authenticated;
