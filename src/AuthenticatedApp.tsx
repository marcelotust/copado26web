import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import Analytics from './lib/telemetry/ConsentedAnalytics'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAnalyticsConsent } from './hooks/useAnalyticsConsent'
import { useTelemetryConsentSync, useTelemetrySignOut } from './hooks/useTelemetry'
import ConsentBanner from './components/ConsentBanner'
import { useI18n } from './i18n'
import { useMilestoneDetector } from './hooks/useMilestoneDetector'
import { useMilestoneBackfill } from './hooks/useMilestoneBackfill'
import { useInactivityReload } from './hooks/useInactivityReload'
import MilestoneModal from './components/MilestoneModal'
import { useStickersStatus, useTeams } from './state/stickersStore'
import { readLastAlbumSection, writeLastAlbumSection } from './lib/lastAlbumSectionStorage'
import AuthenticatedRoutes from './AuthenticatedRoutes'
import LegalPage from './pages/LegalPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TabNav from './components/TabNav'
import LoadingScreen from './components/LoadingScreen'
import CatalogErrorScreen from './components/CatalogErrorScreen'
import ChallengeCompletedModal from './components/ChallengeCompletedModal'
import { useChallengeCompletion } from './hooks/useChallengeCompletion'
import OnboardingGate from './components/onboarding/OnboardingGate'
import { useProfile } from './state/friends'
import NicknameBanner from './components/friends/NicknameBanner'
import NicknameSetupModal from './components/friends/NicknameSetupModal'
import { useDataSharingConsent } from './hooks/useDataSharingConsent'
import DataSharingConsentModal from './components/sharing/DataSharingConsentModal'
const DEFAULT_SECTION = 'BRA'
type AuthenticatedAppProps = { session: Session; signOut: () => Promise<void> }
export default function AuthenticatedApp({ session, signOut }: AuthenticatedAppProps) {
  const { t } = useI18n()
  const { status, error } = useStickersStatus()
  const { consent, grant, decline } = useAnalyticsConsent(session.user.id)
  useTelemetryConsentSync(session.user.id, consent)
  const handleSignOut = useTelemetrySignOut(signOut)
  const { activeMilestone, dismissMilestone, showMilestone } = useMilestoneDetector({
    userId: session.user.id,
    t,
  })
  const { activeCompletion, dismissCompletion } = useChallengeCompletion(session.user.id)
  useMilestoneBackfill(session.user.id)
  useInactivityReload(30 * 60 * 1000)
  const { profile, loading: profileLoading, setNickname, updateSharingSettings } = useProfile(session.user.id)
  const { seen: sharingConsentSeen, markSeen: markSharingConsentSeen } = useDataSharingConsent(session.user.id)
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false)
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
  const showAlbumSidebar = location.pathname === '/album'
  const showRankingBadge = !profileLoading && (profile === null || !profile.ranking_public)
  return (
    <div className='fixed inset-0 flex flex-col bg-slate-950 text-white'>
      <Header onLogout={handleSignOut} email={email} showRankingBadge={showRankingBadge} />
      <TabNav />
      {!profile && (
        <NicknameBanner />
      )}
      <div className='flex flex-1 min-h-0'>
        {showAlbumSidebar && (
          <Sidebar
            selected={section}
            onSelect={code => { setSection(code); navigate('/album') }}
          />
        )}
        <main className='flex-1 min-w-0 overflow-hidden'>
          <AuthenticatedRoutes
            userId={session.user.id}
            section={section}
            email={email}
            consent={consent}
            onGrantAnalytics={grant}
            onDeclineAnalytics={decline}
            onShowMilestone={showMilestone}
            onNavigateToTeam={code => { setSection(code); navigate('/album') }}
            onSignOut={handleSignOut}
          />
        </main>
      </div>
      {consent === 'granted' && <Analytics />}
      {consent === null && <ConsentBanner onAccept={grant} onDecline={decline} />}
      <MilestoneModal milestone={activeMilestone} onDismiss={dismissMilestone} />
      {profile?.nickname && !sharingConsentSeen && (
        <DataSharingConsentModal
          onDismiss={() => {
            void updateSharingSettings({
              ranking_public: true,
              trading_public: true,
              email_trade_optin: profile?.email_trade_optin ?? false,
            })
            markSharingConsentSeen()
          }}
          onGoToSettings={() => {
            void updateSharingSettings({
              ranking_public: true,
              trading_public: true,
              email_trade_optin: profile?.email_trade_optin ?? false,
            })
            navigate('/settings')
            markSharingConsentSeen()
          }}
        />
      )}
      <ChallengeCompletedModal challenge={activeCompletion} onDismiss={dismissCompletion} />
      <OnboardingGate userId={session.user.id} consent={consent} />
      <NicknameSetupModal
        isOpen={nicknameModalOpen}
        onClose={() => setNicknameModalOpen(false)}
        onSave={async (nick) => {
          const result = await setNickname(nick)
          return { ok: result.ok, error: result.error }
        }}
      />
    </div>
  )
}
