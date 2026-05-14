import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Analytics } from '@vercel/analytics/react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAnalyticsConsent } from './hooks/useAnalyticsConsent'
import ConsentBanner from './components/ConsentBanner'
import { useI18n } from './i18n'
import { useMilestoneDetector } from './hooks/useMilestoneDetector'
import MilestoneModal from './components/MilestoneModal'
import { useStickersStatus, useTeams } from './state/stickersStore'
import { readLastAlbumSection, writeLastAlbumSection } from './lib/lastAlbumSectionStorage'
import DashboardPage from './pages/DashboardPage'
import AlbumPage from './pages/AlbumPage'
import SwapsPage from './pages/SwapsPage'
import SettingsPage from './pages/SettingsPage'
import MissingPage from './pages/MissingPage'
import ChallengesPage from './pages/ChallengesPage'
import LegalPage from './pages/LegalPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TabNav from './components/TabNav'
import LoadingScreen from './components/LoadingScreen'
import CatalogErrorScreen from './components/CatalogErrorScreen'
import ChallengeCompletedModal from './components/ChallengeCompletedModal'
import { useChallengeCompletion } from './hooks/useChallengeCompletion'

const DEFAULT_SECTION = 'BRA'

type AuthenticatedAppProps = { session: Session; signOut: () => Promise<void> }

export default function AuthenticatedApp({ session, signOut }: AuthenticatedAppProps) {
  const { t } = useI18n()
  const { status, error } = useStickersStatus()
  const { consent, grant, decline } = useAnalyticsConsent(session.user.id)
  const { activeMilestone, dismissMilestone, showMilestone } = useMilestoneDetector({
    userId: session.user.id,
    t,
  })
  const { activeCompletion, dismissCompletion } = useChallengeCompletion(session.user.id)
  const teams = useTeams()
  const [section, setSection] = useState(() => readLastAlbumSection() ?? DEFAULT_SECTION)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (teams.length === 0) return
    setSection((prev) => {
      if (teams.some((team) => team.code === prev)) return prev
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

  const view = location.pathname === '/dashboard' ? 'dashboard'
             : location.pathname === '/swaps'    ? 'swaps'
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
            <Route path='/dashboard'  element={<DashboardPage  userId={session.user.id} onShowMilestone={showMilestone} />} />
            <Route path='/album'      element={<AlbumPage      sectionCode={section} />} />
            <Route path='/missing'    element={<MissingPage    />} />
            <Route path='/swaps'      element={<SwapsPage      />} />
            <Route path='/challenges' element={<ChallengesPage />} />
            <Route path='/settings'   element={<SettingsPage   email={email} onSignOut={signOut} />} />
            <Route path='*'           element={<Navigate to='/dashboard' replace />} />
          </Routes>
        </main>
      </div>
      {consent === 'granted' && <Analytics />}
      {consent === null && <ConsentBanner onAccept={grant} onDecline={decline} />}
      <MilestoneModal milestone={activeMilestone} onDismiss={dismissMilestone} />
      <ChallengeCompletedModal challenge={activeCompletion} onDismiss={dismissCompletion} />
    </div>
  )
}
