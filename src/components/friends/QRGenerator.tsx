import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useI18n } from '../../i18n'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'

type Props = { nickname: string }

export default function QRGenerator({ nickname }: Props) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const deepLink = `${window.location.origin}/friends/add?code=${encodeURIComponent(nickname)}`

  useEffect(() => {
    telemetry.track(AnalyticsEvent.QR_PROFILE_GENERATED)
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(deepLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  return (
    <div className='flex flex-col items-center gap-4 py-2'>
      <div className='rounded-xl bg-white p-3'>
        <QRCodeSVG value={deepLink} size={200} level='M' marginSize={1} />
      </div>
      <p className='text-slate-400 text-xs text-center'>{t('friends.qr.hint').replace('{{nickname}}', nickname)}</p>
      <button
        type='button'
        onClick={() => { void copyLink() }}
        className='w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors'
      >
        {copied ? t('friends.qr.copied') : t('friends.qr.copyLink')}
      </button>
    </div>
  )
}
