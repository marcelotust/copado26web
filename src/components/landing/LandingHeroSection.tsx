import { Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../brand/BrandMark'
import { useI18n } from '../../i18n'
import { landingStatLabelKey } from '../../lib/landingI18n'
import { readHeroPreviewConfig } from '../../lib/landingHeroPreview'
import { LANDING_STATS } from '../../data/landingContent'
import LandingStatPill from '../LandingStatPill'
import LandingHeroBackground from './LandingHeroBackground'
import LandingHeroCopyShell from './LandingHeroCopyShell'
import LandingHeroPreviewBadge from './LandingHeroPreviewBadge'
import {
  heroFinePrintClass,
  heroFinePrintStyle,
  heroHighlightClass,
  heroSecondaryLinkClass,
  heroSecondaryLinkStyle,
  heroSubtitleClass,
  heroSubtitleStyle,
  heroTitleClass,
} from './landingHeroTextStyles'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'

type HeroCtaId = 'header_login' | 'hero_primary' | 'hero_explore_album' | 'bottom_signup'

type Props = {
  heroVariant: 'control' | 'treatment'
  trackCta: (ctaId: HeroCtaId) => () => void
}

export default function LandingHeroSection({ heroVariant, trackCta }: Props) {
  const { t } = useI18n()
  const preview = useMemo(() => readHeroPreviewConfig(), [])

  const heroPrimaryTo = heroVariant === 'treatment' ? '/album' : '/login'
  const heroPrimaryCopy = heroVariant === 'treatment'
    ? t('landing.hero.ctaTreatment')
    : t('landing.hero.ctaControl')
  const heroSecondaryTo = heroVariant === 'treatment' ? '/login' : '/album'
  const heroSecondaryCopy = heroVariant === 'treatment'
    ? t('landing.signIn')
    : t('landing.hero.exploreAlbum')
  const heroSecondaryCtaId: HeroCtaId = heroVariant === 'treatment' ? 'header_login' : 'hero_explore_album'

  const sectionClass = preview.bg === 'b'
    ? 'relative flex flex-col items-center text-center px-6 pt-10 pb-20 overflow-hidden min-h-[72vh] justify-center'
    : 'relative flex flex-col items-center text-center px-6 pt-10 pb-20 overflow-hidden'

  return (
    <section className={sectionClass} aria-labelledby='hero-heading'>
      <LandingHeroBackground variant={preview.bg} />
      <LandingHeroPreviewBadge config={preview} />

      <LandingHeroCopyShell variant={preview.text}>
        <BrandMark
          variant='card'
          className='relative z-10 mb-4 h-20 w-20 sm:h-24 sm:w-24 drop-shadow-[0_8px_24px_rgba(15,23,42,0.45)]'
          ariaLabel=''
        />
        <h1 id='hero-heading' className={heroTitleClass(preview.text)}>
          {t('landing.hero.titleBefore')}{' '}
          <span className={heroHighlightClass(preview.text)}>
            {t('landing.hero.titleHighlight')}
          </span>
          <br />{t('landing.hero.titleAfter')}
        </h1>

        <p
          className={heroSubtitleClass(preview.text)}
          style={heroSubtitleStyle(preview.text)}
        >
          {t('landing.hero.subtitle')}
        </p>

        <div className='flex flex-col items-center gap-3 mt-2'>
          <Link
            to={heroPrimaryTo}
            onClick={trackCta('hero_primary')}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base active:scale-95 transition-all ${FOCUS_RING}`}
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', boxShadow: '0 0 48px #3b82f640' }}
          >
            <span aria-hidden='true'>⚽</span> {heroPrimaryCopy}
          </Link>
          <div className='flex flex-col items-center gap-1.5'>
            <p
              className={heroFinePrintClass(preview.text)}
              style={heroFinePrintStyle(preview.text)}
            >
              {t('landing.hero.finePrint')}
            </p>
            <Link
              to={heroSecondaryTo}
              onClick={trackCta(heroSecondaryCtaId)}
              className={`${heroSecondaryLinkClass(preview.text)} ${FOCUS_RING}`}
              style={heroSecondaryLinkStyle(preview.text)}
            >
              {heroSecondaryCopy} →
            </Link>
          </div>
        </div>
      </LandingHeroCopyShell>

      <dl className='relative z-10 mt-14 flex items-center gap-6 sm:gap-10 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm'>
        {LANDING_STATS.map((s, i) => (
          <Fragment key={s.id}>
            {i > 0 && <div className='w-px h-7 bg-slate-800' aria-hidden='true' />}
            <LandingStatPill value={s.value} label={t(landingStatLabelKey(s.id))} />
          </Fragment>
        ))}
      </dl>
    </section>
  )
}
