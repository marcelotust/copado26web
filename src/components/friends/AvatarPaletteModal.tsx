import { createPortal } from 'react-dom'
import { useState } from 'react'
import { useI18n } from '../../i18n'
import { avatarColorPalette } from '../../constants/avatarColorPalette'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (paletteId: number) => Promise<void>
  displayName: string
  currentPaletteId: number | null
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
}

export default function AvatarPaletteModal({ isOpen, onClose, onSave, displayName, currentPaletteId }: Props) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<number>(currentPaletteId ?? 1)
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const initials = getInitials(displayName)
  const preview = avatarColorPalette.find(p => p.id === selected) ?? avatarColorPalette[0]

  async function handleSave() {
    setSaving(true)
    await onSave(selected)
    setSaving(false)
    onClose()
  }

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' onClick={onClose} aria-hidden />
      <div className='relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 flex flex-col gap-5'>
        <h2 className='text-white font-bold text-base'>{t('friends.settings.avatarPaletteLabel')}</h2>

        {/* Preview */}
        <div className='flex flex-col items-center gap-2'>
          <div
            className='w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold select-none transition-all duration-200'
            style={{
              background: `linear-gradient(135deg, ${preview.firstColor}, ${preview.secondColor})`,
              color: preview.color,
            }}
            aria-hidden
          >
            {initials}
          </div>
          <p className='text-xs text-slate-400'>{preview.name}</p>
        </div>

        {/* Palette grid */}
        <div className='grid grid-cols-5 gap-3'>
          {avatarColorPalette.map(entry => {
            const isSelected = selected === entry.id
            return (
              <button
                key={entry.id}
                type='button'
                title={entry.name}
                onClick={() => setSelected(entry.id)}
                className={[
                  'flex items-center justify-center rounded-full w-10 h-10 text-xs font-bold transition-all mx-auto',
                  isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105',
                ].join(' ')}
                style={{
                  background: `linear-gradient(135deg, ${entry.firstColor}, ${entry.secondColor})`,
                  color: entry.color,
                }}
                aria-label={entry.name}
                aria-pressed={isSelected}
              >
                {isSelected ? '✓' : ''}
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className='flex gap-3 pt-1'>
          <button
            type='button'
            onClick={() => { void handleSave() }}
            disabled={saving}
            className='flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50'
          >
            {saving ? '…' : t('friends.settings.save')}
          </button>
          <button
            type='button'
            onClick={onClose}
            disabled={saving}
            className='flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors'
          >
            {t('friends.nickname.cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
