import { useTeams } from '../state/stickersStore'
import { useI18n } from '../i18n'
import SectionItem from './SectionItem'
import type { Team } from '../types/database'

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

  return (
    <aside className='w-14 sm:w-52 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden'>
      <nav className='flex-1 overflow-y-auto py-1 px-1'>
        {grouped.map(({ key, teams }) => {
          const label = key.length === 1
            ? `${t('sidebar.group')} ${key}`
            : t(`sections.${key.toLowerCase()}`)
          return (
            <div key={key} className='mb-1'>
              <p className='hidden sm:block text-[10px] text-slate-600 font-bold tracking-widest uppercase px-2 pt-2 pb-1'>
                {label}
              </p>
              {teams.map((team) => (
                <SectionItem
                  key={team.code}
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
  )
}
