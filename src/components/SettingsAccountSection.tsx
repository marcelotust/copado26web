import { useI18n } from '../i18n'

type SettingsAccountSectionProps = {
  email?: string
  onSignOut: () => void | Promise<void>
}

export default function SettingsAccountSection({ email, onSignOut }: SettingsAccountSectionProps) {
  const { t } = useI18n()

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
        {t('settings.account')}
      </h2>
      {email && (
        <div className='px-4 py-3 rounded-lg bg-slate-800 border border-slate-700'>
          <p className='text-[10px] text-slate-500 uppercase tracking-widest mb-0.5'>
            {t('menu.loggedInAs')}
          </p>
          <p className='text-white text-sm truncate'>{email}</p>
        </div>
      )}
      <button
        onClick={onSignOut}
        className='px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-left transition-colors'
      >
        {t('settings.signOut')}
      </button>
    </section>
  )
}
