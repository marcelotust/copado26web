import Avatar from './Avatar'
import type { FriendEntry } from '../../state/friends'

type Props = { friend: FriendEntry }

export default function AcceptedRequestRow({ friend }: Props) {
  return (
    <div className='flex items-center gap-3 px-4 py-3 bg-slate-800/40 rounded-xl opacity-80'>
      <Avatar userId={friend.user_id} displayName={friend.display_name} avatarUrl={friend.avatar_url} size='md' />
      <div className='min-w-0 flex-1'>
        <p className='text-white text-sm font-medium truncate'>{friend.display_name}</p>
        <p className='text-slate-400 text-xs'>@{friend.nickname}</p>
      </div>
      <span className='text-emerald-400 text-xs font-medium shrink-0'>✓ novo amigo</span>
    </div>
  )
}
