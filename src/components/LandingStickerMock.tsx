type Props = {
  code: string
  flag: string
  num: string
  collected: boolean
  style?: React.CSSProperties
}

export default function LandingStickerMock({ code, flag, num, collected, style }: Props) {
  return (
    <div className='absolute rounded-xl overflow-hidden shadow-2xl select-none' style={{ width: 76, ...style }}>
      <div
        className='w-full aspect-[2/3] flex flex-col'
        style={{
          background: collected
            ? 'linear-gradient(160deg, #1e3a5f 0%, #0d2818 100%)'
            : 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          border: collected ? '2px solid #3b82f6' : '1.5px solid #1e293b',
          boxShadow: collected
            ? '0 0 0 3px #3b82f620, 0 8px 32px #3b82f630'
            : '0 4px 16px #00000060',
        }}
      >
        <div className='flex-1 flex flex-col items-center justify-center gap-1 pt-2'>
          <span style={{ fontSize: 26 }}>{flag}</span>
          <span className='text-[9px] font-bold text-slate-400'>{code}</span>
          <span className='text-[10px] font-black' style={{ color: collected ? '#60a5fa' : '#475569' }}>
            {num}
          </span>
        </div>
        <div
          className='mx-1.5 mb-1.5 rounded-lg py-0.5 text-center'
          style={{ background: collected ? '#1a56c4' : '#1e293b' }}
        >
          <span className='text-[8px] font-bold' style={{ color: collected ? '#fff' : '#475569' }}>
            {collected ? '✓ colada' : 'faltando'}
          </span>
        </div>
      </div>
    </div>
  )
}
