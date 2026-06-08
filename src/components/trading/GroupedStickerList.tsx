import type { CatalogSticker, Team } from '../../types/database'
import { pad } from '../../lib/shareText'
import { displayTeamCode } from '../../lib/stickerDisplay'
import { groupStickerIds } from '../../pages/trade/groupStickerIds'

type Props = {
  ids: string[]
  catalog: Map<string, CatalogSticker>
  teams: Team[]
  groupLabel: (key: string) => string
}

export default function GroupedStickerList({ ids, catalog, teams, groupLabel }: Props) {
  const groups = groupStickerIds(ids, catalog, teams)
  return (
    <div className='flex flex-col gap-2'>
      {groups.map(({ groupKey, rows }) => (
        <div key={groupKey}>
          <p className='text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-0.5'>
            {groupLabel(groupKey)}
          </p>
          {rows.map(({ team, numbers }) => (
            <p key={team.code} className='text-xs text-slate-300 leading-relaxed'>
              <span className='mr-1'>{team.flag}</span>
              <span className='font-medium text-slate-400 mr-1'>{displayTeamCode(team.code)}</span>
              {numbers.map(n => pad(n)).join(' · ')}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}
