import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n, LOCALE_META, type Locale } from '../i18n'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

type HeaderMenuProps = { onLogout: () => void; email?: string }

export default function HeaderMenu({ onLogout, email }: HeaderMenuProps) {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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
        className='flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-xl'
        aria-label='Menu'
      >
        ⚙
      </button>

      {open && (
        <div className='absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-[200] overflow-hidden'>
          {email && (
            <div className='px-3 py-2.5 border-b border-slate-800'>
              <p className='text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5'>
                {t('menu.loggedInAs')}
              </p>
              <p className='text-xs text-slate-300 truncate'>{email}</p>
            </div>
          )}
          <div className='p-2 border-b border-slate-800'>
            <p className='text-[9px] text-slate-500 font-bold uppercase tracking-widest px-1 mb-1.5'>
              {t('menu.language')}
            </p>
            <div className='flex flex-col gap-0.5'>
              {Object.entries(LOCALE_META).map(([code, meta]) => (
                <button
                  key={code}
                  onClick={() => { setLocale(code as Locale); setOpen(false) }}
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

          <div className='p-2 border-b border-slate-800'>
            <Link
              to='/settings'
              onClick={() => {
                telemetry.track(AnalyticsEvent.NAV_TAB_SELECTED, { tab: 'settings' })
                setOpen(false)
              }}
              className='flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors w-full text-xs text-slate-300 hover:text-white hover:bg-slate-700'
            >
              <span className='text-base leading-none'>⚙</span>
              <span>{t('menu.settings')}</span>
            </Link>
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
