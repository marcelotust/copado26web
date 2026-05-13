import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Analytics } from '@vercel/analytics/react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useI18n } from './i18n'
import { useStickersStatus, useTeams } from './state/stickersStore'
import { readLastAlbumSection, writeLastAlbumSection } from './lib/lastAlbumSectionStorage'
import AlbumPage from './pages/AlbumPage'
import SwapsPage from './pages/SwapsPage'
import SettingsPage from './pages/SettingsPage'
import MissingPage from './pages/MissingPage'
import LegalPage from './pages/LegalPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TabNav from './components/TabNav'
import LoadingScreen from './components/LoadingScreen'
import CatalogErrorScreen from './components/CatalogErrorScreen'

const DEFAULT_SECTION = 'BRA'

type AuthenticatedAppProps = { session: Session; signOut: () => Promise<void> }

export default function AuthenticatedApp({ session, signOut }: AuthenticatedAppProps) {
  const { t } = useI18n()
  const { status, error } = useStickersStatus()
  const teams = useTeams()
  const [section, setSection] = useState(() => readLastAlbumSection() ?? DEFAULT_SECTION)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (teams.length === 0) return
    setSection((prev) => {
      if (teams.some((t) => t.code === prev)) return prev
      return DEFAULT_SECTION
    })
  }, [teams])

  useEffect(() => {
    writeLastAlbumSection(section)
  }, [section])

  const email = session.user.email

  if (location.pathname === '/privacidade') {
    return <LegalPage kind='privacy' />
  }
  if (location.pathname === '/termos') {
    return <LegalPage kind='terms' />
  }

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
