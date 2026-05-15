import type { ReactNode } from 'react'

type StickerListPageHeaderProps = {
  title: string
  summary: ReactNode
  icon: string
  accentColor: string
  actions?: ReactNode
}

export default function StickerListPageHeader({
  title,
  summary,
  icon,
  accentColor,
  actions,
}: StickerListPageHeaderProps) {
  return (
    <div className='shrink-0 border-b border-slate-800 bg-slate-900/95 px-4 py-3'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 items-center gap-3'>
          <span
            className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-2xl'
            style={{
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}35`,
            }}
            aria-hidden
          >
            {icon}
          </span>
          <div className='min-w-0'>
            <h2 className='truncate text-lg font-bold text-white'>{title}</h2>
            <p className='text-sm leading-snug text-slate-400'>{summary}</p>
          </div>
        </div>

        {actions && (
          <div className='shrink-0 sm:pl-4'>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
