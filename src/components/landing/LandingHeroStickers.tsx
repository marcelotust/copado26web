import LandingStickerCard from '../LandingStickerCard'

type Props = { dimmed?: boolean }

export default function LandingHeroStickers({ dimmed }: Props) {
  return (
    <div
      className={`pointer-events-none hidden md:block absolute inset-0 ${dimmed ? 'opacity-75' : ''}`}
      aria-hidden='true'
    >
      <LandingStickerCard code='BRA' num='10' collected style={{ top: 110, left: 'calc(50% - 360px)', transform: 'rotate(-10deg) scale(1.1)' }} />
      <LandingStickerCard code='ARG' num='01' collected style={{ top: 220, left: 'calc(50% - 280px)', transform: 'rotate(5deg)' }} />
      <LandingStickerCard code='GER' num='05' collected={false} style={{ top: 320, left: 'calc(50% - 340px)', transform: 'rotate(-4deg) scale(0.9)' }} />
      <LandingStickerCard code='FRA' num='07' collected style={{ top: 100, right: 'calc(50% - 360px)', transform: 'rotate(9deg) scale(1.1)' }} />
      <LandingStickerCard code='ENG' num='09' collected style={{ top: 230, right: 'calc(50% - 275px)', transform: 'rotate(-6deg)' }} />
      <LandingStickerCard code='POR' num='07' collected={false} style={{ top: 330, right: 'calc(50% - 345px)', transform: 'rotate(3deg) scale(0.9)' }} />
    </div>
  )
}
