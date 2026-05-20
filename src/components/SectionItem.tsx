import { forwardRef } from 'react'
import { teamColor } from '../utils'
import { useI18n } from '../i18n'
import { useSectionProgress, useSectionSwapCount } from '../state/stickersStore'
import type { Team } from '../types/database'
import SectionItemSvg from './SectionItemSvg'
import SwapsBadge from './SwapsBadge'

const CIRC = 2 * Math.PI * 11

type SectionItemProps = {
  team: Team
  active: boolean
  onClick: () => void
}

const SectionItem = forwardRef<HTMLButtonElement, SectionItemProps>(function SectionItem(
  { team, active, onClick },
  ref,
) {
  const { t } = useI18n()
  const { total, collected } = useSectionProgress(team.code)
  const swaps = useSectionSwapCount(team.code)
  const pct = total > 0 ? collected / total : 0
  const dash = pct * CIRC
  const done = collected === total && total > 0
  const name = t(team.name_key)
  const color = teamColor(team.code)

  const pctRounded = Math.round(pct * 100)
  const barFill = done ? '#34d399' : pct > 0 ? '#94a3b8' : undefined

  return (
    <button
      ref={ref}
      onClick={onClick}
      title={`${name} (${collected}/${total})`}
      className={[
        'w-full flex items-center rounded-lg text-left transition-all duration-100',
        'hover:bg-slate-700/60 active:scale-95',
        active ? 'bg-slate-700 ring-1 ring-slate-600' : '',
        'flex-col justify-center gap-0.5 px-1 py-2 sm:flex-row sm:gap-3 sm:px-3 sm:py-2.5',
      ].join(' ')}
    >
      <div className='flex flex-row items-center justify-center gap-1.5 w-full sm:contents'>
        <span className='text-xl shrink-0 leading-none w-7 text-center'>{team.flag}</span>
        <div
          className='flex h-7 w-[3px] shrink-0 flex-col justify-end overflow-hidden rounded-full bg-slate-800 sm:hidden'
          aria-hidden
        >
          <div
            className='w-full min-h-0 rounded-full transition-[height] duration-300 ease-out'
            style={{
              height: `${pctRounded}%`,
              backgroundColor: barFill,
            }}
          />
        </div>
      </div>

      <span
        className={[
          'font-bold font-mono tracking-wide leading-none block text-center sm:hidden',
          'text-[10px]',
          active ? `text-${color}-300` : 'text-slate-500',
        ].join(' ')}
      >
        {team.code}
      </span>

      <div className='hidden sm:flex flex-1 min-w-0 flex-col'>
        <span
          className={[
            'text-[13px] font-bold font-mono tracking-wide leading-none block',
            active ? `text-${color}-300` : 'text-slate-400',
          ].join(' ')}
        >
          {team.code}
        </span>
        <span className='text-[11px] text-slate-600 truncate block leading-tight mt-0.5'>
          {name}
        </span>
      </div>

      {/* Fixed-width right column keeps the ring always in the same column */}
      <div className='hidden sm:flex items-center gap-1.5 shrink-0' style={{ width: 56 }}>
        <SectionItemSvg dash={dash} done={done} pct={pct} />
        {swaps > 0 && <SwapsBadge swaps={swaps} />}
      </div>
    </button>
  )
})

export default SectionItem
