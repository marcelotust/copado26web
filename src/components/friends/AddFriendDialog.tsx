import { createPortal } from 'react-dom'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { supabase } from '../../lib/supabase'
import { AnalyticsEvent, telemetry } from '../../lib/telemetry'
import Avatar from './Avatar'

const QRScanner = lazy(() => import('./QRScanner'))
const QRGenerator = lazy(() => import('./QRGenerator'))

type Tab = 'nickname' | 'email' | 'qr'

type Props = {
  isOpen: boolean
  onClose: () => void
  myNickname: string
  initialNickname?: string
  onRequestSent?: () => void
}

export default function AddFriendDialog({ isOpen, onClose, myNickname, initialNickname, onRequestSent }: Props) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('nickname')
  const [nicknameValue, setNicknameValue] = useState(initialNickname ?? '')
  const [emailValue, setEmailValue] = useState('')
  const [found, setFound] = useState<{ user_id: string; nickname: string; display_name: string | null; avatar_url: string | null } | null>(null)
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!isOpen) { setNicknameValue(initialNickname ?? ''); setEmailValue(''); setFound(null); setDone(false); setError(null) }
  }, [isOpen, initialNickname])

  useEffect(() => {
    if (tab !== 'nickname' || !nicknameValue || nicknameValue.length < 3) { setFound(null); return }
    clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(async () => {
      setSearching(true)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.rpc as any)('lookup_by_nickname', { p_nickname: nicknameValue })
        setFound(data as typeof found)
      } catch { setFound(null) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(searchTimer.current)
  }, [nicknameValue, tab])

  if (!isOpen) return null

  async function sendByNickname() {
    if (!found) return
    setSending(true); setError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcErr } = await (supabase.rpc as any)('send_friend_request_by_nickname', { p_nickname: found.nickname })
      if (rpcErr) throw rpcErr
      telemetry.track(AnalyticsEvent.FRIEND_REQUEST_SENT, { discovery_method: 'nickname' })
      setDone(true)
      onRequestSent?.()
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? String(err))
    } finally { setSending(false) }
  }

  async function sendByEmail() {
    if (!emailValue) return
    setSending(true); setError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('send_friend_request_by_email', { p_email: emailValue })
      telemetry.track(AnalyticsEvent.FRIEND_REQUEST_SENT, { discovery_method: 'email' })
      setDone(true)
      onRequestSent?.()
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? String(err))
    } finally { setSending(false) }
  }

  function handleQRResult(nickname: string) {
    setTab('nickname')
    setNicknameValue(nickname)
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'nickname', label: t('friends.add.tabNickname') },
    { id: 'email', label: t('friends.add.tabEmail') },
    { id: 'qr', label: t('friends.add.tabQr') },
  ]

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} aria-hidden />
      <div className='relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col max-h-[90dvh]'>
        <div className='flex items-center justify-between p-5 pb-0'>
          <h2 className='text-white font-bold text-base'>{t('friends.add.title')}</h2>
          <button type='button' onClick={onClose} className='p-1 text-slate-400 hover:text-white transition-colors'>
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
              <path d='M18 6L6 18M6 6l12 12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className='flex gap-1 px-5 pt-4'>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type='button'
              onClick={() => { setTab(id); setDone(false); setError(null) }}
              className={[
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                tab === id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className='p-5 flex-1 overflow-y-auto'>
          {done ? (
            <div className='text-center py-4'>
              <p className='text-emerald-400 font-semibold'>{t('friends.add.sent')}</p>
              <p className='text-slate-400 text-sm mt-1'>{t('friends.add.sentHint')}</p>
            </div>
          ) : (
            <>
              {tab === 'nickname' && (
                <div className='flex flex-col gap-3'>
                  <input
                    type='text'
                    value={nicknameValue}
                    onChange={e => setNicknameValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder={t('friends.add.nicknamePlaceholder')}
                    className='w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500'
                  />
                  {searching && <p className='text-slate-500 text-xs'>{t('friends.add.searching')}</p>}
                  {!searching && nicknameValue.length >= 3 && !found && (
                    <p className='text-slate-500 text-xs'>{t('friends.add.notFound')}</p>
                  )}
                  {found && (
                    <div className='flex items-center gap-3 p-3 rounded-xl bg-slate-800'>
                      <Avatar
                        userId={found.user_id}
                        displayName={found.display_name ?? '?'}
                        avatarUrl={found.avatar_url}
                        size='md'
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='text-white text-sm font-medium'>
                          {found.display_name ?? t('friends.add.privateProfile')}
                        </p>
                        <p className='text-slate-400 text-xs'>@{found.nickname}</p>
                      </div>
                    </div>
                  )}
                  {error && <p className='text-red-400 text-xs'>{t('friends.add.error')}</p>}
                  <button
                    type='button'
                    onClick={() => { void sendByNickname() }}
                    disabled={!found || sending}
                    className='w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50'
                  >
                    {sending ? '…' : t('friends.add.send')}
                  </button>
                </div>
              )}

              {tab === 'email' && (
                <div className='flex flex-col gap-3'>
                  <p className='text-slate-400 text-xs'>{t('friends.add.emailHint')}</p>
                  <input
                    type='email'
                    value={emailValue}
                    onChange={e => setEmailValue(e.target.value)}
                    placeholder={t('friends.add.emailPlaceholder')}
                    className='w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500'
                  />
                  {error && <p className='text-red-400 text-xs'>{t('friends.add.error')}</p>}
                  <button
                    type='button'
                    onClick={() => { void sendByEmail() }}
                    disabled={!emailValue || sending}
                    className='w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50'
                  >
                    {sending ? '…' : t('friends.add.send')}
                  </button>
                </div>
              )}

              {tab === 'qr' && (
                <div className='flex flex-col gap-4'>
                  <div>
                    <p className='text-xs text-slate-400 mb-2'>{t('friends.qr.myCode')}</p>
                    <Suspense fallback={<div className='h-32 bg-slate-800 rounded-xl animate-pulse' />}>
                      <QRGenerator nickname={myNickname} />
                    </Suspense>
                  </div>
                  <div className='border-t border-slate-700 pt-4'>
                    <p className='text-xs text-slate-400 mb-2'>{t('friends.qr.scanFriend')}</p>
                    <Suspense fallback={<div className='h-48 bg-slate-800 rounded-xl animate-pulse' />}>
                      <QRScanner onResult={handleQRResult} />
                    </Suspense>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
