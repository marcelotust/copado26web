import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { initDB } from './db'
import { useI18n } from './i18n'
import LoginPage from './pages/LoginPage'
import AlbumPage from './pages/AlbumPage'
import SwapsPage from './pages/SwapsPage'
import ScannerPage from './pages/ScannerPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

export default function App() {
  const { t } = useI18n()
  const [ready,    setReady]    = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [section,  setSection]  = useState('ARG')
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    initDB().then(() => setReady(true))
  }, [])

  function handleLogin() {
    setLoggedIn(true)
    navigate('/album')
  }

  function handleLogout() {
    setLoggedIn(false)
    setSection('ARG')
    navigate('/login')
  }

  const view = location.pathname === '/swaps'  ? 'swaps'
             : location.pathname === '/scanner' ? 'scanner'
             : 'album'

  if (!ready) {
    return (
      <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4'>
        <span className='text-6xl animate-bounce'>⚽</span>
        <p className='text-slate-400 text-sm font-medium'>{t('loading')}</p>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <Routes>
        <Route path='*' element={<LoginPage onLogin={handleLogin} />} />
      </Routes>
    )
  }

  return (
    <div className='fixed inset-0 flex flex-col bg-slate-950 text-white'>
      <Header onLogout={handleLogout} />

      <div className='flex flex-1 min-h-0'>
        <Sidebar
          selected={section}
          onSelect={code => { setSection(code); navigate('/album') }}
          view={view}
          onScanClick={() => navigate(view === 'scanner' ? '/album' : '/scanner')}
          onSwapsClick={() => navigate(view === 'swaps' ? '/album' : '/swaps')}
        />

        <main className='flex-1 min-w-0 overflow-hidden'>
          <Routes>
            <Route path='/album'   element={<AlbumPage sectionCode={section} />} />
            <Route path='/swaps'   element={<SwapsPage />} />
            <Route path='/scanner' element={<AlbumPage sectionCode={section} />} />
            <Route path='*'        element={<Navigate to='/album' replace />} />
          </Routes>
        </main>
      </div>

      {view === 'scanner' && (
        <ScannerPage onClose={() => navigate('/album')} />
      )}
    </div>
  )
}
