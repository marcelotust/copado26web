-- Drops the legacy public.stickers table that used to hold per-user copies of
-- every catalog row. After the client refactor (#37) nothing reads from or
-- writes to it.
--
-- IMPORTANT: apply this only AFTER the new client (#37) is deployed.
-- Running this against an environment that still has the old client in
-- production will break sticker reads and writes immediately.

drop table if exists public.stickers cascade;
