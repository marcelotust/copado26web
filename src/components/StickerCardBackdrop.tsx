import type { MouseEvent } from 'react'
import FloatPopups from './FloatPopups'
import StickerCardCaptionColumn from './StickerCardCaptionColumn'
import StickerCardSheens from './StickerCardSheens'
import { stickerCardShellStyle } from './stickerCardShellStyle'

type AlbumFace = 'featured-wide' | 'default'

type SilhouetteType = 'player' | 'team-photo' | 'shield' | 'ball' | 'trophy' | 'none'

type StickerCardBackdropProps = {
  teamCode: string
  collected: boolean
  useEscudoSheen: boolean
  useWideCyanSheen: boolean
  primary: string
  secondary: string
  numLabel: string
  albumFace: AlbumFace
  silhouetteType: SilhouetteType
  labelColor: string
  displayLabel: string | null
  qty: number
  floats: number[]
  removals: number[]
  onAdd: (e: MouseEvent) => void
  onRemove: (e: MouseEvent) => void
}

export default function StickerCardBackdrop({
  teamCode,
  collected,
  useEscudoSheen,
  useWideCyanSheen,
  primary,
  secondary,
  numLabel,
  albumFace,
  silhouetteType,
  labelColor,
  displayLabel,
  qty,
  floats,
  removals,
  onAdd,
  onRemove,
}: StickerCardBackdropProps) {
  const shellStyle = stickerCardShellStyle({ collected, useEscudoSheen, useWideCyanSheen, primary })

  return (
    <div
      className={[
        'absolute inset-0 overflow-hidden flex flex-col z-10 transition-all duration-150',
        collected ? 'shadow-lg rounded-none' : 'rounded-xl',
        useEscudoSheen && 'rounded-2xl ring-2 ring-amber-400/55 ring-inset',
        useWideCyanSheen && 'rounded-2xl ring-2 ring-cyan-200/25 ring-inset',
      ].join(' ')}
      style={shellStyle}
    >
      <div
        className='absolute inset-0'
        style={{
          background: collected
            ? 'linear-gradient(160deg, #9bd9f9 0%, #48baf4 100%)'
            : '#0f172a',
        }}
      />
      <div
        className='absolute inset-0'
        style={{
          background: collected
            ? `linear-gradient(160deg, ${primary}18 0%, ${secondary}10 100%)`
            : `linear-gradient(160deg, ${primary}20 0%, ${secondary}14 100%)`,
        }}
      />
      <StickerCardSheens
        useEscudoSheen={useEscudoSheen}
        useWideCyanSheen={useWideCyanSheen}
        primary={primary}
        secondary={secondary}
      />

      <StickerCardCaptionColumn
        teamCode={teamCode}
        collected={collected}
        primary={primary}
        secondary={secondary}
        numLabel={numLabel}
        albumFace={albumFace}
        silhouetteType={silhouetteType}
        labelColor={labelColor}
        displayLabel={displayLabel}
        qty={qty}
        onAdd={onAdd}
        onRemove={onRemove}
      />

      <FloatPopups floats={floats} removals={removals} />
    </div>
  )
}
