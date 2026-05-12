// The circular number + team-code badge in the center of every sticker card.
// Heavily styled — split out so StickerCard can stay readable.

type StickerFaceProps = {
  numLabel: string
  teamCode: string
  collected: boolean
  primary: string
  secondary: string
}

export default function StickerFace({
  numLabel, teamCode, collected, primary, secondary,
}: StickerFaceProps) {
  return (
    <div className='flex-1 flex items-center justify-center px-3 pt-3 pb-1'>
      <div
        className='w-full aspect-square rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-150'
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
            fontSize: 'clamp(26px, 8vw, 38px)',
            color: collected ? '#fff' : '#64748b',
            textShadow: collected ? '0 1px 4px #0007, 0 0 10px #0004' : 'none',
          }}
        >
          {numLabel}
        </span>
        <span
          className='font-black tracking-widest uppercase leading-none'
          style={{
            fontSize: 'clamp(9px, 2.5vw, 13px)',
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
