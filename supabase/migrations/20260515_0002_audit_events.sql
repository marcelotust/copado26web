-- Audit trail for sensitive user actions (LGPD / security).
-- Metadata must stay free of PII (no email, free text, tokens).

create table public.audit_events (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete set null,
  action     text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_user_created_idx
  on public.audit_events (user_id, created_at desc);

create index audit_events_action_created_idx
  on public.audit_events (action, created_at desc);

alter table public.audit_events enable row level security;

-- Users may read their own audit history (optional transparency)
create policy "audit_events_select_own"
  on public.audit_events
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Inserts only via security definer functions below

create or replace function public.log_audit_event(
  p_action text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if p_action is null or length(trim(p_action)) = 0 then
    raise exception 'action required';
  end if;

  insert into public.audit_events (user_id, action, metadata)
  values (v_user, trim(p_action), coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.log_audit_event(text, jsonb) from public;
grant execute on function public.log_audit_event(text, jsonb) to authenticated;

-- Reset album: clear quantities + audit (replaces direct client delete)
create or replace function public.reset_my_album()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_deleted int;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  delete from public.user_stickers where user_id = v_user;
  get diagnostics v_deleted = row_count;

  insert into public.audit_events (user_id, action, metadata)
  values (v_user, 'album_reset', jsonb_build_object('rows_deleted', v_deleted));
end;
$$;

revoke all on function public.reset_my_album() from public;
grant execute on function public.reset_my_album() to authenticated;
