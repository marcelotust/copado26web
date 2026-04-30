import { useState, useEffect } from 'react'
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
          {view === 'album' && <AlbumPage sectionCode={section} />}
          {view === 'swaps' && <SwapsPage />}
        </main>
      </div>

      {view === 'scanner' && (
        <ScannerPage onClose={() => setView('album')} />
      )}
    </div>
  )
}
