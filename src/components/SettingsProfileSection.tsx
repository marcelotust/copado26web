import { useState } from 'react'
import { useI18n } from '../i18n'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import NicknameSetupModal from './friends/NicknameSetupModal'
import AvatarPaletteModal from './friends/AvatarPaletteModal'
import Avatar from './friends/Avatar'
import type { CollectionVisibility, Profile } from '../state/friends'
import { avatarColorPalette } from '../constants/avatarColorPalette'

type Props = {
  profile: Profile | null
  onSetNickname: (nickname: string, displayName?: string) => Promise<{ ok: boolean; error?: string; is_new?: boolean }>
  onUpdateDisplayName: (name: string) => Promise<{ ok: boolean; error?: string }>
  onUpdateVisibility: (v: string) => Promise<{ ok: boolean; error?: string }>
  onUpdateAvatarPalette: (paletteId: number) => Promise<{ ok: boolean; error?: string }>
}

const VISIBILITY_OPTIONS: { value: CollectionVisibility; labelKey: string }[] = [
  { value: 'public', labelKey: 'friends.settings.public' },
  { value: 'friends', labelKey: 'friends.settings.friends' },
  { value: 'private', labelKey: 'friends.settings.private' },
]

export default function SettingsProfileSection({ profile, onSetNickname, onUpdateDisplayName, onUpdateVisibility, onUpdateAvatarPalette }: Props) {
  const { t } = useI18n()
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false)
  const [paletteModalOpen, setPaletteModalOpen] = useState(false)
  const [displayNameValue, setDisplayNameValue] = useState(profile?.display_name ?? '')
  const [displayNameSaving, setDisplayNameSaving] = useState(false)
  const [visibilitySaving, setVisibilitySaving] = useState(false)

  async function handleVisibilityChange(v: string) {
    const prev = profile?.collection_visibility
    setVisibilitySaving(true)
    const result = await onUpdateVisibility(v)
    setVisibilitySaving(false)
    if (result.ok) {
      telemetry.track(AnalyticsEvent.PROFILE_VISIBILITY_CHANGED, { from: prev, to: v })
    }
  }

  async function handlePaletteSelect(paletteId: number) {
    await onUpdateAvatarPalette(paletteId)
  }

  async function handleDisplayNameSave() {
    if (!displayNameValue.trim()) return
    setDisplayNameSaving(true)
    await onUpdateDisplayName(displayNameValue.trim())
    setDisplayNameSaving(false)
  }

  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-sm font-semibold text-slate-400 uppercase tracking-wide'>
        {t('friends.settings.title')}
      </h2>

      {/* Nickname */}
      <div className='px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between gap-2'>
        <div>
          <p className='text-[10px] text-slate-500 uppercase tracking-widest mb-0.5'>{t('friends.settings.nicknameLabel')}</p>
          <p className='text-white text-sm'>{profile?.nickname ? `@${profile.nickname}` : t('friends.settings.noNickname')}</p>
        </div>
        <button
          type='button'
          onClick={() => setNicknameModalOpen(true)}
          className='shrink-0 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors'
        >
          {profile?.nickname ? t('friends.settings.changeNickname') : t('friends.settings.setNickname')}
        </button>
      </div>

      {/* Display name */}
      <div className='flex flex-col gap-1'>
        <label className='text-[10px] text-slate-500 uppercase tracking-widest px-1'>
          {t('friends.settings.displayNameLabel')}
        </label>
        <div className='flex gap-2'>
          <input
            type='text'
            value={displayNameValue}
            maxLength={40}
            onChange={e => setDisplayNameValue(e.target.value)}
            placeholder={t('friends.settings.displayNamePlaceholder')}
            className='flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500'
          />
          <button
            type='button'
            onClick={() => { void handleDisplayNameSave() }}
            disabled={displayNameSaving || !displayNameValue.trim()}
            className='px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors disabled:opacity-50'
          >
            {displayNameSaving ? '…' : t('friends.settings.save')}
          </button>
        </div>
      </div>

      {/* Collection visibility */}
      <div className='flex flex-col gap-1'>
        <p className='text-[10px] text-slate-500 uppercase tracking-widest px-1'>{t('friends.settings.visibilityLabel')}</p>
        <div className='flex gap-2'>
          {VISIBILITY_OPTIONS.map(({ value, labelKey }) => (
            <button
              key={value}
              type='button'
              disabled={visibilitySaving}
              onClick={() => { void handleVisibilityChange(value) }}
              className={[
                'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50',
                profile?.collection_visibility === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white',
              ].join(' ')}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
        <p className='text-xs text-slate-500 px-1'>{t('friends.settings.visibilityHint')}</p>
      </div>

      {/* Avatar color */}
      <div className='px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3 min-w-0'>
          <Avatar
            userId={profile?.user_id ?? ''}
            displayName={profile?.display_name ?? ''}
            paletteId={profile?.avatar_palette_id}
            size='md'
          />
          <div className='min-w-0'>
            <p className='text-[10px] text-slate-500 uppercase tracking-widest mb-0.5'>{t('friends.settings.avatarPaletteLabel')}</p>
            <p className='text-white text-sm truncate'>
              {avatarColorPalette.find(p => p.id === profile?.avatar_palette_id)?.name ?? '—'}
            </p>
          </div>
        </div>
        <button
          type='button'
          onClick={() => setPaletteModalOpen(true)}
          className='shrink-0 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors'
        >
          {t('friends.settings.changeAvatarColor')}
        </button>
      </div>

      <NicknameSetupModal
        isOpen={nicknameModalOpen}
        onClose={() => setNicknameModalOpen(false)}
        onSave={async (nickname) => {
          const result = await onSetNickname(nickname)
          return result
        }}
      />

      <AvatarPaletteModal
        isOpen={paletteModalOpen}
        onClose={() => setPaletteModalOpen(false)}
        onSave={handlePaletteSelect}
        displayName={profile?.display_name ?? ''}
        currentPaletteId={profile?.avatar_palette_id ?? null}
      />
    </section>
  )
}
