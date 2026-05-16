import { Fragment, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import AppLogo from '../components/AppLogo'
import LandingStickerCard from '../components/LandingStickerCard'
import LandingStatPill from '../components/LandingStatPill'
import { useI18n } from '../i18n'
import { LANDING_FEATURES, LANDING_PRIVACY, LANDING_STATS } from '../data/landingContent'
import { landingFeatureKey, landingPrivacyKey, landingStatLabelKey } from '../lib/landingI18n'
import { AnalyticsEvent, FeatureFlag, telemetry } from '../lib/telemetry'
import { getAnonVariant } from '../lib/telemetry/anonExperiment'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'

const tier1 = LANDING_FEATURES.filter(f => f.tier === 1)
const tier2 = LANDING_FEATURES.filter(f => f.tier === 2)

type HeroCtaId = 'header_login' | 'hero_primary' | 'hero_explore_album' | 'bottom_signup'

export default function LandingPage() {
  const { t } = useI18n()
  // Deterministic, persisted client-side bucketing for anonymous visitors.
  // PostHog only initializes after consent (post-login), so its native flag
  // evaluation can't reach the landing page — every visitor would otherwise
  // see the control arm. The matching `$feature_flag_called` exposure event
  // is buffered by the queueing analytics layer and replayed with this
  // mount-time timestamp once telemetry activates (see telemetry/queue.ts).
  const heroVariant = useMemo(
    () => getAnonVariant(FeatureFlag.LANDING_HERO_CTA, { variants: ['control', 'treatment'] }),
    [],
  )

  useEffect(() => {
    // Emit exposure FIRST so its timestamp is earliest in the funnel.
    telemetry.track('$feature_flag_called', {
      $feature_flag: FeatureFlag.LANDING_HERO_CTA,
      $feature_flag_response: heroVariant,
    })
    telemetry.track(AnalyticsEvent.LANDING_VIEWED, { hero_cta_variant: heroVariant })
  }, [heroVariant])

  const heroPrimaryCopy = heroVariant === 'treatment'
    ? t('landing.hero.ctaTreatment')
    : t('landing.hero.ctaControl')

  const trackCta = (ctaId: HeroCtaId) => () => {
    telemetry.track(AnalyticsEvent.LANDING_CTA_CLICKED, {
      cta_id: ctaId,
      ...(ctaId === 'hero_primary' ? { cta_variant: heroVariant } : {}),
    })
  }

  return (
    <div className='min-h-screen bg-slate-950 text-white flex flex-col overflow-x-hidden'>

      {/* Skip-to-content */}
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:text-sm focus:font-semibold'
      >
        {t('landing.skipToContent')}
      </a>

      {/* Nav */}
      <header className='flex items-center justify-between px-6 py-4 w-full max-w-5xl mx-auto'>
        <Link to='/' aria-label={t('landing.homeAriaLabel')}>
          <AppLogo size='md' />
        </Link>
        <Link
          to='/login'
          onClick={trackCta('header_login')}
          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${FOCUS_RING}`}
        >
          {t('landing.signIn')} →
        </Link>
      </header>

      <main id='main-content'>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section
          className='relative flex flex-col items-center text-center px-6 pt-10 pb-20 overflow-hidden'
          aria-labelledby='hero-heading'
        >
          <div className='pointer-events-none absolute inset-0 flex items-center justify-center' aria-hidden='true'>
            <div
              className='w-[700px] h-[700px] rounded-full opacity-[0.08]'
              style={{ background: 'radial-gradient(circle, #3b82f6 0%, #f43f5e 35%, #10b981 65%, transparent 80%)' }}
            />
          </div>

          <div className='pointer-events-none hidden md:block absolute inset-0' aria-hidden='true'>
            <LandingStickerCard code='BRA' num='10' collected style={{ top: 110, left: 'calc(50% - 360px)', transform: 'rotate(-10deg) scale(1.1)' }} />
            <LandingStickerCard code='ARG' num='01' collected style={{ top: 220, left: 'calc(50% - 280px)', transform: 'rotate(5deg)' }} />
            <LandingStickerCard code='GER' num='05' collected={false} style={{ top: 320, left: 'calc(50% - 340px)', transform: 'rotate(-4deg) scale(0.9)' }} />
            <LandingStickerCard code='FRA' num='07' collected style={{ top: 100, right: 'calc(50% - 360px)', transform: 'rotate(9deg) scale(1.1)' }} />
            <LandingStickerCard code='ENG' num='09' collected style={{ top: 230, right: 'calc(50% - 275px)', transform: 'rotate(-6deg)' }} />
            <LandingStickerCard code='POR' num='07' collected={false} style={{ top: 330, right: 'calc(50% - 345px)', transform: 'rotate(3deg) scale(0.9)' }} />
          </div>

          <div className='relative z-10 flex flex-col items-center gap-5 max-w-2xl'>
            <h1 id='hero-heading' className='text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight'>
              {t('landing.hero.titleBefore')}{' '}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-rose-400 to-emerald-400'>
                {t('landing.hero.titleHighlight')}
              </span>
              <br />{t('landing.hero.titleAfter')}
            </h1>

            <p
              className='text-slate-300 text-base sm:text-lg leading-relaxed max-w-md'
              style={{ textShadow: '0 1px 8px rgba(2,6,23,0.9), 0 2px 24px rgba(2,6,23,0.7)' }}
            >
              {t('landing.hero.subtitle')}
            </p>

            <div className='flex flex-col sm:flex-row items-center gap-3 mt-2'>
              <Link
                to='/login'
                onClick={trackCta('hero_primary')}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base active:scale-95 transition-all ${FOCUS_RING}`}
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', boxShadow: '0 0 48px #3b82f640' }}
              >
                <span aria-hidden='true'>⚽</span> {heroPrimaryCopy}
              </Link>
              <div className='flex flex-col items-center gap-1.5'>
                <p className='text-xs text-slate-600'>{t('landing.hero.finePrint')}</p>
                <Link
                  to='/album'
                  onClick={trackCta('hero_explore_album')}
                  className={`text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors ${FOCUS_RING}`}
                >
                  {t('landing.hero.exploreAlbum')} →
                </Link>
              </div>
            </div>
          </div>

          <dl className='relative z-10 mt-14 flex items-center gap-6 sm:gap-10 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm'>
            {LANDING_STATS.map((s, i) => (
              <Fragment key={s.id}>
                {i > 0 && <div className='w-px h-7 bg-slate-800' aria-hidden='true' />}
                <LandingStatPill value={s.value} label={t(landingStatLabelKey(s.id))} />
              </Fragment>
            ))}
          </dl>
        </section>

        {/* ── Features ───────────────────────────────────────────────────── */}
        <section className='px-6 py-20 bg-slate-900/40' aria-labelledby='features-heading'>
          <div className='max-w-4xl mx-auto flex flex-col gap-14'>

            <div className='text-center flex flex-col gap-3'>
              <p className='text-xs font-bold uppercase tracking-widest text-slate-600'>{t('landing.features.eyebrow')}</p>
              <h2 id='features-heading' className='text-2xl sm:text-4xl font-black'>
                {t('landing.features.headingLine1')}<br />
                <span className='text-slate-400 font-semibold text-xl sm:text-3xl'>{t('landing.features.headingLine2')}</span>
              </h2>
            </div>

            {/* Tier 1 — destaque */}
            <ul className='grid grid-cols-1 sm:grid-cols-3 gap-5 list-none' aria-label={t('landing.features.tier1Aria')}>
              {tier1.map(f => (
                <li
                  key={f.id}
                  className='relative flex flex-col gap-4 rounded-2xl p-6 bg-slate-900 border border-slate-800 overflow-hidden hover:-translate-y-1 transition-transform duration-200'
                  style={{ borderTopColor: f.accent, borderTopWidth: 3 }}
                >
                  {/* Soft glow at top */}
                  <div
                    className='pointer-events-none absolute top-0 left-0 right-0 h-24 opacity-10'
                    aria-hidden='true'
                    style={{ background: `linear-gradient(to bottom, ${f.accent}, transparent)` }}
                  />
                  <div
                    className='relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl'
                    style={{ background: `${f.accent}20`, border: `1px solid ${f.accent}40` }}
                    role='img'
                    aria-label={t(landingFeatureKey(f, 'iconLabel'))}
                  >
                    <span aria-hidden='true'>{f.icon}</span>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <p className='font-black text-white text-base'>{t(landingFeatureKey(f, 'title'))}</p>
                    <p className='text-slate-400 text-sm leading-relaxed'>{t(landingFeatureKey(f, 'detail'))}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Tier 2 — complementares */}
            <ul className='grid grid-cols-1 sm:grid-cols-3 gap-4 list-none' aria-label={t('landing.features.tier2Aria')}>
              {tier2.map(f => (
                <li
                  key={f.id}
                  className='flex items-start gap-4 rounded-xl p-4 border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors'
                >
                  <div
                    className='shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg'
                    style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}25` }}
                    role='img'
                    aria-label={t(landingFeatureKey(f, 'iconLabel'))}
                  >
                    <span aria-hidden='true'>{f.icon}</span>
                  </div>
                  <div className='flex flex-col gap-0.5'>
                    <p className='font-bold text-white text-sm'>{t(landingFeatureKey(f, 'title'))}</p>
                    <p className='text-slate-500 text-xs leading-relaxed'>{t(landingFeatureKey(f, 'desc'))}</p>
                  </div>
                </li>
              ))}
            </ul>

          </div>
        </section>

        {/* ── LGPD / Privacidade ─────────────────────────────────────────── */}
        <section className='px-6 py-16' aria-labelledby='privacy-heading'>
          <div className='max-w-2xl mx-auto flex flex-col gap-6'>
            <div className='text-center flex flex-col gap-2'>
              <p className='inline-flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold'>
                <span aria-hidden='true'>🔒</span> {t('landing.privacy.eyebrow')}
              </p>
              <h2 id='privacy-heading' className='text-xl sm:text-2xl font-black text-white'>
                {t('landing.privacy.title')}
              </h2>
              <p className='text-slate-500 text-xs leading-relaxed'>
                {t('landing.privacy.subtitle')}
              </p>
            </div>

            <ul className='grid grid-cols-1 sm:grid-cols-2 gap-3 list-none'>
              {LANDING_PRIVACY.map(item => (
                <li key={item.id} className='flex items-start gap-3 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3'>
                  <span className='text-base shrink-0 mt-0.5' role='img' aria-label={t(landingPrivacyKey(item.id, 'iconLabel'))}>
                    {item.icon}
                  </span>
                  <p className='text-xs text-slate-400 leading-relaxed'>{t(landingPrivacyKey(item.id, 'text'))}</p>
                </li>
              ))}
            </ul>

            <p className='text-center text-xs text-slate-600'>
              {t('landing.privacy.legalBefore')}{' '}
              <Link to='/privacidade' className={`text-slate-400 hover:text-white underline underline-offset-2 transition-colors ${FOCUS_RING}`}>
                {t('landing.privacy.privacyLink')}
              </Link>
              {' '}{t('landing.privacy.legalMiddle')}{' '}
              <Link to='/termos' className={`text-slate-400 hover:text-white underline underline-offset-2 transition-colors ${FOCUS_RING}`}>
                {t('landing.privacy.termsLink')}
              </Link>
              {' '}{t('landing.privacy.legalAfter')}
            </p>
          </div>
        </section>

        {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
        <section className='px-6 py-20 flex flex-col items-center gap-5 text-center bg-slate-900/40' aria-labelledby='cta-heading'>
          <h2 id='cta-heading' className='text-2xl sm:text-3xl font-black max-w-sm leading-tight'>
            {t('landing.cta.title')}
          </h2>
          <p className='text-slate-500 text-sm max-w-xs'>
            {t('landing.cta.subtitle')}
          </p>
          <Link
            to='/login'
            onClick={trackCta('bottom_signup')}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border border-slate-700 hover:bg-slate-800 hover:border-slate-600 active:scale-95 transition-all ${FOCUS_RING}`}
          >
            {t('landing.cta.button')} →
          </Link>
        </section>

      </main>

      {/* Footer */}
      <footer className='border-t border-slate-800 px-6 py-6 max-w-5xl mx-auto w-full flex flex-col gap-4'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600'>
          <div className='flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left'>
            <p>{t('landing.footer.copyright')}</p>
            <span className='hidden sm:inline text-slate-800'>·</span>
            <p>{t('landing.footer.tagline')}</p>
            <span className='hidden sm:inline text-slate-800'>·</span>
            <a
              href='mailto:hello@meualbum2026.app'
              className={`hover:text-slate-400 transition-colors ${FOCUS_RING}`}
            >
              hello@meualbum2026.app
            </a>
          </div>
          <nav aria-label={t('landing.footer.legalNavAria')}>
            <ul className='flex gap-4 list-none'>
              <li><Link to='/privacidade' className={`hover:text-slate-400 transition-colors ${FOCUS_RING}`}>{t('landing.footer.privacy')}</Link></li>
              <li><Link to='/termos'      className={`hover:text-slate-400 transition-colors ${FOCUS_RING}`}>{t('landing.footer.terms')}</Link></li>
            </ul>
          </nav>
        </div>
        <p className='text-[10px] text-slate-800 text-center'>
          {t('landing.footer.disclaimer')}
        </p>
      </footer>

    </div>
  )
}
