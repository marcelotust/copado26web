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
        className='flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-2xl'
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
              <span className='text-xl leading-none'>⚙</span>
              <span>{t('menu.settings')}</span>
            </Link>
            <a
              href='https://www.instagram.com/meualbum2026.app/'
              target='_blank'
              rel='noopener noreferrer'
              onClick={() => setOpen(false)}
              className='flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors w-full text-xs text-slate-300 hover:text-white hover:bg-slate-700'
            >
              <span className='text-xl leading-none flex items-center justify-center'>
              <svg className='w-3 h-3 text-pink-400' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
              </svg>
              </span>
              <span>{t('settings.contact')}</span>
            </a>
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
