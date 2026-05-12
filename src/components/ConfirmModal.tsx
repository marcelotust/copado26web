import { createPortal } from 'react-dom'

type ConfirmModalProps = {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const confirmCls =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-500 text-white'
      : 'bg-emerald-600 hover:bg-emerald-500 text-white'

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className='relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 flex flex-col gap-4'>
        <h2 className='text-white font-bold text-base leading-snug'>{title}</h2>

        {description && (
          <p className='text-slate-400 text-sm leading-relaxed'>{description}</p>
        )}

        <div className='flex gap-3 pt-1'>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={[
              'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50',
              confirmCls,
            ].join(' ')}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className='flex-1 py-2.5 rounded-xl font-semibold text-sm bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50'
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
