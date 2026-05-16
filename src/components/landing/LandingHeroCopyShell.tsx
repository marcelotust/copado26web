import type { ReactNode } from 'react'
import type { HeroTextVariant } from '../../lib/landingHeroPreview'

type Props = {
  variant: HeroTextVariant
  children: ReactNode
}

export default function LandingHeroCopyShell({ variant, children }: Props) {
  if (variant === 'card') {
    return (
      <div className='relative z-10 flex flex-col items-center gap-5 max-w-2xl rounded-3xl border border-slate-800/80 bg-slate-950/55 backdrop-blur-md px-6 py-8 sm:px-10 shadow-2xl shadow-black/40'>
        {children}
      </div>
    )
  }

  return (
    <div className='relative z-10 flex flex-col items-center gap-5 max-w-2xl'>
      {variant === 'vignette' && (
        <div
          className='pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 bg-[radial-gradient(ellipse_95%_85%_at_50%_48%,rgb(2,6,23)/0.92,transparent)]'
          aria-hidden='true'
        />
      )}
      {children}
    </div>
  )
}
