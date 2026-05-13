import { useTeam, useSectionStickers, useSectionProgress } from '../state/stickersStore'
import { teamColors } from '../utils'
import { useI18n } from '../i18n'
import StickerCard from '../components/StickerCard'
import type { Sticker } from '../types/database'

const ALBUM_GRID_CLASS =
  'grid grid-flow-dense grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2'

function isVirtualAlbumSection(code: string): boolean {
  return code === 'WAP' || code === 'FWC' || code === 'CC'
}

function albumStickerWrapperClass(s: Sticker, sectionCode: string): string {
  const bits = ['min-h-0 h-full']
  if (isVirtualAlbumSection(sectionCode)) return bits.join(' ')
  if (s.is_special && s.number === 1) bits.push('col-start-1 row-start-1 row-span-2')
  // #13: no mobile (3 col) ancora nas duas últimas colunas pra ficar na mesma linha que a #12;
  // a partir de sm, só ocupa 2 colunas no fluxo normal (sem colar na direita da página).
  if (s.is_special && s.number === 13) {
    bits.push('max-sm:[grid-column:span_2/-1] sm:col-span-2')
  }
  return bits.join(' ')
}

function albumStickerCell(sectionCode: string, s: Sticker): 'featured-tall' | 'featured-wide' | undefined {
  if (isVirtualAlbumSection(sectionCode)) return undefined
  if (!s.is_special) return undefined
  if (s.number === 1) return 'featured-tall'
  if (s.number === 13) return 'featured-wide'
  return undefined
}

export default function AlbumPage({ sectionCode }: { sectionCode: string }) {
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
          <div className={ALBUM_GRID_CLASS}>
            {stickers.map((s) => (
              <div
                key={s.id}
                className={albumStickerWrapperClass(s, sectionCode)}
              >
                <StickerCard
                  sticker={s}
                  teamCode={sectionCode}
                  albumCell={albumStickerCell(sectionCode, s)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
