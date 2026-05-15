import type { CSSProperties } from 'react'
import { teamColors } from '../utils'
import { stickerCardShellStyle } from './stickerCardShellStyle'

type Props = {
  code: string
  num: string
  collected: boolean
  style?: CSSProperties
}

export default function LandingStickerCard({ code, num, collected, style }: Props) {
  const { primary, secondary } = teamColors(code)
  const numLabel = num.padStart(2, '0')
  const { boxShadow } = stickerCardShellStyle({ collected, useEscudoSheen: false, useWideCyanSheen: false, primary })

  return (
    <div
      className='absolute select-none pointer-events-none rounded-xl overflow-hidden shadow-2xl'
      style={{ width: 76, ...style }}
    >
      <div
        className='w-full aspect-[2/3] flex flex-col'
        style={{
          background: `linear-gradient(160deg, ${primary}28 0%, #0f172a 100%)`,
          backgroundColor: '#0f172a',
          boxShadow,
        }}
      >
        {/* Top accent bar */}
        <div className='h-1 shrink-0' style={{ background: `linear-gradient(to right, ${primary}, ${secondary})` }} />

        {/* Card body */}
        <div className='flex-1 flex flex-col items-center justify-center gap-1 px-1'>
          <span
            className='font-black text-[22px] leading-none'
            style={{ color: collected ? primary : `${primary}55` }}
          >
            {numLabel}
          </span>
          <span className='text-[8px] font-bold tracking-wider text-slate-500 uppercase'>{code}</span>
        </div>

        {/* Bottom status bar */}
        <div
          className='mx-1.5 mb-1.5 rounded-lg py-1 text-center'
          style={{ background: collected ? `${primary}30` : '#1e293b' }}
        >
          <span
            className='text-[8px] font-bold'
            style={{ color: collected ? primary : '#475569' }}
          >
            {collected ? '✓ colada' : 'faltando'}
          </span>
        </div>
      </div>
    </div>
  )
}
