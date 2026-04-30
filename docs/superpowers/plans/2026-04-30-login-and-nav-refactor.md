# Login Page & Navigation Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a login page (frontend-only) as the entry point, move Swaps/Scan buttons to the sidebar top, and replace them in the header with a dropdown menu containing the language selector and logout.

**Architecture:** The app already uses a state machine for views (`'album'|'scanner'|'swaps'`). We extend that pattern by adding a `page` state (`'login'|'app'`) in `App.jsx`. No router is needed. A new `HeaderMenu` dropdown component handles language switching and logout. Swaps/Scan buttons move from `Header` to `Sidebar` (top-fixed area); `LanguageSwitcher` moves from `Sidebar` bottom into `HeaderMenu`.

**Tech Stack:** React 18, Vite, Tailwind CSS, custom i18n context (`src/i18n/index.jsx`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/LoginPage.jsx` | Full-screen login form (username + password) |
| Create | `src/components/HeaderMenu.jsx` | Top-right dropdown with language selector + logout |
| Modify | `src/i18n/index.jsx` | Add translation keys: login form + logout |
| Modify | `src/App.jsx` | Add `page` state, render login/app, wire new props |
| Modify | `src/components/Header.jsx` | Remove Swaps/Scan buttons, add `HeaderMenu` |
| Modify | `src/components/Sidebar.jsx` | Add Swaps/Scan buttons at top, remove `LanguageSwitcher` |

---

## Task 1: Add i18n translation keys

**Files:**
- Modify: `src/i18n/index.jsx`

- [ ] **Step 1: Add keys to the `en` locale object (after the `'swaps.*'` block)**

Open `src/i18n/index.jsx` and add to the `en` object (before the closing `}`):

```js
  // Login
  'login.title':    'Sign In',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.submit':   'Sign In',

  // Header menu
  'menu.logout': 'Logout',
```

- [ ] **Step 2: Add keys to the `ptBR` locale object (after `'swaps.*'`)**

```js
  // Login
  'login.title':    'Entrar',
  'login.username': 'Usuário',
  'login.password': 'Senha',
  'login.submit':   'Entrar',

  // Header menu
  'menu.logout': 'Sair',
```

- [ ] **Step 3: Add keys to the `es` locale object (after `'swaps.*'`)**

```js
  // Login
  'login.title':    'Iniciar Sesión',
  'login.username': 'Usuario',
  'login.password': 'Contraseña',
  'login.submit':   'Iniciar Sesión',

  // Header menu
  'menu.logout': 'Cerrar Sesión',
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n/index.jsx
git commit -m "feat: add i18n keys for login page and header menu"
```

---

## Task 2: Create `LoginPage` component

**Files:**
- Create: `src/components/LoginPage.jsx`

- [ ] **Step 1: Create the file with this content**

```jsx
import { useState } from 'react'
import { useI18n } from '../i18n'

export default function LoginPage({ onLogin }) {
  const { t } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onLogin(username, password)
  }

  return (
    <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4'>
      <div className='w-full max-w-sm'>
        <div className='flex items-center justify-center gap-2 mb-8'>
          <span className='text-4xl'>⚽</span>
          <div>
            <p className='text-white font-black text-2xl leading-none tracking-tight'>COPADO26</p>
            <p className='text-slate-600 text-xs leading-none mt-0.5'>{t('appSubtitle')}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className='bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4'
        >
          <h1 className='text-white font-bold text-lg text-center'>{t('login.title')}</h1>

          <div className='flex flex-col gap-1.5'>
            <label className='text-slate-400 text-xs font-medium'>{t('login.username')}</label>
            <input
              type='text'
              value={username}
              onChange={e => setUsername(e.target.value)}
              className='bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500'
              autoComplete='username'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-slate-400 text-xs font-medium'>{t('login.password')}</label>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500'
              autoComplete='current-password'
            />
          </div>

          <button
            type='submit'
            className='bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors mt-1'
          >
            {t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LoginPage.jsx
git commit -m "feat: add LoginPage component (frontend-only)"
```

---

## Task 3: Create `HeaderMenu` dropdown component

**Files:**
- Create: `src/components/HeaderMenu.jsx`

- [ ] **Step 1: Create the file with this content**

```jsx
import { useState, useRef, useEffect } from 'react'
import { useI18n, LOCALE_META } from '../i18n'

export default function HeaderMenu({ onLogout }) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className='relative shrink-0'>
      <button
        onClick={() => setOpen(o => !o)}
        className='flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-base'
        aria-label='Menu'
      >
        ⚙
      </button>

      {open && (
        <div className='absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden'>
          <div className='p-2 border-b border-slate-800'>
            <p className='text-[9px] text-slate-500 font-bold uppercase tracking-widest px-1 mb-1.5'>
              Language
            </p>
            <div className='flex flex-col gap-0.5'>
              {Object.entries(LOCALE_META).map(([code, meta]) => (
                <button
                  key={code}
                  onClick={() => { setLocale(code); setOpen(false) }}
                  className={[
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors w-full text-xs',
                    locale === code
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  ].join(' ')}
                >
                  <span className='text-sm leading-none'>{meta.flag}</span>
                  <span>{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className='p-2'>
            <button
              onClick={() => { setOpen(false); onLogout() }}
              className='flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40'
            >
              <span>→</span>
              <span>{t('menu.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HeaderMenu.jsx
git commit -m "feat: add HeaderMenu dropdown with language selector and logout"
```

---

## Task 4: Update `App.jsx` — add page state and wire new props

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace the entire file content**

```jsx
import { useState, useEffect } from 'react'
import { initDB } from './db'
import { useI18n } from './i18n'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import StickerGrid from './components/StickerGrid'
import OcrScanner from './components/OcrScanner'
import SwapsView from './components/SwapsView'

export default function App() {
  const { t } = useI18n()
  const [ready,   setReady]   = useState(false)
  const [page,    setPage]    = useState('login')  // 'login' | 'app'
  const [view,    setView]    = useState('album')   // 'album' | 'scanner' | 'swaps'
  const [section, setSection] = useState('ARG')

  useEffect(() => {
    initDB().then(() => setReady(true))
  }, [])

  function handleLogin() {
    setPage('app')
  }

  function handleLogout() {
    setPage('login')
    setView('album')
    setSection('ARG')
  }

  if (!ready) {
    return (
      <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4'>
        <span className='text-6xl animate-bounce'>⚽</span>
        <p className='text-slate-400 text-sm font-medium'>{t('loading')}</p>
      </div>
    )
  }

  if (page === 'login') {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className='fixed inset-0 flex flex-col bg-slate-950 text-white'>
      <Header onLogout={handleLogout} />

      <div className='flex flex-1 min-h-0'>
        <Sidebar
          selected={section}
          onSelect={code => { setSection(code); setView('album') }}
          view={view}
          onScanClick={() => setView(v => v === 'scanner' ? 'album' : 'scanner')}
          onSwapsClick={() => setView(v => v === 'swaps' ? 'album' : 'swaps')}
        />

        <main className='flex-1 min-w-0 overflow-hidden'>
          {view === 'album' && <StickerGrid sectionCode={section} />}
          {view === 'swaps' && <SwapsView />}
        </main>
      </div>

      {view === 'scanner' && (
        <OcrScanner onClose={() => setView('album')} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add page state for login/app routing and wire new props"
```

---

## Task 5: Update `Header.jsx` — remove Swaps/Scan, add `HeaderMenu`

**Files:**
- Modify: `src/components/Header.jsx`

- [ ] **Step 1: Replace the entire file content**

The header no longer needs `view`, `onScanClick`, or `onSwapsClick`. It receives only `onLogout` and renders `HeaderMenu` on the right.

```jsx
import { useProgress } from '../hooks/useStickers'
import { useI18n } from '../i18n'
import ProgressBar from './ProgressBar'
import HeaderMenu from './HeaderMenu'

export default function Header({ onLogout }) {
  const { total, collected } = useProgress()
  const { t } = useI18n()

  return (
    <header className='shrink-0 flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur border-b border-slate-800 z-10'>
      <div className='flex items-center gap-2 px-2 lg:px-3 py-3 shrink-0'>
        <span className='text-xl shrink-0'>⚽</span>
        <div className='lg:block min-w-0'>
          <p className='text-white font-black text-x leading-none tracking-tight'>
            COPADO26
          </p>
          <p className='text-slate-600 text-[9px] leading-none mt-0.5'>
            {t('appSubtitle')}
          </p>
        </div>
      </div>

      <ProgressBar collected={collected} total={total} />

      <HeaderMenu onLogout={onLogout} />
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.jsx
git commit -m "refactor: replace Swaps/Scan buttons with HeaderMenu dropdown"
```

---

## Task 6: Update `Sidebar.jsx` — add Swaps/Scan at top, remove LanguageSwitcher

**Files:**
- Modify: `src/components/Sidebar.jsx`

- [ ] **Step 1: Replace the entire file content**

The sidebar now accepts `view`, `onScanClick`, and `onSwapsClick` props. The Swaps/Scan buttons sit in a fixed-height block above the scrollable nav. `LanguageSwitcher` is removed (it now lives in `HeaderMenu`).

```jsx
import { SECTIONS, CONF_ORDER } from '../db/seed'
import { useI18n } from '../i18n'
import { useProgress } from '../hooks/useStickers'
import SectionItem from './SectionItem'

export default function Sidebar({ selected, onSelect, view, onScanClick, onSwapsClick }) {
  const { t } = useI18n()
  const { swaps } = useProgress()

  const grouped = CONF_ORDER.reduce((acc, conf) => {
    const items = SECTIONS.filter(s => s.conf === conf)
    if (items.length) acc[conf] = items
    return acc
  }, {})

  return (
    <aside className='w-150 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden'>
      <div className='shrink-0 px-1 py-2 border-b border-slate-800 flex flex-col gap-1'>
        <button
          onClick={onSwapsClick}
          className={[
            'relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all w-full',
            view === 'swaps'
              ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
          ].join(' ')}
        >
          🔄
          <span className='hidden lg:inline'>{t('header.swaps')}</span>
          {swaps > 0 && (
            <span className='bg-amber-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1'>
              {swaps}
            </span>
          )}
        </button>

        <button
          onClick={onScanClick}
          className={[
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all w-full',
            view === 'scanner'
              ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
          ].join(' ')}
        >
          📷
          <span className='hidden lg:inline'>{t('header.scan')}</span>
        </button>
      </div>

      <nav className='flex-1 overflow-y-auto py-1 px-1'>
        {CONF_ORDER.map(conf => {
          const items = grouped[conf]
          if (!items) return null
          return (
            <div key={conf} className='mb-1'>
              <p className='hidden lg:block text-[8px] text-slate-600 font-bold tracking-widest uppercase px-2 pt-2 pb-1'>
                {t(`conf.${conf}`)}
              </p>
              {items.map(section => (
                <SectionItem
                  key={section.code}
                  section={section}
                  active={selected === section.code}
                  onClick={() => onSelect(section.code)}
                />
              ))}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.jsx
git commit -m "refactor: move Swaps/Scan buttons to sidebar top, remove LanguageSwitcher"
```

---

## Task 7: Verify in the browser

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected output includes: `Local: http://localhost:5173/`

- [ ] **Step 2: Verify login page**

Open `http://localhost:5173` in the browser. You should see:
- Full-screen dark background
- COPADO26 logo centered
- "Sign In" card with Username and Password fields
- "Sign In" button

- [ ] **Step 3: Verify login navigates to the app**

Type anything in the fields (or leave them empty) and click "Sign In". You should see the full album app.

- [ ] **Step 4: Verify sidebar buttons**

- The Swaps (🔄) and Scan (📷) buttons appear at the top of the sidebar above the team list.
- Clicking Swaps highlights it amber and shows the Swaps view.
- Clicking Scan highlights it blue and opens the scanner overlay.

- [ ] **Step 5: Verify header menu**

- The old Swaps/Scan buttons are gone from the header.
- A ⚙ button appears in the top-right of the header.
- Clicking it opens a dropdown with:
  - Language selector (EN 🇺🇸 / PT 🇧🇷 / ES 🇪🇸)
  - Logout button in red
- Clicking outside the dropdown closes it.
- Switching language updates all text immediately.

- [ ] **Step 6: Verify logout**

Click the Logout option in the header menu. You should be returned to the login page.

- [ ] **Step 7: Final commit (if no issues found)**

```bash
git add -p  # review any lingering changes
git commit -m "feat: login page, header menu, sidebar nav refactor"
```
