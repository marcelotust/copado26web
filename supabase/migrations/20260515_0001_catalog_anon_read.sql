-- Allow anonymous (unauthenticated) visitors to read the static catalog tables.
-- Required for the guest album mode (issue #67): visitors browse an empty album
-- before signing up, so the anon key must be able to read teams + stickers_catalog.
-- user_stickers remains authenticated-only (personal data).

create policy "teams: anon read"
  on public.teams for select to anon using (true);

create policy "catalog: anon read"
  on public.stickers_catalog for select to anon using (true);
