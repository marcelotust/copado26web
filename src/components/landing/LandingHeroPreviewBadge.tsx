import { HERO_PREVIEW_HINT, type HeroPreviewConfig } from '../../lib/landingHeroPreview'

type Props = { config: HeroPreviewConfig }

export default function LandingHeroPreviewBadge({ config }: Props) {
  if (!import.meta.env.DEV) return null

  return (
    <div
      className='pointer-events-none fixed bottom-3 left-3 right-3 sm:right-auto z-[100] max-w-md rounded-xl border border-amber-500/40 bg-slate-900/95 px-3 py-2 text-[11px] text-amber-100/90 shadow-lg backdrop-blur-sm font-mono leading-relaxed'
      role='status'
    >
      <span className='text-amber-400 font-semibold'>hero preview</span>
      {' · '}
      bg=<span className='text-white'>{config.bg}</span>
      {' · '}
      text=<span className='text-white'>{config.text}</span>
      <br />
      <span className='text-slate-500'>{HERO_PREVIEW_HINT}</span>
    </div>
  )
}
