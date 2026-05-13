// The circular number + team-code badge in the center of every sticker card.
// Heavily styled — split out so StickerCard can stay readable.

type AlbumFace = 'default' | 'featured-wide' | 'featured-tall'

type StickerFaceProps = {
  numLabel: string
  teamCode: string
  collected: boolean
  primary: string
  secondary: string
  /** Album grid: wide cell caps the disc so it does not clip one row tall */
  albumFace?: AlbumFace
}

export default function StickerFace({
  numLabel, teamCode, collected, primary, secondary,
  albumFace = 'default',
}: StickerFaceProps) {
  const wrapPad =
    albumFace === 'featured-wide'
      ? 'px-3 py-2'
      : albumFace === 'featured-tall'
        ? 'px-2.5 pt-3 pb-2'
        : 'px-3 pt-3 pb-1'

  const circleClass =
    albumFace === 'featured-wide'
      ? 'aspect-square h-full max-h-[9.25rem] w-auto max-w-[min(9.25rem,100%)] shrink-0 mx-auto'
      : albumFace === 'featured-tall'
        ? 'aspect-square w-full max-w-[min(100%,10.5rem)] mx-auto'
        : 'w-full aspect-square'

  const numSize =
    albumFace === 'featured-wide'
      ? { fontSize: 'clamp(22px, 5.5vw, 34px)' }
      : albumFace === 'featured-tall'
        ? { fontSize: 'clamp(28px, 10vw, 42px)' }
        : { fontSize: 'clamp(26px, 8vw, 38px)' }

  const codeSize =
    albumFace === 'featured-wide'
      ? { fontSize: 'clamp(9px, 2.2vw, 12px)' }
      : albumFace === 'featured-tall'
        ? { fontSize: 'clamp(10px, 3vw, 14px)' }
        : { fontSize: 'clamp(9px, 2.5vw, 13px)' }

  return (
    <div className={`flex-1 flex min-h-0 items-center justify-center ${wrapPad}`}>
      <div
        className={`${circleClass} rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-150`}
        style={collected
          ? {
              background: `linear-gradient(135deg, ${primary} 50%, ${secondary} 50%)`,
              boxShadow: `0 3px 16px ${primary}55, inset 0 1px 0 #ffffff30`,
            }
          : {
              background: `linear-gradient(135deg, ${primary}40 50%, ${secondary}30 50%)`,
              boxShadow: `inset 0 1px 0 #ffffff08, 0 2px 8px ${primary}20`,
            }}
      >
        <span
          className='font-black leading-none tabular-nums'
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            ...numSize,
            color: collected ? '#fff' : '#64748b',
            textShadow: collected ? '0 1px 4px #0007, 0 0 10px #0004' : 'none',
          }}
        >
          {numLabel}
        </span>
        <span
          className='font-black tracking-widest uppercase leading-none'
          style={{
            ...codeSize,
            color: collected ? '#fff' : '#475569',
            textShadow: collected ? '0 1px 3px #0006' : 'none',
          }}
        >
          {teamCode}
        </span>
      </div>
    </div>
  )
}
