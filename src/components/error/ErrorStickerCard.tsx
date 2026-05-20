type ErrorStickerCardProps = {
  code: string
  tag: string
  accent: string
  glyph: string
}

export default function ErrorStickerCard({ code, tag, accent, glyph }: ErrorStickerCardProps) {
  return (
    <div className='relative' aria-hidden='true'>
      <div
        className='pointer-events-none absolute -inset-6 rounded-[2rem] blur-3xl opacity-40'
        style={{ background: `radial-gradient(circle at 50% 40%, ${accent}55, transparent 65%)` }}
      />
      <div
        className='relative aspect-[3/4] w-44 sm:w-52 overflow-hidden rounded-2xl border border-dashed bg-slate-900/70 px-4 pt-4 pb-6'
        style={{
          borderColor: `${accent}66`,
          backgroundImage: `linear-gradient(160deg, ${accent}25, ${accent}08 55%, rgba(15, 23, 42, 0.85))`,
        }}
      >
        <span
          className='block text-[0.65rem] font-bold uppercase tracking-[0.18em]'
          style={{ color: `${accent}cc` }}
        >
          {tag}
        </span>
        <span className='mt-1 block font-mono text-[3.75rem] sm:text-7xl font-black leading-none text-white'>
          {code}
        </span>
        <div className='absolute inset-x-6 bottom-4 flex items-end justify-center pointer-events-none select-none'>
          <span className='text-6xl sm:text-7xl opacity-30 grayscale'>{glyph}</span>
        </div>
      </div>
    </div>
  )
}
