import { Link } from 'react-router-dom'
import Avatar from '../friends/Avatar'
import { useI18n } from '../../i18n'
import type { RankingEntry } from '../../hooks/usePublicRanking'

const TOTAL = 994

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export type FriendStatus = 'self' | 'friend' | 'pending' | 'none'

type Props = {
  entry: RankingEntry
  isCurrentUser: boolean
  friendStatus?: FriendStatus
  onSendRequest?: () => void
  sending?: boolean
}

export default function RankingRow({ entry, isCurrentUser, friendStatus = 'none', onSendRequest, sending = false }: Props) {
  const { t } = useI18n()
  const pctRounded = Math.round(entry.completion_pct)
  const missing = TOTAL - entry.owned_count
  const isMedal = entry.rank <= 3

  const showAdd = friendStatus === 'none' && !isCurrentUser
  const showPending = friendStatus === 'pending'

  return (
    <Link
      to={`/u/${entry.nickname}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-slate-800/60 ${
        isCurrentUser ? 'border border-indigo-500/40 bg-indigo-950/30' : ''
      }`}
    >
      {/* Medal / position */}
      <div className='shrink-0 w-10 text-center'>
        {isMedal ? (
          <span className='text-3xl leading-none'>{MEDAL[entry.rank]}</span>
        ) : (
          <span className='text-base font-bold text-slate-400'>#{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar
        userId={entry.user_id}
        displayName={entry.display_name || entry.nickname}
        paletteId={entry.avatar_palette_id}
        avatarUrl={entry.avatar_url}
        size='sm'
      />

      {/* Name + nickname + progress bar */}
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-white truncate'>
          {entry.display_name || entry.nickname}
        </p>
        <p className='text-xs text-slate-400 mb-1'>@{entry.nickname}</p>
        <div className='h-1.5 rounded-full bg-slate-700 overflow-hidden'>
          <div
            className='h-full rounded-full bg-emerald-500 transition-all'
            style={{ width: `${pctRounded}%` }}
          />
        </div>
      </div>

      {/* Stats: pct + missing */}
      <div className='shrink-0 text-right min-w-[3.5rem]'>
        <p className='text-sm font-bold text-white'>{pctRounded}%</p>
        <p className='text-[10px] text-slate-500 leading-tight'>fig. faltando</p>
        <p className='text-base font-bold text-slate-400 leading-tight'>{missing}</p>
      </div>

      {/* Friend CTA */}
      {(showAdd || showPending) && (
        <div className='shrink-0'>
          {showAdd ? (
            <button
              type='button'
              aria-label={t('ranking.addFriend')}
              disabled={sending}
              onClick={e => { e.preventDefault(); e.stopPropagation(); onSendRequest?.() }}
              className='p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50'
            >
              {sending ? (
                <span className='block w-4 h-4 text-center text-xs leading-4'>…</span>
              ) : (
                <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
                  <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
                </svg>
              )}
            </button>
          ) : (
            <span className='px-2.5 py-1 rounded-lg bg-slate-700 text-slate-400 text-xs font-semibold'>
              {t('ranking.requestSent')}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
