import { useTeam, useSectionStickers, useSectionProgress } from '../state/stickersStore'
import { useI18n } from '../i18n'
import { displayTeamCode } from '../lib/stickerDisplay'
import FatProgressBar from '../components/FatProgressBar'
import StickerCard from '../components/StickerCard'
import type { Sticker } from '../types/database'

const ALBUM_GRID_CLASS =
  'grid grid-flow-dense grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2'

// Virtual sections (WAP/FWC/CC) have only wide (col-span-2) cards or a mix where
// dense flow on odd-column grids breaks ordering. Use even-column counts so wide
// cards always divide evenly into rows, and drop grid-flow-dense.
const VIRTUAL_ALBUM_GRID_CLASS =
  'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-2'

function isVirtualAlbumSection(code: string): boolean {
  return code === 'WAP' || code === 'FWC' || code === 'CC'
}

function isWideAlbumSticker(s: Sticker, sectionCode: string): boolean {
  if (sectionCode === 'WAP') return s.number >= 0 && s.number <= 3
  if (sectionCode === 'FWC') return true
  return !isVirtualAlbumSection(sectionCode) && s.is_special && s.number === 13
}

function albumStickerWrapperClass(s: Sticker, sectionCode: string): string {
  if (!isWideAlbumSticker(s, sectionCode)) return ''
  if (isVirtualAlbumSection(sectionCode)) return 'col-span-2 self-center'
  return 'flex flex-col self-center max-sm:[grid-column:span_2/-1] sm:col-span-2'
}

function albumStickerCell(sectionCode: string, s: Sticker): 'featured-wide' | undefined {
  return isWideAlbumSticker(s, sectionCode) ? 'featured-wide' : undefined
}

export default function AlbumPage({ sectionCode }: { sectionCode: string }) {
  const { t } = useI18n()
  const team = useTeam(sectionCode)
  const stickers = useSectionStickers(sectionCode)
  const { total, collected } = useSectionProgress(sectionCode)

  if (!team) return null

  const pct = total > 0 ? Math.round((collected / total) * 100) : 0
  const name = t(team.name_key)

  return (
    <div className='flex flex-col h-full'>
      <div className='px-3 pt-3 pb-2 border-b border-slate-700 shrink-0'>
        <div className='mx-auto w-full max-w-6xl flex items-center gap-3'>
          <span className='text-5xl shrink-0 leading-none'>{team.flag}</span>
          <span className='text-base text-slate-400 font-bold uppercase tracking-widest shrink-0'>
            {displayTeamCode(team.code)}
          </span>
          <div className='flex-1 min-w-0'>
            <FatProgressBar
              pct={pct}
              color='bg-emerald-500'
              label={name}
              valueLabel={`${collected}/${total}`}
              height='h-8'
              textSize='text-sm'
            />
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-y-auto p-3'>
        {stickers.length === 0 ? (
          <div className='flex items-center justify-center h-32 text-slate-600 text-sm'>
            {t('grid.loading')}
          </div>
        ) : (
          <div className='mx-auto w-full max-w-6xl'>
            <div className={isVirtualAlbumSection(sectionCode) ? VIRTUAL_ALBUM_GRID_CLASS : ALBUM_GRID_CLASS} data-onboarding-target='album-grid'>
              {stickers.map((s, index) => (
                <div
                  key={s.id}
                  className={albumStickerWrapperClass(s, sectionCode)}
                  data-onboarding-target={index === 0 ? 'album-first-sticker' : undefined}
                >
                  <StickerCard
                    sticker={s}
                    teamCode={sectionCode}
                    albumCell={albumStickerCell(sectionCode, s)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
