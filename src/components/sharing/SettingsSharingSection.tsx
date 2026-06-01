import { useState } from 'react'
import { useI18n } from '../../i18n'
import { useFeedback } from '../../contexts/FeedbackContext'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import type { Profile, SharingSettings } from '../../state/friends/types'

type Props = {
  profile: Profile | null
  onUpdate: (settings: Partial<SharingSettings>) => Promise<{ ok: boolean; error?: string }>
}

type ToggleKey = keyof SharingSettings

export default function SettingsSharingSection({ profile, onUpdate }: Props) {
  const { t } = useI18n()
  const feedback = useFeedback()
  const [loading, setLoading] = useState<Set<ToggleKey>>(new Set())

  if (!profile) return null

  async function handleToggle(key: ToggleKey, current: boolean) {
    if (loading.has(key)) return
    setLoading(prev => new Set(prev).add(key))
    const next = !current
    const result = await onUpdate({ [key]: next })
    setLoading(prev => { const s = new Set(prev); s.delete(key); return s })
    if (!result.ok) {
      feedback.error('sharing.savingError')
      return
    }
    if (key === 'ranking_public') {
      telemetry.track(next ? AnalyticsEvent.RANKING_OPT_IN : AnalyticsEvent.RANKING_OPT_OUT)
    } else if (key === 'trading_public') {
      telemetry.track(next ? AnalyticsEvent.TRADING_PUBLIC_OPT_IN : AnalyticsEvent.TRADING_PUBLIC_OPT_OUT)
    }
  }

  const toggles: { key: ToggleKey; labelKey: string; hintKey: string }[] = [
    { key: 'ranking_public',    labelKey: 'sharing.rankingToggleLabel', hintKey: 'sharing.rankingToggleHint' },
    { key: 'trading_public',    labelKey: 'sharing.tradingToggleLabel', hintKey: 'sharing.tradingToggleHint' },
    { key: 'email_trade_optin', labelKey: 'sharing.emailToggleLabel',   hintKey: 'sharing.emailToggleHint'   },
  ]

  return (
    <section className='flex flex-col gap-2'>
      <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
        {t('sharing.settingsTitle')}
      </h2>
      <div className='px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 flex flex-col gap-4'>
        {toggles.map(({ key, labelKey, hintKey }) => {
          const checked = profile[key] as boolean
          const busy = loading.has(key)
          return (
            <label key={key} className='flex items-start gap-3 cursor-pointer'>
              <div className='relative mt-0.5 shrink-0'>
                <input
                  type='checkbox'
                  role='switch'
                  aria-checked={checked}
                  checked={checked}
                  disabled={busy}
                  onChange={() => void handleToggle(key, checked)}
                  className='sr-only peer'
                />
                <div className='w-10 h-6 rounded-full bg-slate-600 peer-checked:bg-indigo-600 transition-colors peer-disabled:opacity-50' />
                <div className='absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4' />
              </div>
              <div className='flex-1'>
                <p className='text-sm font-medium text-white leading-snug'>
                  {t(labelKey)}
                  {busy && <span className='ml-2 text-xs text-slate-400'>…</span>}
                </p>
                <p className='text-xs text-slate-400 mt-0.5'>{t(hintKey)}</p>
              </div>
            </label>
          )
        })}
      </div>
    </section>
  )
}
