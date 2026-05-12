import { useI18n } from '../i18n'
import SettingsAccountSection from '../components/SettingsAccountSection'
import SettingsExportSection  from '../components/SettingsExportSection'
import SettingsDangerZone     from '../components/SettingsDangerZone'

type SettingsPageProps = {
  email?: string
  onSignOut: () => void | Promise<void>
}

export default function SettingsPage({ email, onSignOut }: SettingsPageProps) {
  const { t } = useI18n()

  return (
    <div className='p-6 max-w-md mx-auto flex flex-col gap-6'>
      <h1 className='text-xl font-bold text-white'>{t('settings.title')}</h1>
      <SettingsAccountSection email={email} onSignOut={onSignOut} />
      <SettingsExportSection />
      <SettingsDangerZone />
    </div>
  )
}
