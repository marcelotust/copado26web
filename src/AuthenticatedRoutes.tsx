import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import type { Milestone } from './lib/milestoneDetection'
import type { ConsentState } from './hooks/useAnalyticsConsent'
import LoadingScreen from './components/LoadingScreen'
import { useI18n } from './i18n'

const AlbumPage = lazy(() => import('./pages/AlbumPage'))
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const MissingPage = lazy(() => import('./pages/MissingPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const SwapsPage = lazy(() => import('./pages/SwapsPage'))
const FriendsPage = lazy(() => import('./pages/FriendsPage'))
const FriendProfilePage = lazy(() => import('./pages/FriendProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

type AuthenticatedRoutesProps = {
  userId: string
  section: string
  email?: string
  consent: ConsentState
  onGrantAnalytics: () => void
  onDeclineAnalytics: () => void
  onShowMilestone: (m: Milestone) => void
  onNavigateToTeam: (code: string) => void
  onSignOut: () => Promise<void>
}

export default function AuthenticatedRoutes({
  userId,
  section,
  email,
  consent,
  onGrantAnalytics,
  onDeclineAnalytics,
  onShowMilestone,
  onNavigateToTeam,
  onSignOut,
}: AuthenticatedRoutesProps) {
  const { t } = useI18n()

  return (
    <Suspense fallback={<LoadingScreen label={t('loading')} />}>
      <Routes>
        <Route path='/dashboard' element={<DashboardPage userId={userId} onShowMilestone={onShowMilestone} onNavigateToTeam={onNavigateToTeam} />} />
        <Route path='/album' element={<AlbumPage sectionCode={section} />} />
        <Route path='/missing' element={<MissingPage />} />
        <Route path='/swaps' element={<SwapsPage />} />
        <Route path='/challenges' element={<ChallengesPage />} />
        <Route path='/friends' element={<FriendsPage userId={userId} />} />
        <Route path='/friends/add' element={<FriendsPage userId={userId} />} />
        <Route path='/u/:nickname' element={<FriendProfilePage currentUserId={userId} />} />
        <Route
          path='/settings'
          element={
            <SettingsPage
              userId={userId}
              email={email}
              consent={consent}
              onGrantAnalytics={onGrantAnalytics}
              onDeclineAnalytics={onDeclineAnalytics}
              onSignOut={onSignOut}
            />
          }
        />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
