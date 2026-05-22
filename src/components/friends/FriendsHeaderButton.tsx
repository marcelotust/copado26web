import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useFriendsBadgeCount } from '../../state/friends'

export default function FriendsHeaderButton() {
  const { t } = useI18n()
  const badgeCount = useFriendsBadgeCount()

  return (
    <Link
      to='/friends'
      className='shrink-0 relative flex items-center justify-center w-8 h-8 rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition-colors'
      aria-label={t('friends.nav.friends')}
    >
      <svg className='w-[1.125rem] h-[1.125rem]' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
        <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' />
      </svg>
      {badgeCount > 0 && (
        <span className='absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5'>
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  )
}
