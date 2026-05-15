import type { MouseEvent } from 'react'
import StickerButtons from './StickerButtons'
import StickerFace from './StickerFace'

const PANINI_BLUE = '#1a56c4'

type AlbumFace = 'featured-wide' | 'featured-tall' | 'default'

type SilhouetteType = 'player' | 'team-photo' | 'shield' | 'none'

type StickerCardCaptionColumnProps = {
  teamCode: string
  collected: boolean
  primary: string
  secondary: string
  numLabel: string
  albumFace: AlbumFace
  silhouetteType: SilhouetteType
  displayLabel: string | null
  qty: number
  onAdd: (e: MouseEvent) => void
  onRemove: (e: MouseEvent) => void
}

export default function StickerCardCaptionColumn({
  teamCode,
  collected,
  primary,
  secondary,
  numLabel,
  albumFace,
  silhouetteType,
  displayLabel,
  qty,
  onAdd,
  onRemove,
}: StickerCardCaptionColumnProps) {
  return (
    <div className='relative z-10 flex flex-col h-full min-h-0'>
      <StickerFace
        numLabel={numLabel}
        teamCode={teamCode}
        collected={collected}
        primary={primary}
        secondary={secondary}
        albumFace={albumFace}
        silhouetteType={silhouetteType}
      />

      <div
        className='mx-1.5 mb-1 shrink-0 rounded-lg px-2 py-1 text-center'
        style={{ background: collected ? PANINI_BLUE : `${primary}25` }}
      >
        <p
          className='text-[11px] font-bold leading-tight truncate'
          style={{ color: collected ? '#fff' : '#94a3b8' }}
          title={displayLabel ?? teamCode}
        >
          {displayLabel ?? teamCode}
        </p>
      </div>

      <StickerButtons qty={qty} collected={collected} onAdd={onAdd} onRemove={onRemove} />
    </div>
  )
}
