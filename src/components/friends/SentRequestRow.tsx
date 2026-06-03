import { useI18n } from '../../i18n'
import Avatar from './Avatar'
import type { SentRequest } from '../../state/friends'

type Props = { request: SentRequest }

export default function SentRequestRow({ request }: Props) {
  const { t } = useI18n()
  const displayName = request.display_name ?? request.nickname ?? request.to_user.slice(0, 8)

  return (
    <div className='flex items-center gap-3 px-4 py-3 bg-slate-800/60 rounded-xl'>
      <Avatar
        userId={request.to_user}
        displayName={displayName}
        paletteId={request.avatar_palette_id}
        avatarUrl={request.avatar_url}
        size='md'
      />
      <div className='min-w-0 flex-1'>
        <p className='text-white text-sm font-medium truncate'>{displayName}</p>
        {request.nickname && <p className='text-slate-400 text-xs'>@{request.nickname}</p>}
      </div>
      <span className='shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-semibold'>
        {t('friends.requests.sent')}
      </span>
    </div>
  )
}
