import { useI18n } from '../i18n'

// "Check your email" panel shown after the magic link has been requested.

export default function LoginMagicLinkPanel({ email }: { email: string }) {
  const { t } = useI18n()

  return (
    <div className='flex flex-col items-center gap-4 text-center py-2'>
      <div className='w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center'>
        <svg
          className='w-8 h-8 text-blue-400'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={1.5}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75'
          />
        </svg>
      </div>
      <div>
        <h2 className='text-lg font-bold text-white'>{t('login.checkEmail')}</h2>
        <p className='text-slate-400 text-sm mt-1'>
          {t('login.linkSentTo')}{' '}
          <span className='text-white font-medium'>{email}</span>
        </p>
      </div>
      <p className='text-slate-400 text-sm'>{t('login.clickToSignIn')}</p>
      <p className='text-slate-500 text-xs'>{t('login.linkExpires')}</p>
    </div>
  )
}
