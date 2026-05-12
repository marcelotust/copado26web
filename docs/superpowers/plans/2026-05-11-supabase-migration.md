# Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the WC 2026 sticker album app from local-only IndexedDB to Supabase, adding real auth (magic link email), per-user album data, and a settings page with logout, reset album, and CSV export.

**Architecture:** Supabase handles auth (magic link) and Postgres storage. The frontend replaces Dexie hooks with Supabase client calls. Each user owns one album (a `stickers` table scoped by `user_id`). Vercel environment variables hold the Supabase credentials.

**Tech Stack:** Supabase JS SDK v2 (`@supabase/supabase-js`), Supabase Auth (magic link / OTP email), Supabase Postgres, Vercel env vars, React 18, Vite, Tailwind CSS.

---

## File Structure

### New files to create
- `src/lib/supabase.js` — Supabase client singleton (reads env vars)
- `src/hooks/useAuth.js` — Auth state, magic link send, session listener
- `src/hooks/useSupabaseStickers.js` — Replaces `useStickers.js`, queries Supabase
- `src/hooks/useSupabaseProgress.js` — Replaces progress queries, queries Supabase
- `src/hooks/useSupabaseSwaps.js` — Replaces `useSwaps.js`, queries Supabase
- `src/pages/SettingsPage.jsx` — Logout, reset album, export CSV
- `src/components/MagicLinkForm.jsx` — Email input + "Send link" form
- `src/components/MagicLinkSent.jsx` — "Check your email" confirmation screen

### Files to modify
- `src/App.jsx` — Replace Dexie init + fake auth with Supabase session, add `/settings` route
- `src/pages/LoginPage.jsx` — Replace fake form with MagicLinkForm flow
- `src/hooks/useStickerActions.js` — Replace `db.stickers.modify()` with Supabase update
- `src/components/HeaderMenu.jsx` — Add Settings link
- `.env.local` (new, not committed) — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Files to DELETE after migration
- `src/db/index.js` — Dexie DB init
- `src/db/seed.js` — Local seed (seeding moves to Supabase SQL migration)
- `src/hooks/useStickers.js` — Replaced by useSupabaseStickers
- `src/hooks/useSwaps.js` — Replaced by useSupabaseSwaps
- `src/hooks/useSectionCollected.js` — Replaced by useSupabaseProgress

---

## Supabase Schema (run once in Supabase SQL editor)

```sql
-- Each user has exactly one sticker per sticker ID
create table public.stickers (
  id          text not null,           -- e.g. "BRA-10"
  user_id     uuid not null references auth.users(id) on delete cascade,
  team_code   text not null,           -- e.g. "BRA"
  number      int  not null,
  quantity    int  not null default 0,
  is_special  bool not null default false,
  label       text,
  primary key (id, user_id)
);

-- Row Level Security: users only see/modify their own rows
alter table public.stickers enable row level security;

create policy "Users manage own stickers"
  on public.stickers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

> **Note:** The sticker rows are created on first login by a "seed on login" function in `useAuth.js`. No backend function needed — the client inserts 980 rows with `quantity: 0` using `upsert` with `ignoreDuplicates: true`.

---

## Task 1: Install Supabase and configure environment

**Files:**
- Modify: `package.json` (via npm install)
- Create: `.env.local`
- Modify: `vite.config.js` (no change needed — Vite auto-loads `.env.local`)

- [ ] **Step 1: Install Supabase JS SDK**

```bash
npm install @supabase/supabase-js
```

Expected output: added 1 package (or similar), no errors.

- [ ] **Step 2: Create your Supabase project**

1. Go to https://supabase.com/dashboard → New Project
2. Name it `copado26`, pick a region close to your users (e.g. South America — São Paulo)
3. Wait for the project to finish provisioning (~2 min)
4. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public key** (long JWT string)

- [ ] **Step 3: Create `.env.local` with credentials**

Create the file `/copado26web/.env.local`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> `.env.local` is already in `.gitignore` by Vite convention. Double-check before committing.

- [ ] **Step 4: Add environment variables to Vercel**

```bash
# If Vercel CLI is installed:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# Select: Production, Preview, Development for both
```

Or add them manually in the Vercel dashboard → Project → Settings → Environment Variables.

- [ ] **Step 5: Commit (env file excluded)**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/supabase-js"
```

---

## Task 2: Create Supabase client singleton

**Files:**
- Create: `src/lib/supabase.js`

- [ ] **Step 1: Create the client file**

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- [ ] **Step 2: Verify it loads without error**

```bash
npm run dev
```

Open browser console — no errors about missing env vars. If you see `undefined` for the URL/key, double-check `.env.local` spelling and restart the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.js
git commit -m "feat: add Supabase client singleton"
```

---

## Task 3: Create the Supabase database schema

**Files:**
- No code files — SQL run in Supabase dashboard

- [ ] **Step 1: Open SQL Editor in Supabase dashboard**

Go to your project → **SQL Editor** → New query.

- [ ] **Step 2: Run the stickers table migration**

```sql
create table public.stickers (
  id          text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  team_code   text not null,
  number      int  not null,
  quantity    int  not null default 0,
  is_special  bool not null default false,
  label       text,
  primary key (id, user_id)
);

alter table public.stickers enable row level security;

create policy "Users manage own stickers"
  on public.stickers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Click **Run**. Expected: "Success. No rows returned."

- [ ] **Step 3: Verify table in Table Editor**

Go to **Table Editor** → `stickers`. The table should appear with the correct columns.

- [ ] **Step 4: Enable magic link auth in Supabase**

Go to **Authentication → Providers → Email**:
- ✅ Enable Email provider
- ✅ Enable "Magic Link" (disable "Confirm email" if you want passwordless-only)
- Set **Site URL** to your Vercel production URL (e.g. `https://copado26.vercel.app`)
- Add `http://localhost:5173` to **Redirect URLs** for local dev

---

## Task 4: Build the auth hook

**Files:**
- Create: `src/hooks/useAuth.js`

This hook manages the Supabase session, sends magic links, and seeds the user's album on first login.

- [ ] **Step 1: Write `useAuth.js`**

```javascript
// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SEED_DATA } from '../db/seed'  // we keep seed.js for data, remove Dexie init later

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setLoading(false)
        if (session?.user) {
          await seedAlbumIfEmpty(session.user.id)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function sendMagicLink(email) {
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    })
    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
  }

  return { session, loading, magicLinkSent, error, sendMagicLink, signOut }
}

async function seedAlbumIfEmpty(userId) {
  // Check if user already has stickers
  const { count } = await supabase
    .from('stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count > 0) return  // album already seeded

  const rows = buildSeedRows(userId)
  // Insert in batches of 200 to avoid request size limits
  for (let i = 0; i < rows.length; i += 200) {
    await supabase.from('stickers').upsert(rows.slice(i, i + 200))
  }
}

function buildSeedRows(userId) {
  const rows = []
  for (const team of SEED_DATA) {
    for (const sticker of team.stickers) {
      rows.push({
        id: sticker.id,
        user_id: userId,
        team_code: team.code,
        number: sticker.number,
        quantity: 0,
        is_special: sticker.isSpecial,
        label: sticker.label ?? null,
      })
    }
  }
  return rows
}
```

- [ ] **Step 2: Export SEED_DATA from seed.js**

Open `src/db/seed.js` and check what it exports. You need a flat array of team objects where each team has a `stickers` array. If `seed.js` currently calls Dexie directly, refactor the data out into an exported constant.

Read the current file first, then modify the bottom to add:

```javascript
// At the bottom of src/db/seed.js — add this export
// (keep the existing initDB / Dexie code for now, we'll remove it in Task 9)
export const SEED_DATA = teams  // or whatever the variable is named
```

> If the variable is named differently, use that name. The goal is to export the raw team+sticker array so `useAuth.js` can use it.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.js src/db/seed.js
git commit -m "feat: add useAuth hook with magic link + album seeding"
```

---

## Task 5: Build the login UI

**Files:**
- Create: `src/components/MagicLinkForm.jsx`
- Create: `src/components/MagicLinkSent.jsx`
- Modify: `src/pages/LoginPage.jsx`

- [ ] **Step 1: Create `MagicLinkForm.jsx`**

```jsx
// src/components/MagicLinkForm.jsx
import { useState } from 'react'

export function MagicLinkForm({ onSubmit, error, loading }) {
  const [email, setEmail] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (email.trim()) onSubmit(email.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-white">WC 2026 Album</h1>
        <p className="text-slate-400 text-sm mt-1">Enter your email to receive a login link</p>
      </div>

      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-blue-500"
      />

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Sending…' : 'Send login link'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create `MagicLinkSent.jsx`**

```jsx
// src/components/MagicLinkSent.jsx
export function MagicLinkSent({ email }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
      <div className="text-5xl">📬</div>
      <h2 className="text-xl font-bold text-white">Check your email</h2>
      <p className="text-slate-400 text-sm">
        We sent a login link to <span className="text-white font-medium">{email}</span>.
        Click it to sign in — no password needed.
      </p>
      <p className="text-slate-500 text-xs">The link expires in 1 hour.</p>
    </div>
  )
}
```

- [ ] **Step 3: Replace `LoginPage.jsx`**

```jsx
// src/pages/LoginPage.jsx
import { useState } from 'react'
import { MagicLinkForm } from '../components/MagicLinkForm'
import { MagicLinkSent } from '../components/MagicLinkSent'

export default function LoginPage({ onSendLink, magicLinkSent, error }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(emailValue) {
    setEmail(emailValue)
    setSending(true)
    await onSendLink(emailValue)
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      {magicLinkSent
        ? <MagicLinkSent email={email} />
        : <MagicLinkForm onSubmit={handleSubmit} error={error} loading={sending} />
      }
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/MagicLinkForm.jsx src/components/MagicLinkSent.jsx src/pages/LoginPage.jsx
git commit -m "feat: replace login with magic link email flow"
```

---

## Task 6: Wire auth into App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Read current App.jsx**

Open `src/App.jsx` and understand the current state: `ready`, `loggedIn`, `section`, `handleLogin`, `handleLogout`.

- [ ] **Step 2: Replace App.jsx auth logic**

Replace the top of `App.jsx` (imports + state) with Supabase auth. Keep all routing and layout logic intact — only auth wiring changes.

```jsx
// src/App.jsx  — replace the top portion
import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import AlbumPage from './pages/AlbumPage'
import SwapsPage from './pages/SwapsPage'
import ScannerPage from './pages/ScannerPage'
import SettingsPage from './pages/SettingsPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

export default function App() {
  const { session, loading, magicLinkSent, error, sendMagicLink, signOut } = useAuth()
  const [section, setSection] = useState('FWC')

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    )
  }

  if (!session) {
    return (
      <LoginPage
        onSendLink={sendMagicLink}
        magicLinkSent={magicLinkSent}
        error={error}
      />
    )
  }

  // Keep existing layout JSX below, remove the old Dexie `ready` check
  // Pass `userId={session.user.id}` to AlbumPage, SwapsPage, ScannerPage
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      <Header section={section} userId={session.user.id} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar section={section} onSelect={setSection} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/album" element={<AlbumPage section={section} userId={session.user.id} />} />
            <Route path="/swaps" element={<SwapsPage userId={session.user.id} />} />
            <Route path="/settings" element={<SettingsPage userId={session.user.id} onSignOut={signOut} />} />
            <Route path="*" element={<Navigate to="/album" replace />} />
          </Routes>
        </main>
      </div>
      <Routes>
        <Route path="/scanner" element={<ScannerPage userId={session.user.id} onClose={() => window.history.back()} />} />
      </Routes>
    </div>
  )
}
```

> **Note on ScannerPage overlay:** The original used a fixed overlay rendered conditionally on route. Keep that pattern — just pass `userId` through. Check the existing JSX carefully and adapt; don't break the overlay positioning.

- [ ] **Step 3: Run the app and verify login flow works end-to-end**

```bash
npm run dev
```

1. App shows the magic link form
2. Enter a real email address, click "Send login link"
3. "Check your email" screen appears
4. Click the link in the email — browser redirects back to app
5. App shows album page (album seeds in background)

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire Supabase session into App routing"
```

---

## Task 7: Replace sticker data hooks with Supabase

**Files:**
- Create: `src/hooks/useSupabaseStickers.js`
- Create: `src/hooks/useSupabaseProgress.js`
- Create: `src/hooks/useSupabaseSwaps.js`
- Modify: `src/pages/AlbumPage.jsx`
- Modify: `src/pages/SwapsPage.jsx`
- Modify: `src/components/Header.jsx`

- [ ] **Step 1: Create `useSupabaseStickers.js`**

```javascript
// src/hooks/useSupabaseStickers.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabaseStickers(userId, teamCode) {
  const [stickers, setStickers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !teamCode) return
    let cancelled = false

    supabase
      .from('stickers')
      .select('*')
      .eq('user_id', userId)
      .eq('team_code', teamCode)
      .order('number', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setStickers(data ?? [])
          setLoading(false)
        }
      })

    // Realtime subscription so UI updates immediately after mutations
    const channel = supabase
      .channel(`stickers-${userId}-${teamCode}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setStickers(prev => prev.map(s =>
          s.id === payload.new.id ? { ...s, ...payload.new } : s
        ))
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId, teamCode])

  return { stickers, loading }
}
```

- [ ] **Step 2: Create `useSupabaseProgress.js`**

```javascript
// src/hooks/useSupabaseProgress.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabaseProgress(userId) {
  const [progress, setProgress] = useState({ total: 0, collected: 0, swaps: 0 })

  useEffect(() => {
    if (!userId) return

    async function fetchProgress() {
      const { data } = await supabase
        .from('stickers')
        .select('quantity')
        .eq('user_id', userId)

      if (!data) return
      const total = data.length
      const collected = data.filter(s => s.quantity >= 1).length
      const swaps = data.reduce((acc, s) => acc + Math.max(0, s.quantity - 1), 0)
      setProgress({ total, collected, swaps })
    }

    fetchProgress()

    const channel = supabase
      .channel(`progress-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchProgress())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  return progress
}

export function useSupabaseSectionProgress(userId, teamCode) {
  const [progress, setProgress] = useState({ total: 0, collected: 0 })

  useEffect(() => {
    if (!userId || !teamCode) return

    async function fetchProgress() {
      const { data } = await supabase
        .from('stickers')
        .select('quantity')
        .eq('user_id', userId)
        .eq('team_code', teamCode)

      if (!data) return
      setProgress({
        total: data.length,
        collected: data.filter(s => s.quantity >= 1).length,
      })
    }

    fetchProgress()

    const channel = supabase
      .channel(`section-progress-${userId}-${teamCode}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchProgress())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId, teamCode])

  return progress
}
```

- [ ] **Step 3: Create `useSupabaseSwaps.js`**

```javascript
// src/hooks/useSupabaseSwaps.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabaseSwaps(userId) {
  const [swapsByTeam, setSwapsByTeam] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!userId) return

    async function fetchSwaps() {
      const { data } = await supabase
        .from('stickers')
        .select('*')
        .eq('user_id', userId)
        .gt('quantity', 1)
        .order('team_code', { ascending: true })
        .order('number', { ascending: true })

      if (!data) return

      setTotal(data.reduce((acc, s) => acc + s.quantity - 1, 0))

      // Group by team_code
      const grouped = {}
      for (const sticker of data) {
        if (!grouped[sticker.team_code]) grouped[sticker.team_code] = []
        grouped[sticker.team_code].push(sticker)
      }
      setSwapsByTeam(Object.entries(grouped).map(([teamCode, stickers]) => ({ teamCode, stickers })))
    }

    fetchSwaps()

    const channel = supabase
      .channel(`swaps-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stickers',
        filter: `user_id=eq.${userId}`,
      }, () => fetchSwaps())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  return { swapsByTeam, total }
}
```

- [ ] **Step 4: Update `AlbumPage.jsx` to accept `userId` and use new hooks**

Open `src/pages/AlbumPage.jsx`. Replace the import of `useStickers` with `useSupabaseStickers`, and the progress hooks with `useSupabaseProgress` / `useSupabaseSectionProgress`. Pass `userId` into each hook.

The diff will look like:
```javascript
// Before
import { useStickers } from '../hooks/useStickers'
const stickers = useStickers(sectionCode)

// After
import { useSupabaseStickers } from '../hooks/useSupabaseStickers'
const { stickers } = useSupabaseStickers(userId, sectionCode)
```

Do the same for progress hooks. The `stickers` array shape is identical (`id`, `teamCode`, `number`, `quantity`, `isSpecial`, `label`) — Supabase returns snake_case columns so field names change from camelCase to snake_case. Check all usages:
- `sticker.teamCode` → `sticker.team_code`
- `sticker.isSpecial` → `sticker.is_special`

Update any JSX or logic that references these fields.

- [ ] **Step 5: Update `SwapsPage.jsx`**

Replace `useSwaps` import with `useSupabaseSwaps`:

```javascript
// Before
import { useSwaps } from '../hooks/useSwaps'
const { swapsByTeam, total } = useSwaps()

// After
import { useSupabaseSwaps } from '../hooks/useSupabaseSwaps'
const { swapsByTeam, total } = useSupabaseSwaps(userId)
```

Add `userId` as a prop to `SwapsPage`.

- [ ] **Step 6: Update `Header.jsx`**

Replace progress hook with `useSupabaseProgress(userId)`. Add `userId` as a prop to `Header`.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useSupabaseStickers.js src/hooks/useSupabaseProgress.js src/hooks/useSupabaseSwaps.js src/pages/AlbumPage.jsx src/pages/SwapsPage.jsx src/components/Header.jsx
git commit -m "feat: replace Dexie hooks with Supabase data hooks"
```

---

## Task 8: Replace sticker mutation with Supabase

**Files:**
- Modify: `src/hooks/useStickerActions.js`

The current hook calls `db.stickers.modify({ id }, s => { s.quantity++ })`. Replace with Supabase RPC or update call.

- [ ] **Step 1: Update `useStickerActions.js`**

```javascript
// src/hooks/useStickerActions.js
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useStickerActions(sticker, userId) {
  const [popping, setPopping] = useState(false)
  const [floats, setFloats] = useState([])

  async function increment() {
    setPopping(true)
    setFloats(f => [...f, Date.now()])
    setTimeout(() => setPopping(false), 200)
    setTimeout(() => setFloats(f => f.slice(1)), 750)

    await supabase
      .from('stickers')
      .update({ quantity: sticker.quantity + 1 })
      .eq('id', sticker.id)
      .eq('user_id', userId)
  }

  async function decrement() {
    if (sticker.quantity <= 0) return
    await supabase
      .from('stickers')
      .update({ quantity: sticker.quantity - 1 })
      .eq('id', sticker.id)
      .eq('user_id', userId)
  }

  return { popping, floats, increment, decrement }
}
```

- [ ] **Step 2: Update `StickerButtons.jsx` and `StickerCard.jsx`**

Both components use `useStickerActions`. They need to pass `userId` through. The hook signature changes from `useStickerActions(stickerId)` to `useStickerActions(sticker, userId)`.

In `StickerCard.jsx`:
```javascript
// Before
const { popping, floats, increment, decrement } = useStickerActions(sticker.id)

// After
const { popping, floats, increment, decrement } = useStickerActions(sticker, userId)
```

Add `userId` as a prop to `StickerCard` and thread it through from `AlbumPage` and `SwapsPage`.

- [ ] **Step 3: Also update `ScannerPage` / `useScannerLog.js`**

The scanner also increments stickers when a code is scanned. Open `src/hooks/useScannerLog.js` and find where it calls the DB. Replace the Dexie call with:

```javascript
// Find the increment call and replace with:
await supabase
  .from('stickers')
  .update({ quantity: existing.quantity + 1 })
  .eq('id', stickerId)
  .eq('user_id', userId)
```

You'll need to first fetch the current quantity, or do an RPC. Simpler approach — fetch then update:

```javascript
const { data: row } = await supabase
  .from('stickers')
  .select('quantity')
  .eq('id', stickerId)
  .eq('user_id', userId)
  .single()

if (row) {
  await supabase
    .from('stickers')
    .update({ quantity: row.quantity + 1 })
    .eq('id', stickerId)
    .eq('user_id', userId)
}
```

Pass `userId` into the scanner hooks from `ScannerPage`, which receives it from `App.jsx`.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useStickerActions.js src/components/StickerCard.jsx src/components/StickerButtons.jsx src/hooks/useScannerLog.js src/pages/ScannerPage.jsx
git commit -m "feat: replace Dexie mutations with Supabase updates"
```

---

## Task 9: Build the Settings page

**Files:**
- Create: `src/pages/SettingsPage.jsx`
- Modify: `src/components/HeaderMenu.jsx`

- [ ] **Step 1: Create `SettingsPage.jsx`**

```jsx
// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SettingsPage({ userId, onSignOut }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function handleReset() {
    setResetting(true)
    await supabase
      .from('stickers')
      .update({ quantity: 0 })
      .eq('user_id', userId)
    setResetting(false)
    setResetDone(true)
    setShowResetConfirm(false)
    setTimeout(() => setResetDone(false), 3000)
  }

  async function handleExportCSV() {
    setExporting(true)
    const { data } = await supabase
      .from('stickers')
      .select('id, team_code, number, label, quantity, is_special')
      .eq('user_id', userId)
      .order('team_code', { ascending: true })
      .order('number', { ascending: true })

    if (!data) { setExporting(false); return }

    const header = 'id,team_code,number,label,quantity,is_special'
    const rows = data.map(s =>
      `${s.id},${s.team_code},${s.number},"${s.label ?? ''}",${s.quantity},${s.is_special}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wc2026-album.csv'
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {/* Logout */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Account</h2>
        <button
          onClick={onSignOut}
          className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors"
        >
          Sign out
        </button>
      </section>

      {/* Export CSV */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Data</h2>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors disabled:opacity-50"
        >
          {exporting ? 'Preparing CSV…' : 'Export album to CSV'}
        </button>
      </section>

      {/* Reset Album */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Danger zone</h2>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-3 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-left border border-red-800 transition-colors"
          >
            Reset album
          </button>
        ) : (
          <div className="rounded-lg border border-red-700 bg-red-950/50 p-4 flex flex-col gap-3">
            <p className="text-red-300 font-semibold">Are you absolutely sure?</p>
            <p className="text-slate-400 text-sm">
              This will set all sticker quantities to zero. Your account and login will remain.
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50 transition-colors"
              >
                {resetting ? 'Resetting…' : 'Yes, reset everything'}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetDone && (
          <p className="text-green-400 text-sm">Album has been reset.</p>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Add Settings link to `HeaderMenu.jsx`**

Open `src/components/HeaderMenu.jsx`. Find the logout button/link and add a Settings link above it:

```jsx
import { Link } from 'react-router-dom'

// Inside the menu JSX, add:
<Link
  to="/settings"
  className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
>
  Settings
</Link>
```

Remove the old logout handler from `HeaderMenu` — logout now lives in Settings. Or keep a quick logout in the header menu too — your call. At minimum, the Settings link must be present.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SettingsPage.jsx src/components/HeaderMenu.jsx
git commit -m "feat: add Settings page with logout, reset album, and CSV export"
```

---

## Task 10: Remove Dexie and clean up

**Files:**
- Delete: `src/db/index.js`
- Modify: `src/db/seed.js` (remove Dexie init, keep SEED_DATA export)
- Delete: `src/hooks/useStickers.js`
- Delete: `src/hooks/useSwaps.js`
- Delete: `src/hooks/useSectionCollected.js`
- Modify: `package.json` (remove dexie packages)

- [ ] **Step 1: Verify nothing imports the old hooks**

```bash
grep -r "useStickers\|useSwaps\|useSectionCollected\|from '../db/index'\|from './db/index'" src/
```

Expected: no results. If any remain, update them before proceeding.

- [ ] **Step 2: Remove Dexie packages**

```bash
npm uninstall dexie dexie-react-hooks
```

- [ ] **Step 3: Delete old files**

```bash
rm src/hooks/useStickers.js src/hooks/useSwaps.js src/hooks/useSectionCollected.js src/db/index.js
```

- [ ] **Step 4: Clean up seed.js**

Keep only the data export, remove Dexie imports and `initDB` function. The file should export only `SEED_DATA`.

- [ ] **Step 5: Build and verify no errors**

```bash
npm run build
```

Expected: Build succeeds with no errors. Fix any import errors that surface.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove Dexie, clean up legacy DB hooks"
```

---

## Task 11: Test full flow and deploy

- [ ] **Step 1: Test locally end-to-end**

```bash
npm run dev
```

Walk through:
1. Open app → magic link login form shows
2. Enter email → "Check your email" screen
3. Click email link → redirected back, album loads
4. Album shows all teams with 0/20
5. Click a sticker card → quantity increments, updates DB
6. Open another browser tab → quantity is already updated (realtime sync)
7. Navigate to Swaps → shows empty (no duplicates yet)
8. Add a sticker twice → it appears in Swaps
9. Open Scanner → scan or manually enter a code → quantity updates
10. Go to Settings → all 3 buttons present and functional
    - Sign out → returns to login screen
    - Export CSV → downloads a `.csv` file with all sticker data
    - Reset album → confirmation dialog → resets all to 0

- [ ] **Step 2: Set Supabase redirect URLs for production**

In Supabase dashboard → **Authentication → URL Configuration**:
- Set **Site URL** to your Vercel production URL: `https://your-app.vercel.app`
- Add to **Redirect URLs**: `https://your-app.vercel.app/**`

- [ ] **Step 3: Deploy to Vercel**

```bash
git push origin backend-supabase
```

Then open a PR to `main` and merge, or push directly if deploying from this branch. Vercel will auto-deploy.

- [ ] **Step 4: Verify production**

Open the deployed Vercel URL and repeat the end-to-end test from Step 1.

---

## Self-Review

### Spec coverage check

| Requirement | Covered in |
|---|---|
| Migrate database to Supabase | Tasks 1-3 |
| Login per user | Tasks 4-6 |
| Magic link email auth | Task 4-5 |
| Save login session on device | Task 4 (`onAuthStateChange` + Supabase session storage) |
| Each user has 1 album | Task 4 (seed on login, scoped by `user_id`) |
| Controlling and registering cards/swaps per user | Tasks 7-8 |
| Vercel integration | Tasks 1, 11 |
| Settings: Logout button | Task 9 |
| Settings: Reset album with big alert | Task 9 |
| Settings: Export to CSV | Task 9 |

### No placeholders: verified — all steps contain complete code.

### Type/field consistency

- Supabase returns snake_case: `team_code`, `is_special` — flagged in Task 7, Step 4.
- `useStickerActions(sticker, userId)` signature used consistently in Tasks 8 and referenced in StickerCard.
- `userId` prop threaded through: App → Header, AlbumPage, SwapsPage, ScannerPage, SettingsPage.
