import { useState, useCallback } from 'react'
import { increment, decrement } from '../hooks/useStickers'
import { gradientClasses, ringClass } from '../utils'

/** @param {{ sticker: any, teamCode: string }} props */
export default function StickerCard({ sticker, teamCode }) {
  const [popping, setPopping] = useState(false)
  const [floats, setFloats]   = useState(/** @type {number[]} */ ([]))

  const handleAdd = useCallback(async (/** @type {React.MouseEvent} */ e) => {
    e.stopPropagation()
    await increment(sticker.id)
    setPopping(true)
    const key = Date.now()
    setFloats(/** @type {function(number[]): number[]} */ f => [...f, key])
    setTimeout(() => setPopping(false), 200)
    setTimeout(() => setFloats(f => f.filter(k => k !== key)), 600)
  }, [sticker.id])

  const handleRemove = useCallback(async (/** @type {React.MouseEvent} */ e) => {
    e.stopPropagation()
    await decrement(sticker.id)
  }, [sticker.id])

  const qty       = sticker.quantity
  const collected = qty > 0
  const dupes     = qty - 1

  const numLabel = String(sticker.number).padStart(2, '0')

  return (
    <div
      aria-label={`Sticker ${sticker.id}, quantity ${qty}`}
      className={[
        'relative select-none rounded-xl flex flex-col',
        'transition-all duration-150',
        collected
          ? `bg-gradient-to-br ${gradientClasses(teamCode)} shadow-lg ${ringClass(teamCode)} ring-2`
          : 'bg-slate-800 ring-1 ring-slate-700',
        popping ? 'animate-pop' : ''
      ].join(' ')}
    >
      {/* Sticker info */}
      <div className="flex flex-col items-center justify-center py-2 px-1 gap-0.5 flex-1">
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

      {/* − / + buttons */}
      <div className={[
        'flex shrink-0 border-t',
        collected ? 'border-white/20' : 'border-slate-700'
      ].join(' ')}>
        <button
          onClick={handleRemove}
          disabled={qty === 0}
          aria-label="Remove sticker"
          className={[
            'flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors',
            qty === 0
              ? 'text-slate-700 cursor-not-allowed'
              : collected
                ? 'text-white/60 hover:bg-white/20 hover:text-white active:bg-white/30'
                : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300 active:bg-slate-600'
          ].join(' ')}
        >
          −
        </button>
        <div className={['w-px', collected ? 'bg-white/20' : 'bg-slate-700'].join(' ')} />
        <button
          onClick={handleAdd}
          aria-label="Add sticker"
          className={[
            'flex-1 flex items-center justify-center h-7 text-base font-bold leading-none transition-colors',
            collected
              ? 'text-white/60 hover:bg-white/20 hover:text-white active:bg-white/30'
              : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300 active:bg-slate-600'
          ].join(' ')}
        >
          +
        </button>
      </div>

      {/* Duplicate badge */}
      {dupes > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[18px] font-black rounded-full min-w-[30px] h-[30px] flex items-center justify-center px-1 shadow-md leading-none">
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
