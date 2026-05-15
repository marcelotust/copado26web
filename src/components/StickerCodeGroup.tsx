import type { ReactNode } from 'react'
import { teamColors } from '../utils'

type StickerCodeGroupProps = {
  teamCode: string
  flag: string
  name: string
  count: number
  countLabel: string
  children: ReactNode
}

export default function StickerCodeGroup({
  teamCode,
  flag,
  name,
  count,
  countLabel,
  children,
}: StickerCodeGroupProps) {
  const { primary, secondary } = teamColors(teamCode)

  return (
    <section
      className='overflow-hidden rounded-lg border border-slate-800 bg-slate-900/45'
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 18rem' }}
    >
      <div className='flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-3 py-2'>
        <span className='text-lg leading-none'>{flag || '🏳️'}</span>
        <span className='min-w-0 truncate text-sm font-bold text-white'>{name}</span>
        <span className='shrink-0 text-xs text-slate-500'>
          · {count} {countLabel}
        </span>
        <span
          className='ml-auto shrink-0 text-xs font-bold'
          style={{ color: primary }}
        >
          {teamCode}
        </span>
      </div>
      <div
        className='h-0.5'
        style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }}
      />
      <div className='grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-2 p-3 sm:grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))]'>
        {children}
      </div>
    </section>
  )
}
