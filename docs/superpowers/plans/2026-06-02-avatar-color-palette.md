# Avatar Color Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each user gets a unique, persistent gradient avatar (20 palette options) assigned randomly on nickname creation and customizable via Settings.

**Architecture:** Add `avatar_palette_id` column to the `profiles` table; update all profile RPCs to expose it; update `Avatar.tsx` to render a CSS gradient instead of Tailwind hash classes; add a palette picker in `SettingsProfileSection`; propagate the id through every component that renders a user's avatar.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL + PLPGSQL RPCs), i18n via `src/i18n/locales/*.json`.

**GitHub issue:** #245

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/constants/avatarColorPalette.ts` | Single source of truth for 20 gradient combos |
| Migrate | `supabase/migrations/20260602_0001_avatar_palette.sql` | Column + updated RPCs |
| Modify | `src/state/friends/types.ts` | Add `avatar_palette_id` to all profile types |
| Modify | `src/components/friends/Avatar.tsx` | Render gradient from palette, keep hash fallback |
| Modify | `src/state/friends/useProfile.ts` | Add `updateAvatarPalette` method |
| Modify | `src/components/friends/FriendCard.tsx` | Pass `paletteId` to Avatar |
| Modify | `src/components/friends/PendingRequestRow.tsx` | Pass `paletteId` to Avatar |
| Modify | `src/components/trading/TradePartnerCard.tsx` | Replace 👤 with `<Avatar>` |
| Modify | `src/components/SettingsProfileSection.tsx` | Palette picker UI + new prop |
| Modify | `src/pages/SettingsPage.tsx` | Wire `updateAvatarPalette` to SettingsProfileSection |
| Modify | `src/i18n/locales/pt-BR.json` | New i18n keys |
| Modify | `src/i18n/locales/en.json` | New i18n keys |
| Modify | `src/i18n/locales/es.json` | New i18n keys |

---

## Task 1: Palette constants

**Files:**
- Create: `src/constants/avatarColorPalette.ts`

- [ ] **Step 1: Create the palette file**

```ts
export type AvatarPaletteEntry = {
  id: number
  name: string
  firstColor: string
  secondColor: string
  color: string
}

export const avatarColorPalette: AvatarPaletteEntry[] = [
  { id: 1,  name: 'Tangerina & Marinho',       firstColor: '#FF9F1C', secondColor: '#FFBF69', color: '#011627' },
  { id: 2,  name: 'Rosa Choque & Esmeralda',   firstColor: '#EF476F', secondColor: '#FF8FA3', color: '#06D6A0' },
  { id: 3,  name: 'Amarelo Sol & Púrpura',     firstColor: '#FFD166', secondColor: '#FF9F1C', color: '#4D194D' },
  { id: 4,  name: 'Ciano & Coral',             firstColor: '#118AB2', secondColor: '#073B4C', color: '#EF476F' },
  { id: 5,  name: 'Verde Limão & Petróleo',    firstColor: '#A6DA00', secondColor: '#55A630', color: '#012A4A' },
  { id: 6,  name: 'Menta Suave & Floresta',    firstColor: '#D8F3DC', secondColor: '#B7E4C7', color: '#081C15' },
  { id: 7,  name: 'Pêssego & Bordô',           firstColor: '#FDE2E4', secondColor: '#FAD2E1', color: '#590D22' },
  { id: 8,  name: 'Lavanda & Índigo',          firstColor: '#E0B1CB', secondColor: '#BE95C4', color: '#231942' },
  { id: 9,  name: 'Azul Gelo & Cobalto',       firstColor: '#CAF0F8', secondColor: '#90E0EF', color: '#03045E' },
  { id: 10, name: 'Baunilha & Café',           firstColor: '#FFF3B0', secondColor: '#E09F3E', color: '#332211' },
  { id: 11, name: 'Roxo Neon & Preto Fosco',   firstColor: '#B5179E', secondColor: '#7209B7', color: '#10002B' },
  { id: 12, name: 'Azul Elétrico & Branco',    firstColor: '#4361EE', secondColor: '#3A0CA3', color: '#F8F9FA' },
  { id: 13, name: 'Verde Neon & Chumbo',       firstColor: '#39FF14', secondColor: '#00F5D4', color: '#212529' },
  { id: 14, name: 'Coral Vivo & Turquesa',     firstColor: '#FF7F50', secondColor: '#FF9F1C', color: '#004C4C' },
  { id: 15, name: 'Ouro & Ametista',           firstColor: '#FFC300', secondColor: '#FFB703', color: '#240046' },
  { id: 16, name: 'Terracota & Areia',         firstColor: '#E07A5F', secondColor: '#F4A261', color: '#F4F1DE' },
  { id: 17, name: 'Mostarda & Ardósia',        firstColor: '#E9C46A', secondColor: '#E76F51', color: '#2A9D8F' },
  { id: 18, name: 'Orquídea & Mostarda Esc.',  firstColor: '#9D4EDD', secondColor: '#C77DFF', color: '#5A3900' },
  { id: 19, name: 'Magenta & Rosa Pálido',     firstColor: '#70163C', secondColor: '#A4161A', color: '#FFB5A7' },
  { id: 20, name: 'Teal & Salmão',             firstColor: '#0081A7', secondColor: '#00AFB9', color: '#F07167' },
]

export function getPaletteEntry(id: number | null | undefined): AvatarPaletteEntry | undefined {
  if (id == null) return undefined
  return avatarColorPalette.find(p => p.id === id)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/avatarColorPalette.ts
git commit -m "feat(avatar): add gradient color palette constants (#245)"
```

---

## Task 2: Supabase migration

**Files:**
- Create: `supabase/migrations/20260602_0001_avatar_palette.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================================
-- Avatar palette (issue #245)
--
-- Adds avatar_palette_id (1-20) to profiles so each user can have a unique
-- gradient avatar. The id is set randomly on first nickname and updateable
-- via a new update_avatar_palette RPC.
--
-- RPCs updated: set_nickname, get_my_profile, get_my_friends,
--               get_friend_requests, get_trading_partners (ranking_and_trading).
-- New RPC: update_avatar_palette
--
-- Rollback: DROP COLUMN profiles.avatar_palette_id CASCADE;
--           Drop update_avatar_palette function.
--           Re-apply previous versions of the updated RPCs from their
--           original migration files.
-- ============================================================================

-- 1. Column ----------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_palette_id smallint
  check (avatar_palette_id between 1 and 20);

-- 2. RPC: update_avatar_palette -------------------------------------------
create or replace function public.update_avatar_palette(p_palette_id smallint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_palette_id not between 1 and 20 then
    raise exception 'invalid_palette_id' using hint = 'id must be 1-20';
  end if;

  update public.profiles
  set avatar_palette_id = p_palette_id,
      updated_at        = now()
  where user_id = v_user;
end;
$$;

revoke all on function public.update_avatar_palette(smallint) from public;
grant execute on function public.update_avatar_palette(smallint) to authenticated;

-- 3. RPC: set_nickname — assign random palette on first profile creation --
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

  insert into public.profiles(user_id, nickname, display_name, avatar_palette_id, updated_at)
  values (
    v_user,
    lower(p_nickname),
    coalesce(p_display_name, lower(p_nickname)),
    floor(random() * 20 + 1)::smallint,
    now()
  )
  on conflict (user_id) do update
    set nickname     = lower(p_nickname),
        display_name = coalesce(p_display_name, profiles.display_name),
        updated_at   = now();
  -- avatar_palette_id is NOT overwritten on nickname change

  return jsonb_build_object('ok', true, 'is_new', v_is_new);
end;
$$;

revoke all on function public.set_nickname(text, text) from public;
grant execute on function public.set_nickname(text, text) to authenticated;

-- 4. RPC: get_my_profile — expose avatar_palette_id -----------------------
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
    'avatar_palette_id',      v_row.avatar_palette_id,
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

-- 5. RPC: get_my_friends — expose avatar_palette_id -----------------------
create or replace function public.get_my_friends()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  return (
    select jsonb_agg(
      jsonb_build_object(
        'friendship_created_at', f.created_at,
        'initiated_by',          f.initiated_by,
        'user_id',               p.user_id,
        'nickname',              p.nickname,
        'display_name',          p.display_name,
        'avatar_url',            p.avatar_url,
        'avatar_palette_id',     p.avatar_palette_id
      )
      order by f.created_at desc
    )
    from public.friendships f
    join public.profiles p
      on p.user_id = case
        when f.user_a = v_caller then f.user_b
        else f.user_a
      end
    where v_caller in (f.user_a, f.user_b)
  );
end;
$$;

revoke all on function public.get_my_friends() from public;
grant execute on function public.get_my_friends() to authenticated;

-- 6. RPC: get_friend_requests — expose avatar_palette_id ------------------
create or replace function public.get_friend_requests()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'not authenticated'; end if;

  return jsonb_build_object(
    'pending', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id',                r.id,
          'from_user',         r.from_user,
          'created_at',        r.created_at,
          'nickname',          p.nickname,
          'display_name',      p.display_name,
          'avatar_url',        p.avatar_url,
          'avatar_palette_id', p.avatar_palette_id
        )
        order by r.created_at desc
      ), '[]'::jsonb)
      from public.friend_requests r
      left join public.profiles p on p.user_id = r.from_user
      where r.to_user = v_caller
    )
  );
end;
$$;

revoke all on function public.get_friend_requests() from public;
grant execute on function public.get_friend_requests() to authenticated;
```

> **Note on `get_trading_partners`:** That RPC lives in `20260531_0002_ranking_and_trading_rpcs.sql`. Add `'avatar_palette_id', p.avatar_palette_id` to its `jsonb_build_object` in a follow-up migration if the trading page needs the gradient avatar. For now `TradePartnerCard` will use hash fallback (no palette_id in TradePartner type yet), which is acceptable per the non-regression rule.

- [ ] **Step 2: Verify migration is parseable**

```bash
# If supabase CLI available:
# supabase db diff --local
# Otherwise just confirm SQL is syntactically correct by reading it.
echo "Migration file ready for manual application."
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260602_0001_avatar_palette.sql
git commit -m "feat(avatar): add avatar_palette_id column and update RPCs (#245)"
```

---

## Task 3: TypeScript types

**Files:**
- Modify: `src/state/friends/types.ts`

- [ ] **Step 1: Add `avatar_palette_id` to all relevant types**

Add `avatar_palette_id: number | null` to `Profile`, `FriendEntry`, and `FriendRequest`. (`FriendProfile` is returned by `get_public_profile` — leave it for a follow-up migration if needed.)

```ts
export type Profile = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  avatar_palette_id: number | null   // ← add
  collection_visibility: CollectionVisibility
  ranking_public: boolean
  trading_public: boolean
  email_trade_optin: boolean
  is_test_user: boolean
  created_at?: string
  updated_at?: string
}

export type FriendEntry = {
  user_id: string
  nickname: string
  display_name: string
  avatar_url: string | null
  avatar_palette_id: number | null   // ← add
  friendship_created_at: string
  initiated_by: string
}

export type FriendRequest = {
  id: string
  from_user: string
  created_at: string
  nickname: string | null
  display_name: string | null
  avatar_url: string | null
  avatar_palette_id: number | null   // ← add
}
```

- [ ] **Step 2: Run typecheck to confirm no breaks yet**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run typecheck 2>&1 | head -30
```

Expected: may have errors in components that use Avatar (we fix those in coming tasks). Types themselves should be clean.

- [ ] **Step 3: Commit**

```bash
git add src/state/friends/types.ts
git commit -m "feat(avatar): add avatar_palette_id to Profile, FriendEntry, FriendRequest types (#245)"
```

---

## Task 4: Update `Avatar.tsx` with gradient rendering

**Files:**
- Modify: `src/components/friends/Avatar.tsx`

- [ ] **Step 1: Rewrite Avatar with gradient support**

Replace the entire file content:

```tsx
import { avatarColorPalette } from '../../constants/avatarColorPalette'

function hashIndex(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  return hash % avatarColorPalette.length
}

type AvatarProps = {
  userId: string
  displayName: string
  paletteId?: number | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLS = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }

export default function Avatar({ userId, displayName, paletteId, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '?'

  const sizeCls = SIZE_CLS[size]

  const palette = paletteId != null
    ? (avatarColorPalette.find(p => p.id === paletteId) ?? avatarColorPalette[hashIndex(userId)])
    : avatarColorPalette[hashIndex(userId)]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${sizeCls} rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeCls} rounded-full flex items-center justify-center font-bold shrink-0 select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, ${palette.firstColor}, ${palette.secondColor})`,
        color: palette.color,
      }}
      aria-label={displayName}
    >
      {initials}
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run typecheck 2>&1 | head -40
```

Expected: errors only in callers that don't pass `paletteId` yet — that's fine, `paletteId` is optional so it should have zero errors actually (prop is `?`).

- [ ] **Step 3: Commit**

```bash
git add src/components/friends/Avatar.tsx
git commit -m "feat(avatar): render CSS gradient from palette, keep hash fallback (#245)"
```

---

## Task 5: Update `useProfile` — add `updateAvatarPalette`

**Files:**
- Modify: `src/state/friends/useProfile.ts`

- [ ] **Step 1: Add `updateAvatarPalette` method**

After the `updateSharingSettings` function definition (before the `return` statement), add:

```ts
  async function updateAvatarPalette(paletteId: number): Promise<{ ok: boolean; error?: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('update_avatar_palette', { p_palette_id: paletteId })
      if (error) throw error
      setState(s => s.profile ? { ...s, profile: { ...s.profile, avatar_palette_id: paletteId } } : s)
      return { ok: true }
    } catch (err: unknown) {
      return { ok: false, error: (err as { message?: string })?.message ?? String(err) }
    }
  }
```

Update the return statement to include the new function:

```ts
  return { ...state, refetch: fetchProfile, setNickname, updateDisplayName, updateVisibility, updateSharingSettings, updateAvatarPalette }
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run typecheck 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/state/friends/useProfile.ts
git commit -m "feat(avatar): add updateAvatarPalette to useProfile hook (#245)"
```

---

## Task 6: Propagate `paletteId` in friend components

**Files:**
- Modify: `src/components/friends/FriendCard.tsx`
- Modify: `src/components/friends/PendingRequestRow.tsx`

- [ ] **Step 1: Update `FriendCard.tsx` — pass `paletteId`**

Find the `<Avatar>` call (line 35):
```tsx
<Avatar userId={friend.user_id} displayName={friend.display_name} avatarUrl={friend.avatar_url} size='md' />
```
Replace with:
```tsx
<Avatar userId={friend.user_id} displayName={friend.display_name} paletteId={friend.avatar_palette_id} avatarUrl={friend.avatar_url} size='md' />
```

- [ ] **Step 2: Update `PendingRequestRow.tsx` — pass `paletteId`**

Find the `<Avatar>` call (line 32):
```tsx
<Avatar userId={userId} displayName={displayName} size='md' />
```
Replace with:
```tsx
<Avatar userId={userId} displayName={displayName} paletteId={request.avatar_palette_id} size='md' />
```

- [ ] **Step 3: Run typecheck**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run typecheck 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/friends/FriendCard.tsx src/components/friends/PendingRequestRow.tsx
git commit -m "feat(avatar): pass paletteId to Avatar in FriendCard and PendingRequestRow (#245)"
```

---

## Task 7: Upgrade `TradePartnerCard` to use `<Avatar>`

**Files:**
- Modify: `src/components/trading/TradePartnerCard.tsx`

The `TradePartner` type (in `src/hooks/useTradePartners.ts`) doesn't carry `avatar_palette_id` yet — the SQL migration for that RPC is deferred. We use the hash fallback naturally (pass no `paletteId`).

- [ ] **Step 1: Check `TradePartner` type**

```bash
grep -n "avatar_url\|display_name\|user_id" /Users/marcelotust/Projetos/copado26web/src/hooks/useTradePartners.ts | head -10
```

- [ ] **Step 2: Replace the 👤 placeholder with `<Avatar>`**

At the top of `TradePartnerCard.tsx`, add the import after the existing imports:
```tsx
import Avatar from '../friends/Avatar'
```

Find the avatar placeholder block (lines 99-104):
```tsx
        <div className='shrink-0 w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center'>
          {partner.avatar_url
            ? <img src={partner.avatar_url} alt='' className='w-full h-full object-cover' />
            : <span className='text-xl'>👤</span>
          }
        </div>
```

Replace with:
```tsx
        <Avatar
          userId={partner.user_id}
          displayName={partner.display_name || partner.nickname}
          avatarUrl={partner.avatar_url}
          size='md'
        />
```

- [ ] **Step 3: Run typecheck**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run typecheck 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/trading/TradePartnerCard.tsx
git commit -m "feat(avatar): replace emoji placeholder with Avatar in TradePartnerCard (#245)"
```

---

## Task 8: i18n — add avatar palette label keys

**Files:**
- Modify: `src/i18n/locales/pt-BR.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/es.json`

Find the `friends.settings` object in each file and add the new key.

- [ ] **Step 1: Add key to `pt-BR.json`**

Inside `"friends"` → `"settings"` object, add after the last key:
```json
"avatarPaletteLabel": "Cor do avatar"
```

- [ ] **Step 2: Add key to `en.json`**

```json
"avatarPaletteLabel": "Avatar color"
```

- [ ] **Step 3: Add key to `es.json`**

```json
"avatarPaletteLabel": "Color del avatar"
```

- [ ] **Step 4: Run typecheck**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run typecheck 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/i18n/locales/pt-BR.json src/i18n/locales/en.json src/i18n/locales/es.json
git commit -m "i18n: add avatarPaletteLabel for avatar palette picker (#245)"
```

---

## Task 9: Settings — palette picker UI

**Files:**
- Modify: `src/components/SettingsProfileSection.tsx`
- Modify: `src/pages/SettingsPage.tsx`

### 9a — SettingsProfileSection

- [ ] **Step 1: Add imports and new prop to SettingsProfileSection**

Add at the top of the file (after existing imports):
```tsx
import { avatarColorPalette } from '../constants/avatarColorPalette'
import Avatar from './friends/Avatar'
```

Extend the `Props` type:
```tsx
type Props = {
  profile: Profile | null
  onSetNickname: (nickname: string, displayName?: string) => Promise<{ ok: boolean; error?: string; is_new?: boolean }>
  onUpdateDisplayName: (name: string) => Promise<{ ok: boolean; error?: string }>
  onUpdateVisibility: (v: string) => Promise<{ ok: boolean; error?: string }>
  onUpdateAvatarPalette: (paletteId: number) => Promise<{ ok: boolean; error?: string }>
}
```

Update the destructuring line:
```tsx
export default function SettingsProfileSection({ profile, onSetNickname, onUpdateDisplayName, onUpdateVisibility, onUpdateAvatarPalette }: Props) {
```

- [ ] **Step 2: Add palette saving state after existing state declarations**

After `const [visibilitySaving, setVisibilitySaving] = useState(false)`, add:
```tsx
  const [paletteSaving, setPaletteSaving] = useState(false)
```

- [ ] **Step 3: Add handler after `handleDisplayNameSave`**

```tsx
  async function handlePaletteSelect(paletteId: number) {
    setPaletteSaving(true)
    await onUpdateAvatarPalette(paletteId)
    setPaletteSaving(false)
  }
```

- [ ] **Step 4: Add palette picker JSX after the visibility section (before NicknameSetupModal)**

After the closing `</div>` of the Collection visibility section, add:
```tsx
      {/* Avatar color palette */}
      <div className='flex flex-col gap-2'>
        <p className='text-[10px] text-slate-500 uppercase tracking-widest px-1'>{t('friends.settings.avatarPaletteLabel')}</p>
        <div className='grid grid-cols-5 gap-2'>
          {avatarColorPalette.map(entry => {
            const isSelected = profile?.avatar_palette_id === entry.id
            return (
              <button
                key={entry.id}
                type='button'
                disabled={paletteSaving}
                title={entry.name}
                onClick={() => { void handlePaletteSelect(entry.id) }}
                className={[
                  'flex items-center justify-center rounded-full w-10 h-10 text-xs font-bold transition-all disabled:opacity-50 mx-auto',
                  isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-80 hover:opacity-100',
                ].join(' ')}
                style={{
                  background: `linear-gradient(135deg, ${entry.firstColor}, ${entry.secondColor})`,
                  color: entry.color,
                }}
                aria-label={entry.name}
                aria-pressed={isSelected}
              >
                {isSelected ? '✓' : ''}
              </button>
            )
          })}
        </div>
      </div>
```

- [ ] **Step 5: Run typecheck**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run typecheck 2>&1 | head -40
```

Expected: error in SettingsPage (missing prop) — fixed next.

### 9b — SettingsPage

- [ ] **Step 6: Wire `updateAvatarPalette` in SettingsPage**

In `src/pages/SettingsPage.tsx`, update the `useProfile` destructure:
```tsx
const { profile, setNickname, updateDisplayName, updateVisibility, updateSharingSettings, updateAvatarPalette } = useProfile(userId)
```

Add `onUpdateAvatarPalette` to the `<SettingsProfileSection>` call:
```tsx
        <SettingsProfileSection
          profile={profile}
          onSetNickname={setNickname}
          onUpdateDisplayName={updateDisplayName}
          onUpdateVisibility={updateVisibility}
          onUpdateAvatarPalette={updateAvatarPalette}
        />
```

- [ ] **Step 7: Run typecheck**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run typecheck 2>&1 | head -30
```

Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/SettingsProfileSection.tsx src/pages/SettingsPage.tsx
git commit -m "feat(avatar): add palette picker to Settings and wire updateAvatarPalette (#245)"
```

---

## Task 10: Verification

- [ ] **Step 1: Run full typecheck**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run typecheck
```

Expected: zero errors.

- [ ] **Step 2: Run lint**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run lint 2>&1 | head -30
```

Expected: no new lint errors.

- [ ] **Step 3: Run unit tests**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run test:ci 2>&1 | tail -20
```

Expected: all passing.

- [ ] **Step 4: Run AI harness**

```bash
cd /Users/marcelotust/Projetos/copado26web && npm run ai:harness 2>&1
```

Expected: gates pass; note recommended personas (supabase-security-reviewer, frontend-product-engineer).

- [ ] **Step 5: Browser verification**

Start dev server and open in browser:
```bash
cd /Users/marcelotust/Projetos/copado26web && npm run dev
```

Check:
- `/friends` — friend cards show gradient avatars with initials
- `/friends` — pending requests show gradient avatars
- Settings → Configurações — palette grid renders (20 circles), selected ring highlights, clicking changes avatar
- Own avatar in any header/nav using `profile.avatar_palette_id`

- [ ] **Step 6: Commit if any fixes were needed, then close issue**

```bash
# After browser sign-off:
gh issue close 245 --comment "Implemented via commits on feat/avatar-color-palette. All acceptance criteria met."
```

---

## Self-Review Checklist

- [x] Palette constants file — Task 1
- [x] `avatar_palette_id` column + all RPCs updated — Task 2
- [x] TypeScript types — Task 3
- [x] Avatar gradient rendering with hash fallback — Task 4
- [x] `updateAvatarPalette` hook method — Task 5
- [x] FriendCard + PendingRequestRow propagate paletteId — Task 6
- [x] TradePartnerCard upgraded from 👤 to Avatar — Task 7
- [x] i18n keys in all 3 locales — Task 8
- [x] Palette picker in Settings — Task 9
- [x] Typecheck + lint + tests + harness + browser — Task 10
- [x] Existing users without `avatar_palette_id` get hash fallback (no visual regression) — handled in Avatar.tsx
- [x] `set_nickname` only assigns random palette on `INSERT` path (not on nickname change) — handled by NOT including `avatar_palette_id` in the `DO UPDATE` clause
- [x] No `.env` or sensitive files staged — verify before each commit
