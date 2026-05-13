import { Link } from 'react-router-dom'
import AppLogo from '../components/AppLogo'
import LandingStickerMock from '../components/LandingStickerMock'
import LandingStatPill from '../components/LandingStatPill'
import { LANDING_FEATURES, LANDING_PRIVACY, LANDING_STATS } from '../data/landingContent'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-slate-950 text-white flex flex-col overflow-x-hidden'>

      {/* Skip-to-content link for keyboard users */}
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:text-sm focus:font-semibold'
      >
        Ir para o conteúdo
      </a>

      {/* Nav */}
      <header className='flex items-center justify-between px-6 py-4 w-full max-w-5xl mx-auto'>
        <Link to='/' aria-label='Meu Álbum 2026 — página inicial'>
          <AppLogo size='md' />
        </Link>
        <Link
          to='/login'
          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${FOCUS_RING}`}
        >
          Entrar →
        </Link>
      </header>

      <main id='main-content'>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section
          className='relative flex flex-col items-center text-center px-6 pt-10 pb-20 overflow-hidden'
          aria-labelledby='hero-heading'
        >
          {/* Decorative glow — hidden from assistive tech */}
          <div className='pointer-events-none absolute inset-0 flex items-center justify-center' aria-hidden='true'>
            <div
              className='w-[700px] h-[700px] rounded-full opacity-[0.08]'
              style={{ background: 'radial-gradient(circle, #3b82f6 0%, #f43f5e 35%, #10b981 65%, transparent 80%)' }}
            />
          </div>

          {/* Floating stickers — decorative, hidden from assistive tech and mobile */}
          <div className='pointer-events-none hidden md:block absolute inset-0' aria-hidden='true'>
            <LandingStickerMock code='BRA' flag='🇧🇷' num='10' collected style={{ top: 110, left: 'calc(50% - 360px)', transform: 'rotate(-10deg) scale(1.1)' }} />
            <LandingStickerMock code='ARG' flag='🇦🇷' num='01' collected style={{ top: 220, left: 'calc(50% - 280px)', transform: 'rotate(5deg)' }} />
            <LandingStickerMock code='GER' flag='🇩🇪' num='05' collected={false} style={{ top: 320, left: 'calc(50% - 340px)', transform: 'rotate(-4deg) scale(0.9)' }} />
            <LandingStickerMock code='FRA' flag='🇫🇷' num='07' collected style={{ top: 100, right: 'calc(50% - 360px)', transform: 'rotate(9deg) scale(1.1)' }} />
            <LandingStickerMock code='ENG' flag='🏴󠁧󠁢󠁥󠁮󠁧󠁿' num='09' collected style={{ top: 230, right: 'calc(50% - 275px)', transform: 'rotate(-6deg)' }} />
            <LandingStickerMock code='POR' flag='🇵🇹' num='07' collected={false} style={{ top: 330, right: 'calc(50% - 345px)', transform: 'rotate(3deg) scale(0.9)' }} />
          </div>

          <div className='relative z-10 flex flex-col items-center gap-5 max-w-2xl'>
            <span className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-400 backdrop-blur-sm'>
              <span aria-hidden='true'>⚽</span> Copa do Mundo FIFA 2026
            </span>

            <h1 id='hero-heading' className='text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight'>
              Complete o{' '}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-rose-400 to-emerald-400'>
                maior álbum
              </span>
              <br />da história
            </h1>

            <p className='text-slate-400 text-base sm:text-lg leading-relaxed max-w-md'>
              Controle suas figurinhas, compartilhe listas e encontre trocas com amigos —
              tudo no celular, em tempo real, de graça.
            </p>

            <div className='flex flex-col sm:flex-row items-center gap-3 mt-2'>
              <Link
                to='/login'
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base active:scale-95 transition-all ${FOCUS_RING}`}
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)', boxShadow: '0 0 48px #3b82f640' }}
              >
                <span aria-hidden='true'>⚽</span> Começar grátis
              </Link>
              <p className='text-xs text-slate-600'>Sem cartão · Sem anúncios · 100% grátis</p>
            </div>
          </div>

          {/* Stats */}
          <dl className='relative z-10 mt-14 flex items-center gap-6 sm:gap-10 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm'>
            {LANDING_STATS.map((s, i) => (
              <>
                {i > 0 && <div key={`div-${s.label}`} className='w-px h-7 bg-slate-800' aria-hidden='true' />}
                <LandingStatPill key={s.label} value={s.value} label={s.label} />
              </>
            ))}
          </dl>
        </section>

        {/* ── Features ───────────────────────────────────────────────────── */}
        <section className='px-6 py-20 bg-slate-900/40' aria-labelledby='features-heading'>
          <div className='max-w-4xl mx-auto flex flex-col gap-12'>
            <div className='text-center flex flex-col gap-2'>
              <h2 id='features-heading' className='text-2xl sm:text-4xl font-black'>
                Tudo que você precisa, num app só
              </h2>
              <p className='text-slate-500 text-sm'>Construído por fãs, para fãs — sem complicação.</p>
            </div>

            <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none'>
              {LANDING_FEATURES.map(f => (
                <li
                  key={f.title}
                  className='flex flex-col gap-3 rounded-2xl p-5 border border-slate-800 bg-slate-900 hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-200'
                >
                  <div
                    className='w-10 h-10 rounded-xl flex items-center justify-center text-xl'
                    style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}30` }}
                    role='img'
                    aria-label={f.iconLabel}
                  >
                    <span aria-hidden='true'>{f.icon}</span>
                  </div>
                  <div className='flex flex-col gap-1'>
                    <p className='font-bold text-white text-sm'>{f.title}</p>
                    <p className='text-slate-400 text-xs leading-relaxed'>{f.desc}</p>
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
                <span aria-hidden='true'>🔒</span> Seus dados, suas regras
              </p>
              <h2 id='privacy-heading' className='text-xl sm:text-2xl font-black text-white'>
                Privacidade e LGPD
              </h2>
              <p className='text-slate-500 text-xs leading-relaxed'>
                O app coleta apenas o necessário para funcionar. Sem venda de dados, sem surpresas.
              </p>
            </div>

            <ul className='grid grid-cols-1 sm:grid-cols-2 gap-3 list-none'>
              {LANDING_PRIVACY.map(item => (
                <li key={item.text} className='flex items-start gap-3 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3'>
                  <span className='text-base shrink-0 mt-0.5' role='img' aria-label={item.iconLabel}>
                    {item.icon}
                  </span>
                  <p className='text-xs text-slate-400 leading-relaxed'>{item.text}</p>
                </li>
              ))}
            </ul>

            <p className='text-center text-xs text-slate-600'>
              Leia a nossa{' '}
              <Link
                to='/privacidade'
                className={`text-slate-400 hover:text-white underline underline-offset-2 transition-colors ${FOCUS_RING}`}
              >
                Política de Privacidade
              </Link>
              {' '}e os{' '}
              <Link
                to='/termos'
                className={`text-slate-400 hover:text-white underline underline-offset-2 transition-colors ${FOCUS_RING}`}
              >
                Termos de Uso
              </Link>
              {' '}para mais detalhes.
            </p>
          </div>
        </section>

        {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
        <section className='px-6 py-20 flex flex-col items-center gap-5 text-center bg-slate-900/40' aria-labelledby='cta-heading'>
          <h2 id='cta-heading' className='text-2xl sm:text-3xl font-black max-w-sm leading-tight'>
            Pronto pra montar o álbum mais épico da Copa?
          </h2>
          <p className='text-slate-500 text-sm max-w-xs'>
            Crie sua conta em segundos com e-mail ou Google.
          </p>
          <Link
            to='/login'
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border border-slate-700 hover:bg-slate-800 hover:border-slate-600 active:scale-95 transition-all ${FOCUS_RING}`}
          >
            Criar conta grátis →
          </Link>
        </section>

      </main>

      {/* Footer */}
      <footer className='border-t border-slate-800 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 max-w-5xl mx-auto w-full'>
        <p>Feito por fãs, para fãs · Copa do Mundo FIFA 2026</p>
        <nav aria-label='Links legais'>
          <ul className='flex gap-4 list-none'>
            <li><Link to='/privacidade' className={`hover:text-slate-400 transition-colors ${FOCUS_RING}`}>Privacidade</Link></li>
            <li><Link to='/termos'      className={`hover:text-slate-400 transition-colors ${FOCUS_RING}`}>Termos</Link></li>
          </ul>
        </nav>
      </footer>

    </div>
  )
}
