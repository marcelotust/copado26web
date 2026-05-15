import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import type { Milestone } from './lib/milestoneDetection'
import LoadingScreen from './components/LoadingScreen'
import { useI18n } from './i18n'

const AlbumPage = lazy(() => import('./pages/AlbumPage'))
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const MissingPage = lazy(() => import('./pages/MissingPage'))
const ScannerPage = lazy(() => import('./pages/ScannerPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const SwapsPage = lazy(() => import('./pages/SwapsPage'))

type AuthenticatedRoutesProps = {
  userId: string
  section: string
  email?: string
  onShowMilestone: (m: Milestone) => void
  onSignOut: () => Promise<void>
}

export default function AuthenticatedRoutes({
  userId,
  section,
  email,
  onShowMilestone,
  onSignOut,
}: AuthenticatedRoutesProps) {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <Suspense fallback={<LoadingScreen label={t('loading')} />}>
      <Routes>
        <Route path='/dashboard' element={<DashboardPage userId={userId} onShowMilestone={onShowMilestone} />} />
        <Route path='/album' element={<AlbumPage sectionCode={section} />} />
        <Route path='/missing' element={<MissingPage />} />
        <Route path='/swaps' element={<SwapsPage />} />
        <Route path='/scanner' element={<ScannerPage onClose={() => navigate('/album')} />} />
        <Route path='/challenges' element={<ChallengesPage />} />
        <Route path='/settings' element={<SettingsPage email={email} onSignOut={onSignOut} />} />
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Routes>
    </Suspense>
  )
}
