import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useFriends, useFriendRequests, useProfile, useSentFriendRequests } from '../state/friends'
import FriendCard from '../components/friends/FriendCard'
import { PendingRequestRow } from '../components/friends/FriendRequestRow'
import SentRequestRow from '../components/friends/SentRequestRow'
import NicknameSetupModal from '../components/friends/NicknameSetupModal'
import AddFriendDialog from '../components/friends/AddFriendDialog'
import StickerListPageHeader from '../components/StickerListPageHeader'

type Props = { userId: string }

export default function FriendsPage({ userId }: Props) {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const { profile, loading: profileLoading, setNickname } = useProfile(userId)
  const { friends, loading: friendsLoading, removeFriend, refetch: refetchFriends } = useFriends()
  const { data: requests, loading: reqLoading, acceptRequest, declineRequest, refetch: refetchRequests } = useFriendRequests()
  const { requests: sentRequests, loading: sentLoading } = useSentFriendRequests()
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false)
  const [addFriendOpen, setAddFriendOpen] = useState(false)

  // Deep link: /friends/add?code=<nickname>
  const incomingCode = searchParams.get('code')
  useEffect(() => {
    if (incomingCode && profile?.nickname) setAddFriendOpen(true)
  }, [incomingCode, profile?.nickname])

  // Soft-block: open nickname modal if no profile
  useEffect(() => {
    if (!profileLoading && !profile) setNicknameModalOpen(true)
  }, [profileLoading, profile])

  function handleRequestSent() {
    void refetchRequests()
    setAddFriendOpen(false)
  }

  const pending = requests?.pending ?? []
  const loading = profileLoading || friendsLoading || reqLoading || sentLoading

  return (
    <div className='flex flex-col h-full'>
      <StickerListPageHeader
        title={t('friends.page.title')}
        icon='👥'
        accentColor='#8B5CF6'
        summary={t('friends.page.subtitle')}
      />
      <div className='flex-1 overflow-y-auto'>
        <div className='max-w-6xl mx-auto w-full p-4 flex flex-col gap-6'>
          {loading ? (
            <div className='flex flex-col gap-3'>
              {[1, 2, 3].map(i => (
                <div key={i} className='h-16 rounded-xl bg-slate-800 animate-pulse' />
              ))}
            </div>
          ) : (
            <>
              {/* Pending requests */}
              {pending.length > 0 && (
                <section className='flex flex-col gap-2'>
                  <h2 className='text-xs font-semibold text-slate-400 uppercase tracking-wide'>
                    {t('friends.requests.pending')} ({pending.length})
                  </h2>
                  {pending.map(req => (
                    <PendingRequestRow
                      key={req.id}
                      request={req}
                      onAccept={async (id) => { await acceptRequest(id); await refetchFriends() }}
                      onDecline={declineRequest}
                    />
                  ))}
                </section>
              )}

              {/* Friends list */}
              <section className='flex flex-col gap-2'>
                {profile && (
                  <div className='flex items-center gap-2 mb-4'>
                    <button
                      type='button'
                      onClick={() => setAddFriendOpen(true)}
                      className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors'
                    >
                      <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
                        <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' />
                      </svg>
                      {t('friends.page.addFriend')}
                    </button>
                    <Link
                      to='/trading-partners'
                      className='ml-auto inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20'
                    >
                      <span aria-hidden>🤝</span>
                      {t('tradingPartners.findPartners')}
                    </Link>
                  </div>
                )}

                {/* Sent requests */}
                {sentRequests.length > 0 && (
                  <div className='flex flex-col gap-2 mb-4'>
                    <h2 className='text-xs font-semibold text-slate-400 uppercase tracking-wide'>
                      {t('friends.requests.sentSection')} ({sentRequests.length})
                    </h2>
                    {sentRequests.map(req => (
                      <SentRequestRow key={req.to_user} request={req} />
                    ))}
                  </div>
                )}

                <h2 className='text-xs font-semibold text-slate-400 uppercase tracking-wide'>
                  {t('friends.page.myFriends')} ({friends.length})
                </h2>
                {friends.length === 0 ? (
                  <div className='px-4 py-6 rounded-xl bg-slate-800/40 text-center'>
                    <p className='text-slate-400 text-sm'>{t('friends.page.empty')}</p>
                    {profile && (
                      <button
                        type='button'
                        onClick={() => setAddFriendOpen(true)}
                        className='mt-3 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors'
                      >
                        {t('friends.page.addFriend')}
                      </button>
                    )}
                  </div>
                ) : (
                  friends.map(f => (
                    <FriendCard
                      key={f.user_id}
                      friend={f}
                      onRemove={async (id) => { await removeFriend(id) }}
                    />
                  ))
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <NicknameSetupModal
        isOpen={nicknameModalOpen}
        onClose={() => setNicknameModalOpen(false)}
        onSave={async (nick) => {
          const result = await setNickname(nick)
          return { ok: result.ok, error: result.error }
        }}
      />

      {profile && (
        <AddFriendDialog
          isOpen={addFriendOpen}
          onClose={() => setAddFriendOpen(false)}
          myNickname={profile.nickname}
          initialNickname={incomingCode ?? undefined}
          onRequestSent={handleRequestSent}
        />
      )}
    </div>
  )
}
