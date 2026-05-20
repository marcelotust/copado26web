import { useId } from 'react'

const SILVER_STOPS = (
  <>
    <stop offset="0%"      stopColor="#f9f9f9" />
    <stop offset="22.22%"  stopColor="#cbcbcb" />
    <stop offset="28.46%"  stopColor="#808080" />
    <stop offset="35.31%"  stopColor="#ffffff" />
    <stop offset="40.79%"  stopColor="#d2d2d2" />
    <stop offset="56.77%"  stopColor="#969696" />
    <stop offset="100%"    stopColor="#f9f9f9" />
  </>
)

export function SilhouetteSvg({
  viewBox,
  pathD,
  className,
  foilTint,
  collected,
  style,
}: {
  viewBox: string
  pathD: string
  className?: string
  foilTint?: boolean
  collected?: boolean
  style?: React.CSSProperties
}) {
  const uid = useId()
  const gradId = `sg${uid}`
  const clipId = `sc${uid}`
  const [vx, vy, vw, vh] = viewBox.split(' ').map(Number)

  const baseFill = collected ? '#f0f5ff' : '#96afd8'

  return (
    <svg viewBox={viewBox} className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        {foilTint && (
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={vx} y1={vy + vh} x2={vx + vw} y2={vy}>
            {SILVER_STOPS}
          </linearGradient>
        )}
        <clipPath id={clipId}>
          <path d={pathD} />
        </clipPath>
      </defs>
      <rect
        x={vx} y={vy} width={vw} height={vh}
        fill={foilTint ? `url(#${gradId})` : baseFill}
        clipPath={`url(#${clipId})`}
      />
    </svg>
  )
}
