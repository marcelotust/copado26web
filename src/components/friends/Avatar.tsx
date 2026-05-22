/** Deterministic color from user_id → one of 8 palette entries. */
const PALETTE = [
  'bg-blue-600 text-blue-100',
  'bg-emerald-600 text-emerald-100',
  'bg-amber-600 text-amber-100',
  'bg-rose-600 text-rose-100',
  'bg-violet-600 text-violet-100',
  'bg-cyan-600 text-cyan-100',
  'bg-orange-600 text-orange-100',
  'bg-pink-600 text-pink-100',
]

function colorIndex(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  return hash % PALETTE.length
}

type AvatarProps = {
  userId: string
  displayName: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLS = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }

export default function Avatar({ userId, displayName, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '?'

  const sizeCls = SIZE_CLS[size]
  const colorCls = PALETTE[colorIndex(userId)]

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
      className={`${sizeCls} ${colorCls} rounded-full flex items-center justify-center font-bold shrink-0 select-none ${className}`}
      aria-label={displayName}
    >
      {initials}
    </div>
  )
}
