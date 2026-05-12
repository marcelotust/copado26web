import { useTeam, useSectionStickers, useSectionProgress } from '../state/stickersStore'
import { teamColors } from '../utils'
import { useI18n } from '../i18n'
import StickerCard from '../components/StickerCard'

/** @param {{ sectionCode: string }} props */
export default function AlbumPage({ sectionCode }) {
  const { t } = useI18n()
  const team = useTeam(sectionCode)
  const stickers = useSectionStickers(sectionCode)
  const { total, collected } = useSectionProgress(sectionCode)

  if (!team) return null

  const pct = total > 0 ? Math.round((collected / total) * 100) : 0
  const { primary, secondary } = teamColors(sectionCode)
  const name = t(team.name_key)
  const conf = t(`conf.${team.conf}`)

  return (
    <div className='flex flex-col h-full'>
      <div className='flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-800 shrink-0'>
        <span className='text-3xl'>{team.flag}</span>
        <div className='flex-1 min-w-0'>
          <h2 className='text-white font-bold text-lg leading-tight truncate'>{name}</h2>
          <p className='text-slate-400 text-xs'>
            {team.code} · {conf}
          </p>
        </div>
        <div className='text-right shrink-0'>
          <p className='font-bold text-sm' style={{ color: primary }}>{collected}/{total}</p>
          <p className='text-slate-500 text-xs'>{pct}%</p>
        </div>
      </div>

      <div className='h-2 bg-slate-800 shrink-0'>
        <div
          className='h-full transition-all duration-500'
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, ${primary}, ${secondary})`,
          }}
        />
      </div>

      <div className='flex-1 overflow-y-auto p-3'>
        {stickers.length === 0 ? (
          <div className='flex items-center justify-center h-32 text-slate-600 text-sm'>
            {t('grid.loading')}
          </div>
        ) : (
          <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2'>
            {stickers.map((s) => (
              <StickerCard key={s.id} sticker={s} teamCode={sectionCode} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
