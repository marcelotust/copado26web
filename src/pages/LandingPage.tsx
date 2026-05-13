import { Link } from 'react-router-dom'
import AppLogo from '../components/AppLogo'

const FEATURES = [
  {
    icon: '⚡',
    title: 'Marque em segundos',
    desc: 'Toque pra colar. Tudo sincronizado na nuvem em tempo real, em qualquer dispositivo.',
  },
  {
    icon: '📤',
    title: 'Compartilhe sua lista',
    desc: 'Mande pro grupo do WhatsApp exatamente o que está faltando — com um único toque.',
  },
  {
    icon: '🔄',
    title: 'Encontre suas trocas',
    desc: 'Cole a lista de repetidas de um amigo e veja na hora quem tem o que o outro precisa.',
  },
]

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-slate-950 text-white flex flex-col'>

      {/* Nav */}
      <header className='flex items-center justify-between px-6 py-4'>
        <AppLogo size='md' />
        <Link
          to='/login'
          className='text-sm font-semibold text-slate-300 hover:text-white transition-colors'
        >
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <section className='flex-1 flex flex-col items-center justify-center text-center px-6 py-16 gap-6'>
        <div className='flex flex-col gap-3 max-w-lg'>
          <h1 className='text-4xl sm:text-5xl font-black leading-tight tracking-tight'>
            Seu álbum da{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-rose-400 to-emerald-400'>
              Copa 2026
            </span>
            ,{' '}sempre com você
          </h1>
          <p className='text-slate-400 text-lg leading-relaxed'>
            Controle figurinhas, compartilhe listas e encontre trocas com amigos — tudo no celular, grátis.
          </p>
        </div>

        <Link
          to='/login'
          className='mt-2 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-bold text-base shadow-lg hover:opacity-90 active:scale-95 transition-all'
        >
          ⚽ Começar grátis
        </Link>

        <p className='text-xs text-slate-600'>Sem cartão de crédito · Sem anúncios · 100% grátis</p>
      </section>

      {/* Features */}
      <section className='px-6 pb-16'>
        <div className='max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {FEATURES.map(f => (
            <div key={f.title} className='flex flex-col gap-2 rounded-2xl bg-slate-900 border border-slate-800 p-5'>
              <span className='text-3xl'>{f.icon}</span>
              <p className='font-bold text-white text-sm'>{f.title}</p>
              <p className='text-slate-400 text-xs leading-relaxed'>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-slate-800 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600'>
        <span>Feito por fãs, para fãs · Copa do Mundo FIFA 2026</span>
        <div className='flex gap-4'>
          <Link to='/privacidade' className='hover:text-slate-400 transition-colors'>Privacidade</Link>
          <Link to='/termos'      className='hover:text-slate-400 transition-colors'>Termos</Link>
        </div>
      </footer>

    </div>
  )
}
