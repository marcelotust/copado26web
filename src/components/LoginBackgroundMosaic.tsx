import { useEffect, useRef } from 'react'

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
const CELL = 48
const FONT_SIZE = 28

export default function LoginBackgroundMosaic() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const paint = () => {
      const rect = wrap.getBoundingClientRect()
      const w = Math.max(1, Math.round(rect.width))
      const h = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const isMobile = window.matchMedia('(max-width: 639px)').matches
      const startOpacity = isMobile ? 0.3 : 0.8
      const numCols = Math.max(1, Math.floor(w / CELL))

      ctx.font = `${FONT_SIZE}px sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const denom = MOSAIC_COUNT - 1
      for (let i = 0; i < MOSAIC_COUNT; i++) {
        const col = i % numCols
        const row = Math.floor(i / numCols)
        const x = col * CELL + CELL / 2
        const y = row * CELL + CELL / 2
        if (y - CELL / 2 > h) break

        ctx.globalAlpha = startOpacity * (1 - i / denom)
        ctx.fillText(FLAG_EMOJIS[i % FLAG_EMOJIS.length], x, y)
      }
      ctx.globalAlpha = 1
    }

    const ro = new ResizeObserver(paint)
    ro.observe(wrap)
    paint()

    return () => {
      ro.disconnect()
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className='absolute inset-0 pointer-events-none select-none overflow-hidden'
    >
      <canvas ref={canvasRef} className='block h-full w-full' aria-hidden />
    </div>
  )
}
