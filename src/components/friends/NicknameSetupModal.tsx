import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'

const NICKNAME_RE = /^[a-z0-9_]{3,20}$/

function errorKeyFromMessage(msg: string): string {
  if (msg.includes('invalid_nickname_format')) return 'friends.nickname.errorFormat'
  if (msg.includes('reserved_nickname')) return 'friends.nickname.errorReserved'
  if (msg.includes('nickname_taken')) return 'friends.nickname.errorTaken'
  return 'friends.nickname.errorGeneric'
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (nickname: string) => Promise<{ ok: boolean; error?: string; is_new?: boolean }>
}

export default function NicknameSetupModal({ isOpen, onClose, onSave }: Props) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) { setValue(''); setErrorKey(null); inputRef.current?.focus() }
  }, [isOpen])

  if (!isOpen) return null

  const valid = NICKNAME_RE.test(value)

  async function handleSave() {
    if (!valid || loading) return
    setLoading(true)
    setErrorKey(null)
    const result = await onSave(value)
    setLoading(false)
    if (!result.ok) {
      setErrorKey(errorKeyFromMessage(result.error ?? ''))
      return
    }
    telemetry.track(result.is_new ? AnalyticsEvent.NICKNAME_SET : AnalyticsEvent.NICKNAME_CHANGED)
    onClose()
  }

  function handleChange(v: string) {
    setValue(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))
    setErrorKey(null)
  }

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} aria-hidden />
      <div className='relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 flex flex-col gap-4'>
        <h2 className='text-white font-bold text-base'>{t('friends.nickname.title')}</h2>
        <p className='text-slate-400 text-sm leading-relaxed'>{t('friends.nickname.hint')}</p>

        <div className='flex flex-col gap-1'>
          <label className='text-xs text-slate-400' htmlFor='nickname-input'>
            {t('friends.nickname.label')}
          </label>
          <div className='flex items-center gap-1'>
            <span className='text-slate-500 text-sm select-none'>@</span>
            <input
              id='nickname-input'
              ref={inputRef}
              type='text'
              value={value}
              maxLength={20}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { void handleSave() } }}
              placeholder={t('friends.nickname.placeholder')}
              className='flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500'
            />
          </div>
          {errorKey && (
            <p className='text-red-400 text-xs mt-1'>{t(errorKey)}</p>
          )}
          {value && !valid && !errorKey && (
            <p className='text-slate-500 text-xs mt-1'>{t('friends.nickname.formatHint')}</p>
          )}
        </div>

        <div className='flex gap-3 pt-1'>
          <button
            type='button'
            onClick={() => { void handleSave() }}
            disabled={!valid || loading}
            className='flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50'
          >
            {loading ? t('friends.nickname.saving') : t('friends.nickname.save')}
          </button>
          <button
            type='button'
            onClick={onClose}
            disabled={loading}
            className='flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors'
          >
            {t('friends.nickname.cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
