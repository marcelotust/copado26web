import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { useFriendProfile } from '../state/friends'
import { useStickersContext } from '../state/StickersProvider'
import Avatar from '../components/friends/Avatar'
import TradeSuggestionList from '../components/friends/TradeSuggestionList'

type Props = { currentUserId: string }

export default function FriendProfilePage({ currentUserId }: Props) {
  const { t } = useI18n()
  const { nickname } = useParams<{ nickname: string }>()
  const navigate = useNavigate()
  const [targetUserId, setTargetUserId] = useState<string | null>(null)
  const [resolving, setResolving] = useState(true)

  // Resolve nickname → user_id
  useEffect(() => {
    if (!nickname) { navigate('/friends'); return }
    setResolving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (supabase.rpc as any)('get_public_profile', { p_nickname: nickname }).then(({ data }: { data: { user_id: string } | null }) => {
      if (!data) navigate('/not-found')
      else setTargetUserId(data.user_id)
      setResolving(false)
    })
  }, [nickname, navigate])

  const { profile, loading } = useFriendProfile(targetUserId)
  const { catalog } = useStickersContext()

  if (resolving || loading) {
    return (
      <div className='flex flex-col h-full'>
        <div className='max-w-6xl mx-auto w-full p-4 flex flex-col gap-4'>
          <div className='h-20 rounded-2xl bg-slate-800 animate-pulse' />
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2 h-40 rounded-xl bg-slate-800 animate-pulse' />
            <div className='h-40 rounded-xl bg-slate-800 animate-pulse' />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const isOwn = profile.user_id === currentUserId
  const canSeeCollection = profile.stickers !== null

  const friendStickers = profile.stickers ?? {}
  const collected = Object.entries(friendStickers).filter(([, q]) => q >= 1).map(([id]) => id)
  const missing = [...catalog.keys()].filter(id => (friendStickers[id] ?? 0) === 0)
  const duplicates = Object.entries(friendStickers).filter(([, q]) => q >= 2).map(([id]) => id)

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto'>
        <div className='max-w-6xl mx-auto w-full p-4 flex flex-col gap-6'>
          {/* Back */}
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors w-fit'
          >
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
              <path d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' />
            </svg>
            {t('friends.profile.back')}
          </button>

          {/* Profile header */}
          <div className='flex items-center gap-4 p-4 rounded-2xl bg-slate-800/60'>
            <Avatar userId={profile.user_id} displayName={profile.display_name} avatarUrl={profile.avatar_url} size='lg' />
            <div className='flex-1 min-w-0'>
              <h1 className='text-white font-bold text-lg truncate'>{profile.display_name}</h1>
              <p className='text-slate-400 text-sm'>@{profile.nickname}</p>
              {profile.progress && (() => {
                const pct = profile.progress.total > 0
                  ? Math.round((profile.progress.collected / profile.progress.total) * 100) : 0
                return (
                  <div className='mt-2'>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 h-2 rounded-full bg-slate-700'>
                        <div className='h-2 rounded-full bg-indigo-500' style={{ width: `${pct}%` }} />
                      </div>
                      <span className='text-xs text-slate-400 shrink-0'>{pct}%</span>
                    </div>
                    <p className='text-xs text-slate-500 mt-1'>
                      {profile.progress.collected} / {profile.progress.total} {t('friends.profile.stickers')}
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Collection */}
          {!canSeeCollection && (
            <div className='px-4 py-6 rounded-xl bg-slate-800/40 text-center'>
              <p className='text-slate-400 text-sm'>
                {profile.collection_visibility === 'private'
                  ? t('friends.profile.private')
                  : t('friends.profile.friendsOnly')}
              </p>
            </div>
          )}

          {canSeeCollection && (
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-6 items-start'>
              {/* Collection lists — main column on desktop */}
              <div className={`${isOwn ? 'lg:col-span-3' : 'lg:col-span-2'} flex flex-col gap-6 min-w-0`}>
                <section>
                  <h2 className='text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2'>
                    {t('friends.profile.collected')} ({collected.length})
                  </h2>
                  <div className='flex flex-wrap gap-1'>
                    {collected.slice(0, 60).map(id => (
                      <span key={id} className='px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs font-mono'>
                        {id}
                      </span>
                    ))}
                    {collected.length > 60 && (
                      <span className='text-slate-500 text-xs self-center'>+{collected.length - 60}</span>
                    )}
                  </div>
                </section>

                {missing.length > 0 && (
                  <section>
                    <h2 className='text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2'>
                      {t('friends.profile.missing')} ({missing.length})
                    </h2>
                    <div className='flex flex-wrap gap-1'>
                      {missing.slice(0, 60).map(id => (
                        <span key={id} className='px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-xs font-mono border border-slate-700/50'>
                          {id}
                        </span>
                      ))}
                      {missing.length > 60 && (
                        <span className='text-slate-500 text-xs self-center'>+{missing.length - 60}</span>
                      )}
                    </div>
                  </section>
                )}

                {duplicates.length > 0 && (
                  <section>
                    <h2 className='text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2'>
                      {t('friends.profile.duplicates')} ({duplicates.length})
                    </h2>
                    <div className='flex flex-wrap gap-1'>
                      {duplicates.map(id => (
                        <span key={id} className='px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 text-xs font-mono border border-amber-700/30'>
                          {id}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Trade suggestions — sidebar on desktop; only for friends, not own profile */}
              {!isOwn && (
                <div className='min-w-0 lg:sticky lg:top-4'>
                  <TradeSuggestionList friendUserId={profile.user_id} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
