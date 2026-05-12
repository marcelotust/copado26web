import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import GoogleIcon from './GoogleIcon'

type LoginEmailFormProps = {
  onSendLink: (email: string) => Promise<void>
  onGoogleLogin: () => Promise<void>
  error: string | null
}

export default function LoginEmailForm({ onSendLink, onGoogleLogin, error }: LoginEmailFormProps) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    setSending(true)
    await onSendLink(value)
    setSending(false)
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
      <button
        type='button'
        onClick={onGoogleLogin}
        className='flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white hover:bg-gray-100 text-gray-800 font-semibold transition-colors'
      >
        <GoogleIcon />
        {t('login.continueWithGoogle')}
      </button>

      <div className='flex items-center gap-3 my-1'>
        <div className='flex-1 h-px bg-slate-600' />
        <span className='text-slate-500 text-xs'>{t('login.orEmail')}</span>
        <div className='flex-1 h-px bg-slate-600' />
      </div>

      <input
        type='email'
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('login.emailPlaceholder')}
        className='px-4 py-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-blue-500'
      />
      {error && <p className='text-red-400 text-sm text-center'>{error}</p>}
      <button
        type='submit'
        disabled={sending}
        className='px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      >
        {sending ? t('login.sending') : t('login.sendLink')}
      </button>
    </form>
  )
}
