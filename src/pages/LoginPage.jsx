import { useState } from 'react'
import { useI18n } from '../i18n'

export default function LoginPage({ onLogin }) {
  const { t } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onLogin(username, password)
  }

  return (
    <div className='fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4'>
      <div className='w-full max-w-sm'>
        <div className='flex items-center justify-center gap-2 mb-8'>
          <span className='text-4xl'>⚽</span>
          <div>
            <p className='text-white font-black text-2xl leading-none tracking-tight'>COPADO26</p>
            <p className='text-slate-600 text-xs leading-none mt-0.5'>{t('appSubtitle')}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className='bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4'
        >
          <h1 className='text-white font-bold text-lg text-center'>{t('login.title')}</h1>

          <div className='flex flex-col gap-1.5'>
            <label className='text-slate-400 text-xs font-medium'>{t('login.username')}</label>
            <input
              type='text'
              value={username}
              onChange={e => setUsername(e.target.value)}
              className='bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500'
              autoComplete='username'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-slate-400 text-xs font-medium'>{t('login.password')}</label>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500'
              autoComplete='current-password'
            />
          </div>

          <button
            type='submit'
            className='bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors mt-1'
          >
            {t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
