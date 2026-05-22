import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'

const DISMISS_KEY = 'nickname_banner_dismissed_v1'

function isDismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
}
function dismiss(): void {
  try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
}

type Props = { onSetNickname?: () => void }

export default function NicknameBanner({ onSetNickname }: Props) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(() => !isDismissed())
  const navigate = useNavigate()

  if (!visible) return null

  function handleAction() {
    // Navigate to /friends; FriendsPage owns the nickname modal for that route.
    // Calling onSetNickname here would open a second modal simultaneously.
    navigate('/friends')
  }

  function handleDismiss() {
    dismiss()
    setVisible(false)
  }

  return (
    <div className='shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border-b border-indigo-500/30 text-sm'>
      <span className='text-indigo-200 flex-1 leading-snug'>
        {t('friends.banner.text')}
      </span>
      <button
        type='button'
        onClick={handleAction}
        className='shrink-0 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors'
      >
        {t('friends.banner.cta')}
      </button>
      <button
        type='button'
        onClick={handleDismiss}
        aria-label={t('friends.banner.dismiss')}
        className='shrink-0 p-1 text-slate-400 hover:text-white transition-colors'
      >
        <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
          <path d='M18 6L6 18M6 6l12 12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        </svg>
      </button>
    </div>
  )
}
