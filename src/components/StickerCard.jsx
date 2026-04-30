import { useState, useCallback } from 'react'
import { increment, decrement } from '../hooks/useStickers'
import { gradientClasses, ringClass } from '../utils'

export default function StickerCard({ sticker, teamCode }) {
  const [popping, setPopping] = useState(false)
  const [floats, setFloats]   = useState([])

  const handleClick = useCallback(async () => {
    await increment(sticker.id)
    setPopping(true)
    const key = Date.now()
    setFloats(f => [...f, key])
    setTimeout(() => setPopping(false), 200)
    setTimeout(() => setFloats(f => f.filter(k => k !== key)), 600)
  }, [sticker.id])

  const handleRightClick = useCallback(async (e) => {
    e.preventDefault()
    await decrement(sticker.id)
  }, [sticker.id])

  const qty      = sticker.quantity
  const collected = qty > 0
  const dupes     = qty - 1

  const numLabel = String(sticker.number).padStart(2, '0')

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleRightClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-label={`Sticker ${sticker.id}, quantity ${qty}`}
      className={[
        'relative select-none cursor-pointer rounded-xl overflow-hidden',
        'transition-all duration-150 active:scale-95',
        collected
          ? `bg-gradient-to-br ${gradientClasses(teamCode)} shadow-lg hover:scale-105 hover:shadow-xl ${ringClass(teamCode)} ring-2`
          : 'bg-slate-800 hover:bg-slate-700 ring-1 ring-slate-700',
        popping ? 'animate-pop' : ''
      ].join(' ')}
    >
      {/* Sticker number */}
      <div className="flex flex-col items-center justify-center py-3 px-1 gap-0.5">
        <span className={[
          'font-black leading-none tabular-nums',
          collected ? 'text-white text-2xl drop-shadow' : 'text-slate-500 text-xl'
        ].join(' ')}>
          {numLabel}
        </span>
        <span className={[
          'text-[9px] font-semibold tracking-widest uppercase',
          collected ? 'text-white/70' : 'text-slate-600'
        ].join(' ')}>
          {teamCode}
        </span>
      </div>

      {/* Duplicate badge */}
      {dupes > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md leading-none">
          +{dupes}
        </span>
      )}

      {/* Floating +1 animations */}
      {floats.map(key => (
        <span
          key={key}
          className="absolute inset-0 flex items-center justify-center pointer-events-none animate-floatUp text-white font-black text-sm"
        >
          +1
        </span>
      ))}
    </div>
  )
}
