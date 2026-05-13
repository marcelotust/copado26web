import { useMemo } from 'react'

// Decorative flag mosaic shown behind the login card. Static — kept local so
// the page can render before the catalog has loaded from Supabase.
const FLAG_EMOJIS = [
  '🇲🇽','🇿🇦','🇰🇷','🇨🇿','🇨🇦','🇧🇦','🇶🇦','🇨🇭',
  '🇧🇷','🇲🇦','🇭🇹','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇺🇸','🇵🇾','🇦🇺','🇹🇷',
  '🇩🇪','🇨🇼','🇨🇮','🇪🇨','🇳🇱','🇯🇵','🇸🇪','🇹🇳',
  '🇧🇪','🇪🇬','🇮🇷','🇳🇿','🇪🇸','🇨🇻','🇸🇦','🇺🇾',
  '🇫🇷','🇸🇳','🇮🇶','🇳🇴','🇦🇷','🇩🇿','🇦🇹','🇯🇴',
  '🇵🇹','🇨🇩','🇺🇿','🇨🇴','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇭🇷','🇬🇭','🇵🇦',
]

const MOSAIC_COUNT = 540

export default function LoginBackgroundMosaic() {
  // useMemo so the matchMedia probe runs once; opacity gradient is computed
  // per-cell against the total length.
  const cells = useMemo(() => {
    const isMobile = window.matchMedia('(max-width: 639px)').matches
    const startOpacity = isMobile ? 0.3 : 0.8
    return Array.from({ length: MOSAIC_COUNT }, (_, i) => ({
      key: i,
      flag: FLAG_EMOJIS[i % FLAG_EMOJIS.length],
      opacity: startOpacity * (1 - i / (MOSAIC_COUNT - 1)),
    }))
  }, [])

  return (
    <div
      className='absolute inset-0 grid pointer-events-none select-none'
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
        alignContent: 'start',
      }}
    >
      {cells.map(({ key, flag, opacity }) => (
        <div
          key={key}
          className='flex items-center justify-center'
          style={{
            height: '48px',
            fontSize: '28px',
            lineHeight: 1,
            opacity,
          }}
        >
          {flag}
        </div>
      ))}
    </div>
  )
}
