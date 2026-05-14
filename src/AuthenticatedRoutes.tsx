import { Routes, Route, Navigate } from 'react-router-dom'
import type { Milestone } from './lib/milestoneDetection'
import DashboardPage from './pages/DashboardPage'
import AlbumPage from './pages/AlbumPage'
import SwapsPage from './pages/SwapsPage'
import SettingsPage from './pages/SettingsPage'
import MissingPage from './pages/MissingPage'
import ChallengesPage from './pages/ChallengesPage'

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
  return (
    <Routes>
      <Route path='/dashboard' element={<DashboardPage userId={userId} onShowMilestone={onShowMilestone} />} />
      <Route path='/album' element={<AlbumPage sectionCode={section} />} />
      <Route path='/missing' element={<MissingPage />} />
      <Route path='/swaps' element={<SwapsPage />} />
      <Route path='/challenges' element={<ChallengesPage />} />
      <Route path='/settings' element={<SettingsPage email={email} onSignOut={onSignOut} />} />
      <Route path='*' element={<Navigate to='/dashboard' replace />} />
    </Routes>
  )
}
