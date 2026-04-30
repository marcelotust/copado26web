import { useState, useEffect } from 'react'
import { initDB } from './db'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import StickerGrid from './components/StickerGrid'
import OcrScanner from './components/OcrScanner'
import SwapsView from './components/SwapsView'

export default function App() {
  const [ready,    setReady]    = useState(false)
  const [view,     setView]     = useState('album')   // 'album' | 'scanner' | 'swaps'
  const [section,  setSection]  = useState('ARG')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    initDB().then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4">
        <span className="text-6xl animate-bounce">⚽</span>
        <p className="text-slate-400 text-sm font-medium">Setting up your album…</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-white">
      <Header
        view={view}
        onMenuClick={() => setMenuOpen(o => !o)}
        onScanClick={() => setView(v => v === 'scanner' ? 'album' : 'scanner')}
        onSwapsClick={() => setView(v => v === 'swaps' ? 'album' : 'swaps')}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar
          selected={section}
          onSelect={code => { setSection(code); setView('album') }}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />

        <main className="flex-1 min-w-0 overflow-hidden">
          {view === 'album'   && <StickerGrid sectionCode={section} />}
          {view === 'swaps'   && <SwapsView />}
        </main>
      </div>

      {view === 'scanner' && (
        <OcrScanner onClose={() => setView('album')} />
      )}
    </div>
  )
}
