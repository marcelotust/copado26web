import { useI18n } from '../i18n'
import SettingsAccountSection from '../components/SettingsAccountSection'
import SettingsExportSection  from '../components/SettingsExportSection'
import SettingsImportSection  from '../components/SettingsImportSection'
import SettingsSavePointsSection from '../components/SettingsSavePointsSection'
import SettingsAnalyticsSection from '../components/SettingsAnalyticsSection'
import SettingsDangerZone     from '../components/SettingsDangerZone'
import SettingsDeleteAccountSection from '../components/SettingsDeleteAccountSection'
import SettingsProfileSection from '../components/SettingsProfileSection'
import { FeatureFlag, telemetry } from '../lib/telemetry'
import { useProfile } from '../state/friends'
import type { ConsentState } from '../hooks/useAnalyticsConsent'

type SettingsPageProps = {
  userId: string
  email?: string
  consent: ConsentState
  onGrantAnalytics: () => void
  onDeclineAnalytics: () => void
  onSignOut: () => void | Promise<void>
}

export default function SettingsPage({
  userId,
  email,
  consent,
  onGrantAnalytics,
  onDeclineAnalytics,
  onSignOut,
}: SettingsPageProps) {
  const { t } = useI18n()
  const friendsEnabled = telemetry.flag(FeatureFlag.FRIENDS_V1)
  const { profile, setNickname, updateDisplayName, updateVisibility } = useProfile(userId)

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto p-6 max-w-md mx-auto w-full flex flex-col gap-6'>
        <h1 className='text-xl font-bold text-white'>{t('settings.title')}</h1>
        <SettingsAccountSection email={email} onSignOut={onSignOut} />
        {friendsEnabled && (
          <SettingsProfileSection
            profile={profile}
            onSetNickname={setNickname}
            onUpdateDisplayName={updateDisplayName}
            onUpdateVisibility={updateVisibility}
          />
        )}
        <SettingsAnalyticsSection
          consent={consent}
          onGrant={onGrantAnalytics}
          onDecline={onDeclineAnalytics}
        />
        <section className='flex flex-col gap-3'>
          <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
            {t('settings.data')}
          </h2>
          <SettingsExportSection />
          <SettingsImportSection />
        </section>
        <SettingsSavePointsSection userId={userId} />
        <SettingsDangerZone />
        <SettingsDeleteAccountSection email={email} onDeleted={onSignOut} />
      </div>
    </div>
  )
}
