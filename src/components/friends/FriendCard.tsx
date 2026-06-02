import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import Avatar from './Avatar'
import ConfirmModal from '../ConfirmModal'
import type { FriendEntry } from '../../state/friends'

type Props = {
  friend: FriendEntry
  onRemove: (userId: string) => Promise<void>
}

export default function FriendCard({ friend, onRemove }: Props) {
  const { t } = useI18n()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  const isNew = (() => {
    const created = new Date(friend.friendship_created_at)
    const diffMs = Date.now() - created.getTime()
    return diffMs < 7 * 24 * 60 * 60 * 1000
  })()

  async function handleRemove() {
    setRemoving(true)
    await onRemove(friend.user_id)
    setRemoving(false)
    setConfirmOpen(false)
  }

  return (
    <>
      <div className='flex items-center gap-3 px-4 py-3 bg-slate-800/60 rounded-xl'>
        <Link to={`/u/${friend.nickname}`} className='flex items-center gap-3 flex-1 min-w-0'>
          <Avatar userId={friend.user_id} displayName={friend.display_name} avatarUrl={friend.avatar_url} size='md' />
          <div className='min-w-0'>
            <p className='text-white text-sm font-medium truncate'>{friend.display_name}</p>
            <p className='text-slate-400 text-xs flex items-center gap-1.5'>
              @{friend.nickname}
              {isNew && (
                <span className='inline-flex items-center px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-500/10 text-[10px] font-semibold leading-none'>
                  {t('friends.page.newFriend')}
                </span>
              )}
            </p>
          </div>
        </Link>
        <button
          type='button'
          onClick={() => setConfirmOpen(true)}
          className='shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors text-xs font-semibold'
        >
          <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
            <path d='M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
          </svg>
          {t('friends.unfriend')}
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title={t('friends.removeConfirmTitle')}
        description={t('friends.removeConfirmDesc').replace('{{name}}', friend.display_name)}
        confirmLabel={t('friends.removeConfirmYes')}
        cancelLabel={t('friends.removeConfirmNo')}
        onConfirm={() => { void handleRemove() }}
        onCancel={() => setConfirmOpen(false)}
        variant='danger'
        loading={removing}
      />
    </>
  )
}
