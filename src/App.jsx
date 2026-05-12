import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useI18n } from './i18n'
import LoginPage from './pages/LoginPage'
import AlbumPage from './pages/AlbumPage'
import SwapsPage from './pages/SwapsPage'
import SettingsPage from './pages/SettingsPage'
import MissingPage from './pages/MissingPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TabNav from './components/TabNav'

export default function App() {
  const { t } = useI18n()
  const { session, loading, magicLinkSent, error, sendMagicLink, signInWithGoogle, signOut } = useAuth()
  const [section, setSection] = useState('ARG')
  const navigate  = useNavigate()
  const location  = useLocation()

  if (loading) {
    return (
      <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4'>
        <span className='text-6xl animate-bounce'>⚽</span>
        <p className='text-slate-400 text-sm font-medium'>{t('loading')}</p>
      </div>
    )
  }

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

  const userId = session.user.id
  const email  = session.user.email

  const view = location.pathname === '/swaps'    ? 'swaps'
             : location.pathname === '/missing'  ? 'missing'
             : location.pathname === '/scanner'  ? 'scanner'
             : location.pathname === '/settings' ? 'settings'
             : 'album'

  return (
    <div className='fixed inset-0 flex flex-col bg-slate-950 text-white'>
      <Header onLogout={signOut} userId={userId} email={email} />
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
            <Route path='/album'    element={<AlbumPage    sectionCode={section} userId={userId} />} />
            <Route path='/missing'  element={<MissingPage  userId={userId} />} />
            <Route path='/swaps'    element={<SwapsPage    userId={userId} />} />
            <Route path='/settings' element={<SettingsPage userId={userId} email={email} onSignOut={signOut} />} />
            <Route path='*'         element={<Navigate to='/album' replace />} />
          </Routes>
        </main>
      </div>
      <Analytics />
    </div>
  )
}
