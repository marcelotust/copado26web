import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { useTeams } from '../state/stickersStore'
import { useI18n } from '../i18n'
import SectionItem from './SectionItem'
import type { Team } from '../types/database'

const STORAGE_KEY = 'sidebar-mobile-expanded'

type TeamGroup = { key: string; teams: Team[] }

/** Groups consecutive teams that share the same group_letter; virtual sections
 * (group_letter === null) form their own one-team group keyed by team code. */
function groupTeams(teams: Team[]): TeamGroup[] {
  const out: TeamGroup[] = []
  for (const team of teams) {
    const key = team.group_letter ?? team.code
    const last = out[out.length - 1]
    if (last && last.key === key) last.teams.push(team)
    else out.push({ key, teams: [team] })
  }
  return out
}

type SidebarProps = {
  selected: string
  onSelect: (code: string) => void
}

export default function Sidebar({ selected, onSelect }: SidebarProps) {
  const { t } = useI18n()
  const teams = useTeams()
  const grouped = groupTeams(teams)
  const selectedBtnRef = useRef<HTMLButtonElement>(null)

  const [mobileExpanded, setMobileExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(mobileExpanded))
    } catch {
      // localStorage unavailable (e.g. private browsing restrictions)
    }
  }, [mobileExpanded])

  useLayoutEffect(() => {
    const el = selectedBtnRef.current
    if (!el) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [selected])

  function handleSelect(code: string) {
    onSelect(code)
    setMobileExpanded(false)
  }

  return (
    <>
      {/* Desktop sidebar — always fully expanded, layout unchanged */}
      <aside className='hidden sm:flex w-52 shrink-0 bg-slate-900 border-r border-slate-800 flex-col overflow-hidden'>
        <nav className='flex-1 overflow-y-auto py-1 px-1'>
          {grouped.map(({ key, teams }, index) => {
            const label = key.length === 1
              ? `${t('sidebar.group')} ${key}`
              : t(`sections.${key.toLowerCase()}`)
            return (
              <div
                key={key}
                className={[
                  'mb-1',
                  index > 0 && 'border-t border-slate-800 pt-2 mt-1.5 sm:border-t-0 sm:pt-0 sm:mt-0',
                ].filter(Boolean).join(' ')}
              >
                <p className='text-[10px] text-slate-600 font-bold tracking-widest uppercase px-2 pt-2 pb-1'>
                  {label}
                </p>
                {teams.map((team) => (
                  <SectionItem
                    key={team.code}
                    ref={selected === team.code ? selectedBtnRef : undefined}
                    team={team}
                    active={selected === team.code}
                    onClick={() => onSelect(team.code)}
                  />
                ))}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Mobile sidebar — compact strip with toggle button */}
      <aside className='sm:hidden w-14 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden'>
        {/* Toggle button stays fixed at top while list scrolls */}
        <button
          className='shrink-0 flex items-center justify-center h-10 w-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-b border-slate-800'
          onClick={() => setMobileExpanded(v => !v)}
          aria-label={t(mobileExpanded ? 'sidebar.collapse' : 'sidebar.expand')}
        >
          <span className='text-base leading-none'>{mobileExpanded ? '✕' : '☰'}</span>
        </button>

        <nav className='flex-1 overflow-y-auto py-1 px-1'>
          {grouped.map(({ key, teams }, index) => (
            <div
              key={key}
              className={[
                'mb-1',
                index > 0 && 'border-t border-slate-800 pt-2 mt-1.5',
              ].filter(Boolean).join(' ')}
            >
              {teams.map((team) => (
                <SectionItem
                  key={team.code}
                  ref={selected === team.code ? selectedBtnRef : undefined}
                  team={team}
                  active={selected === team.code}
                  onClick={() => handleSelect(team.code)}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile expanded drawer overlay */}
      {mobileExpanded && (
        <div
          className='sm:hidden fixed inset-0 z-40 flex'
          onClick={() => setMobileExpanded(false)}
        >
          <div className='absolute inset-0 bg-black/60' aria-hidden />

          <aside
            className='relative z-50 w-52 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden h-full'
            onClick={e => e.stopPropagation()}
          >
            <button
              className='shrink-0 flex items-center justify-center h-10 w-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-b border-slate-800'
              onClick={() => setMobileExpanded(false)}
              aria-label={t('sidebar.collapse')}
            >
              <span className='text-base leading-none'>✕</span>
            </button>

            <nav className='flex-1 overflow-y-auto py-1 px-1'>
              {grouped.map(({ key, teams }, index) => {
                const label = key.length === 1
                  ? `${t('sidebar.group')} ${key}`
                  : t(`sections.${key.toLowerCase()}`)
                return (
                  <div
                    key={key}
                    className={[
                      'mb-1',
                      index > 0 && 'border-t border-slate-800 pt-2 mt-1.5',
                    ].filter(Boolean).join(' ')}
                  >
                    <p className='text-[10px] text-slate-600 font-bold tracking-widest uppercase px-2 pt-2 pb-1'>
                      {label}
                    </p>
                    {teams.map((team) => (
                      <SectionItem
                        key={team.code}
                        ref={selected === team.code ? selectedBtnRef : undefined}
                        team={team}
                        active={selected === team.code}
                        onClick={() => handleSelect(team.code)}
                        variant='full'
                      />
                    ))}
                  </div>
                )
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
