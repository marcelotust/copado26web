import { useState } from 'react'
import { useI18n } from '../../i18n'
import Avatar from './Avatar'
import type { FriendRequest } from '../../state/friends'

type Props = {
  request: FriendRequest
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string) => Promise<void>
}

export default function PendingRequestRow({ request, onAccept, onDecline }: Props) {
  const { t } = useI18n()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)

  const userId = request.from_user
  const displayName = request.display_name ?? request.nickname ?? userId.slice(0, 8)
  const nickname = request.nickname

  async function handle(action: 'accept' | 'decline') {
    setLoading(action)
    try {
      if (action === 'accept') await onAccept(request.id)
      else await onDecline(request.id)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className='flex items-center gap-3 px-4 py-3 bg-slate-800/60 rounded-xl'>
      <Avatar userId={userId} displayName={displayName} paletteId={request.avatar_palette_id} size='md' />
      <div className='min-w-0 flex-1'>
        <p className='text-white text-sm font-medium truncate'>{displayName}</p>
        {nickname && <p className='text-slate-400 text-xs'>@{nickname}</p>}
      </div>
      <div className='flex gap-2 shrink-0'>
        <button
          type='button'
          disabled={loading !== null}
          onClick={() => { void handle('accept') }}
          className='px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50'
        >
          {loading === 'accept' ? '…' : t('friends.requests.accept')}
        </button>
        <button
          type='button'
          disabled={loading !== null}
          onClick={() => { void handle('decline') }}
          className='px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50'
        >
          {loading === 'decline' ? '…' : t('friends.requests.decline')}
        </button>
      </div>
    </div>
  )
}
