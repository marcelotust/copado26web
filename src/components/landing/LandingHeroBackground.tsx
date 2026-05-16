import { lazy, Suspense } from 'react'
import type { HeroBgVariant } from '../../lib/landingHeroPreview'
import LandingHeroStickers from './LandingHeroStickers'

const LoginBackgroundMosaic = lazy(() => import('../LoginBackgroundMosaic'))

const AURORA =
  'radial-gradient(circle, #3b82f6 0%, #f43f5e 35%, #10b981 65%, transparent 80%)'

type Props = { variant: HeroBgVariant }

export default function LandingHeroBackground({ variant }: Props) {
  const mosaicOpacity = variant === 'a' ? 'opacity-[0.16]' : 'opacity-[0.34]'
  const blobOpacity = variant === 'a' ? 'opacity-[0.05]' : 'opacity-[0.08]'

  return (
    <>
      {(variant === 'a' || variant === 'b') && (
        <Suspense fallback={null}>
          <div className={`absolute inset-0 pointer-events-none ${mosaicOpacity}`}>
            <LoginBackgroundMosaic />
          </div>
        </Suspense>
      )}

      {variant !== 'b' && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center' aria-hidden='true'>
          <div
            className={`w-[700px] h-[700px] rounded-full ${blobOpacity}`}
            style={{ background: AURORA }}
          />
        </div>
      )}

      {variant === 'a' && (
        <div
          className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_38%,rgb(2,6,23)/0.78,transparent)]'
          aria-hidden='true'
        />
      )}

      {variant === 'b' && (
        <>
          <div
            className='pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/55 to-slate-950'
            aria-hidden='true'
          />
          <div
            className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_58%_at_50%_42%,rgb(2,6,23)/0.88,transparent)]'
            aria-hidden='true'
          />
        </>
      )}

      {variant !== 'b' && <LandingHeroStickers dimmed={variant === 'a'} />}
    </>
  )
}
