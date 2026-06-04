-- Altera o DEFAULT de ranking_public para true, para que novos perfis
-- entrem com compartilhamento no ranking habilitado por padrão.
-- Perfis existentes NÃO são alterados.

ALTER TABLE public.profiles
  ALTER COLUMN ranking_public SET DEFAULT true;

-- Recria set_nickname adicionando ranking_public = true no INSERT de novos
-- perfis. No ON CONFLICT (update de nickname existente), o valor não é
-- sobrescrito — respeita a escolha do usuário.
create or replace function public.set_nickname(
  p_nickname     text,
  p_display_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user         uuid := auth.uid();
  v_old_nickname text;
  v_is_new       boolean;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  if p_nickname !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'invalid_nickname_format'
      using hint = 'Nickname must be 3-20 chars: a-z, 0-9, _';
  end if;

  if public.is_reserved_nickname(p_nickname) then
    raise exception 'reserved_nickname'
      using hint = 'This nickname is reserved';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(nickname::text) = lower(p_nickname)
      and user_id <> v_user
  ) then
    raise exception 'nickname_taken'
      using hint = 'Nickname already in use';
  end if;

  select nickname::text into v_old_nickname
  from public.profiles where user_id = v_user;

  v_is_new := v_old_nickname is null;

  insert into public.profiles(user_id, nickname, display_name, avatar_palette_id, ranking_public, updated_at)
  values (
    v_user,
    lower(p_nickname),
    coalesce(p_display_name, lower(p_nickname)),
    floor(random() * 20 + 1)::smallint,
    true,
    now()
  )
  on conflict (user_id) do update
    set nickname     = lower(p_nickname),
        display_name = coalesce(p_display_name, profiles.display_name),
        updated_at   = now();
  -- avatar_palette_id and ranking_public are NOT overwritten on nickname change

  return jsonb_build_object('ok', true, 'is_new', v_is_new);
end;
$$;

revoke all on function public.set_nickname(text, text) from public;
grant execute on function public.set_nickname(text, text) to authenticated;
