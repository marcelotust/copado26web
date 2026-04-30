import { useState, useRef, useEffect } from 'react'
import { useI18n, LOCALE_META } from '../i18n'

export default function HeaderMenu({ onLogout }) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className='relative shrink-0'>
      <button
        onClick={() => setOpen(o => !o)}
        className='flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-base'
        aria-label='Menu'
      >
        ⚙
      </button>

      {open && (
        <div className='absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden'>
          <div className='p-2 border-b border-slate-800'>
            <p className='text-[9px] text-slate-500 font-bold uppercase tracking-widest px-1 mb-1.5'>
              Language
            </p>
            <div className='flex flex-col gap-0.5'>
              {Object.entries(LOCALE_META).map(([code, meta]) => (
                <button
                  key={code}
                  onClick={() => { setLocale(code); setOpen(false) }}
                  className={[
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors w-full text-xs',
                    locale === code
                      ? 'bg-slate-700 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  ].join(' ')}
                >
                  <span className='text-sm leading-none'>{meta.flag}</span>
                  <span>{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className='p-2'>
            <button
              onClick={() => { setOpen(false); onLogout() }}
              className='flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40'
            >
              <span>→</span>
              <span>{t('menu.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
