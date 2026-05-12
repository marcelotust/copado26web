import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Analytics } from '@vercel/analytics/react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useI18n } from './i18n'
import { StickersProvider, useStickersStatus } from './state/stickersStore'
import LoginPage from './pages/LoginPage'
import AlbumPage from './pages/AlbumPage'
import SwapsPage from './pages/SwapsPage'
import SettingsPage from './pages/SettingsPage'
import MissingPage from './pages/MissingPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TabNav from './components/TabNav'

const DEFAULT_SECTION = 'BRA'

export default function App() {
  const { t } = useI18n()
  const { session, loading, magicLinkSent, error, sendMagicLink, signInWithGoogle, signOut } = useAuth()

  if (loading) return <LoadingScreen label={t('loading')} />

  if (!session) {
    return (
      <LoginPage
        onSendLink={sendMagicLink}
        onGoogleLogin={signInWithGoogle}
        magicLinkSent={magicLinkSent}
        error={error}
      />
    )
  }

  return (
    <StickersProvider userId={session.user.id}>
      <AuthenticatedApp session={session} signOut={signOut} />
    </StickersProvider>
  )
}

function AuthenticatedApp({ session, signOut }: { session: Session; signOut: () => Promise<void> }) {
  const { t } = useI18n()
  const { status, error } = useStickersStatus()
  const [section, setSection] = useState(DEFAULT_SECTION)
  const navigate  = useNavigate()
  const location  = useLocation()

  const email = session.user.email

  if (status === 'idle' || status === 'loading') {
    return <LoadingScreen label={t('loading')} />
  }
  if (status === 'error') {
    return <CatalogErrorScreen error={error} />
  }

  const view = location.pathname === '/swaps'    ? 'swaps'
             : location.pathname === '/missing'  ? 'missing'
             : location.pathname === '/scanner'  ? 'scanner'
             : location.pathname === '/settings' ? 'settings'
             : 'album'

  return (
    <div className='fixed inset-0 flex flex-col bg-slate-950 text-white'>
      <Header onLogout={signOut} email={email} />
      <TabNav />

      <div className='flex flex-1 min-h-0'>
        {view === 'album' && (
          <Sidebar
            selected={section}
            onSelect={code => { setSection(code); navigate('/album') }}
          />
        )}

        <main className='flex-1 min-w-0 overflow-hidden'>
          <Routes>
            <Route path='/album'    element={<AlbumPage    sectionCode={section} />} />
            <Route path='/missing'  element={<MissingPage  />} />
            <Route path='/swaps'    element={<SwapsPage    />} />
            <Route path='/settings' element={<SettingsPage email={email} onSignOut={signOut} />} />
            <Route path='*'         element={<Navigate to='/album' replace />} />
          </Routes>
        </main>
      </div>
      <Analytics />
    </div>
  )
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4'>
      <span className='text-6xl animate-bounce'>⚽</span>
      <p className='text-slate-400 text-sm font-medium'>{label}</p>
    </div>
  )
}

function CatalogErrorScreen({ error }: { error: Error | null }) {
  const { t } = useI18n()
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  return (
    <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center'>
      <span className='text-5xl'>{offline ? '📡' : '⚠️'}</span>
      <p className='text-white font-bold text-lg'>
        {offline ? t('errors.offlineTitle') : t('errors.catalogTitle')}
      </p>
      <p className='text-slate-400 text-sm max-w-xs'>
        {offline ? t('errors.offlineDesc') : t('errors.catalogDesc')}
      </p>
      <button
        onClick={() => location.reload()}
        className='mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold'
      >
        {t('errors.retry')}
      </button>
      {error?.message && (
        <p className='text-slate-600 text-xs font-mono mt-1'>{error.message}</p>
      )}
    </div>
  )
}
