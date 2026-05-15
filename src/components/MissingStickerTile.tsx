import { pad } from '../lib/shareText'
import { teamColors } from '../utils'

type MissingStickerTileProps = {
  teamCode: string
  number: number
}

export default function MissingStickerTile({ teamCode, number }: MissingStickerTileProps) {
  const { primary, secondary } = teamColors(teamCode)
  const numLabel = pad(number)

  return (
    <div
      className='relative min-h-[3.75rem] overflow-hidden rounded-lg border bg-slate-950/45 px-2 py-2'
      style={{
        borderColor: `${primary}35`,
        backgroundImage: `linear-gradient(155deg, ${primary}18, ${secondary}10 70%, rgba(15, 23, 42, 0.72))`,
      }}
      title={`${teamCode} ${numLabel}`}
    >
      <span className='block text-[0.65rem] font-bold leading-none text-slate-400'>
        {teamCode}
      </span>
      <span className='mt-1 block font-mono text-xl font-black leading-none text-white'>
        {numLabel}
      </span>
    </div>
  )
}
