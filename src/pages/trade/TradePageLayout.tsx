import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n'

type TradePageLayoutProps = {
  session: Session | null
  title: string
  children: ReactNode
}

export default function TradePageLayout({ session, title, children }: TradePageLayoutProps) {
  const { t } = useI18n()
  const backTo = session ? '/dashboard' : '/'
  const backLabel = session ? t('trade.backApp') : t('trade.backHome')

  return (
    <div className='min-h-screen bg-slate-950 text-white flex flex-col'>
      <header className='shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/95'>
        <Link
          to={backTo}
          className='text-slate-400 hover:text-white text-sm font-medium shrink-0'
        >
          ← {backLabel}
        </Link>
        <h1 className='text-base font-bold text-white truncate'>{title}</h1>
      </header>
      <main className='flex-1 min-h-0 overflow-y-auto p-4 max-w-lg mx-auto w-full'>{children}</main>
    </div>
  )
}
