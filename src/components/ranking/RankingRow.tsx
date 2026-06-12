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
  const isCompleted = entry.owned_count >= TOTAL
  const isMedal = entry.rank <= 3

  const showAdd = friendStatus === 'none' && !isCurrentUser
  const showPending = friendStatus === 'pending'

  return (
    <Link
      to={`/u/${entry.nickname}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-slate-800/60 ${
        isCompleted
          ? 'border border-amber-400/50 bg-gradient-to-r from-amber-950/30 to-yellow-950/15'
          : isCurrentUser
          ? 'border border-indigo-500/40 bg-indigo-950/30'
          : ''
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

      {/* Name + nickname (no progress bar for completed) */}
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-white truncate'>
          {entry.display_name || entry.nickname}
        </p>
        <p className='text-xs text-slate-400'>@{entry.nickname}</p>
        {!isCompleted && (
          <div className='mt-1 h-1.5 rounded-full bg-slate-700 overflow-hidden'>
            <div
              className='h-full rounded-full bg-emerald-500 transition-all'
              style={{ width: `${pctRounded}%` }}
            />
          </div>
        )}
      </div>

      {/* Stats: completed badge OR pct + missing */}
      {isCompleted ? (
        <div className='shrink-0 text-right'>
          <span className='inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-400/50 text-amber-300 text-[10px] font-bold whitespace-nowrap shadow-sm shadow-amber-900/20 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm'>
            🏆 {t('ranking.completedBadge')}
          </span>
        </div>
      ) : (
        <div className='shrink-0 text-right min-w-[3.5rem]'>
          <p className='text-sm font-bold text-white'>{pctRounded}%</p>
          <p className='text-[10px] text-slate-500 leading-tight'>{t('ranking.missing')}</p>
          <p className='text-base font-bold text-slate-400 leading-tight'>{missing}</p>
        </div>
      )}

      {/* Friend CTA */}
      {(showAdd || showPending) && (
        <div className='shrink-0'>
          {showAdd ? (
            <button
              type='button'
              aria-label={t('ranking.addFriend')}
              disabled={sending}
              onClick={e => { e.preventDefault(); e.stopPropagation(); onSendRequest?.() }}
              className='relative p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50'
            >
              {sending ? (
                <span className='block w-[1.125rem] h-[1.125rem] text-center text-xs leading-[1.125rem]'>…</span>
              ) : (
                <>
                  <svg className='w-[1.125rem] h-[1.125rem]' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
                    <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' />
                  </svg>
                  <span className='absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center leading-none'>
                    +
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className='relative p-1.5 rounded-lg bg-slate-700/60 text-slate-400' aria-label={t('ranking.requestSent')}>
              <svg className='w-[1.125rem] h-[1.125rem]' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
                <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' />
              </svg>
              <span className='absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center leading-none'>
                ✓
              </span>
            </div>
          )}
        </div>
      )}
    </Link>
  )
}
