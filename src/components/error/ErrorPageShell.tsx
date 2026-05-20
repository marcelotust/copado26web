import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import BrandMark from '../brand/BrandMark'
import { useI18n } from '../../i18n'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'

type ErrorPageShellProps = {
  card: ReactNode
  title: string
  subtitle: string
  primary: { label: string; to?: string; onClick?: () => void }
  secondary?: { label: string; to?: string; onClick?: () => void }
}

export default function ErrorPageShell({ card, title, subtitle, primary, secondary }: ErrorPageShellProps) {
  const { t } = useI18n()

  return (
    <div className='min-h-screen bg-slate-950 text-white flex flex-col overflow-x-hidden'>
      <header className='flex items-center justify-between px-6 py-4 w-full max-w-5xl mx-auto'>
        <Link to='/' aria-label={t('landing.homeAriaLabel')} className={`rounded ${FOCUS_RING}`}>
          <BrandMark className='h-10 w-auto' />
        </Link>
      </header>

      <main className='flex-1 flex items-center justify-center px-6 py-10'>
        <div className='flex flex-col items-center text-center gap-8 max-w-md'>
          {card}

          <div className='flex flex-col gap-3'>
            <h1 className='text-3xl sm:text-4xl font-black leading-tight'>{title}</h1>
            <p className='text-slate-400 text-sm sm:text-base leading-relaxed'>{subtitle}</p>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
            {primary.to ? (
              <Link
                to={primary.to}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-white text-slate-950 hover:bg-slate-200 active:scale-95 transition-all ${FOCUS_RING}`}
              >
                {primary.label} →
              </Link>
            ) : (
              <button
                type='button'
                onClick={primary.onClick}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-white text-slate-950 hover:bg-slate-200 active:scale-95 transition-all ${FOCUS_RING}`}
              >
                {primary.label} →
              </button>
            )}
            {secondary ? (
              secondary.to ? (
                <Link
                  to={secondary.to}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 active:scale-95 transition-all ${FOCUS_RING}`}
                >
                  {secondary.label}
                </Link>
              ) : (
                <button
                  type='button'
                  onClick={secondary.onClick}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 active:scale-95 transition-all ${FOCUS_RING}`}
                >
                  {secondary.label}
                </button>
              )
            ) : null}
          </div>
        </div>
      </main>

      <footer className='border-t border-slate-800 px-6 py-5 max-w-5xl mx-auto w-full text-center text-xs text-slate-600'>
        <p>{t('landing.footer.copyright')} · {t('landing.footer.tagline')}</p>
      </footer>
    </div>
  )
}
