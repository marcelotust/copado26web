type OnboardingStepProps = {
  eyebrow: string
  title: string
  body: string
  current: number
  total: number
  canGoBack: boolean
  nextDisabled?: boolean
  nextHint?: string
  nextLabel: string
  backLabel: string
  skipLabel: string
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}

export default function OnboardingStep({
  eyebrow,
  title,
  body,
  current,
  total,
  canGoBack,
  nextDisabled = false,
  nextHint,
  nextLabel,
  backLabel,
  skipLabel,
  onBack,
  onNext,
  onSkip,
}: OnboardingStepProps) {
  return (
    <section className='w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/40'>
      <div className='p-4'>
        <div className='flex items-center justify-between gap-3'>
          <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-amber-300'>{eyebrow}</p>
          <p className='text-xs font-semibold text-slate-400'>{current}/{total}</p>
        </div>
        <h2 className='mt-2 text-lg font-black leading-tight text-white'>{title}</h2>
        <p className='mt-2 text-sm leading-5 text-slate-300'>{body}</p>
        {nextHint && (
          <p className='mt-2 text-xs font-semibold text-amber-300/90'>{nextHint}</p>
        )}
      </div>

      <div className='flex items-center justify-between gap-2 border-t border-white/10 px-3 py-3'>
        <button
          type='button'
          onClick={onSkip}
          className='px-3 py-2 text-sm font-semibold text-slate-400 transition hover:text-white'
        >
          {skipLabel}
        </button>

        <div className='flex items-center gap-2'>
          {canGoBack && (
            <button
              type='button'
              onClick={onBack}
              className='rounded-md border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-slate-800'
            >
              {backLabel}
            </button>
          )}
          <button
            type='button'
            onClick={onNext}
            disabled={nextDisabled}
            className='rounded-md bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45'
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </section>
  )
}
