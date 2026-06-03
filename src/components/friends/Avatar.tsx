import { avatarColorPalette } from '../../constants/avatarColorPalette'

function hashIndex(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  return hash % avatarColorPalette.length
}

type AvatarProps = {
  userId: string
  displayName: string
  paletteId?: number | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLS = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }

export default function Avatar({ userId, displayName, paletteId, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '?'

  const sizeCls = SIZE_CLS[size]

  const palette = paletteId !== null && paletteId !== undefined
    ? (avatarColorPalette.find(p => p.id === paletteId) ?? avatarColorPalette[hashIndex(userId)])
    : avatarColorPalette[hashIndex(userId)]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${sizeCls} rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeCls} rounded-full flex items-center justify-center font-bold shrink-0 select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, ${palette.firstColor}, ${palette.secondColor})`,
        color: palette.color,
      }}
      aria-label={displayName}
    >
      {initials}
    </div>
  )
}
