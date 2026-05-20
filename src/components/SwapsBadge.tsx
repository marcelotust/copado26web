import { useMemo } from 'react'

// Stacked mini-cards badge showing extra (swappable) sticker count in the sidebar.
// Smaller than DuplicatesBadge (sidebar context) with a larger number label.

const W = 18
const H = 25

const BACK_LAYERS = [
  { rotate: -14, tx: -3, ty: -8 },
  { rotate:  -8, tx: -2, ty:  -4 },
  { rotate:  10, tx:  6, ty:   6 },
  { rotate:   5, tx:  3, ty:   3 },
] as const

const CARD_BASE: React.CSSProperties = {
  position: 'absolute',
  width: W,
  height: H,
  border: '1.5px solid #ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
}

const BLUE = '#48baf4'

type SwapsBadgeProps = {
  swaps: number
}

export default function SwapsBadge({ swaps }: SwapsBadgeProps) {
  const topRotate = useMemo(() => (Math.random() - 0.5) * 10, [])
  const visibleBack = Math.min(swaps - 1, BACK_LAYERS.length)
  const layers = BACK_LAYERS.slice(BACK_LAYERS.length - visibleBack)

  return (
    <div
      className='relative shrink-0'
      style={{ width: W, height: H }}
    >
      {layers.map((layer, i) => (
        <div
          key={i}
          style={{
            ...CARD_BASE,
            background: BLUE,
            transform: `rotate(${layer.rotate}deg) translate(${layer.tx}px, ${layer.ty}px)`,
          }}
        />
      ))}

      <div
        style={{
          ...CARD_BASE,
          position: 'relative',
          background: BLUE,
          transform: `rotate(${topRotate}deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: swaps >= 10 ? '11px' : '14px',
            fontWeight: 900,
            lineHeight: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            fontFamily: "'Bebas Neue', Impact, sans-serif",
          }}
        >
          {swaps > 9 ? '9+' : `+${swaps}`}
        </span>
      </div>
    </div>
  )
}
