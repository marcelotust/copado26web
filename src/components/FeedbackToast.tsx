import { useI18n } from '../i18n'
import type { FeedbackToastItem, FeedbackVariant } from '../contexts/FeedbackContext'

const VARIANT_STYLES: Record<FeedbackVariant, string> = {
  success: 'border-emerald-700/60 bg-emerald-950/90 text-emerald-100',
  error: 'border-red-700/60 bg-red-950/90 text-red-100',
  info: 'border-slate-600 bg-slate-900/95 text-slate-100',
}

type Props = {
  toasts: FeedbackToastItem[]
  onDismiss: (id: string) => void
}

export default function FeedbackToast({ toasts, onDismiss }: Props) {
  const { t } = useI18n()

  if (toasts.length === 0) return null

  return (
    <div
      className='pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6'
      aria-live='polite'
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${VARIANT_STYLES[toast.variant]}`}
          role={toast.variant === 'error' ? 'alert' : 'status'}
        >
          <p className='flex-1 leading-snug'>{toast.message}</p>
          <div className='flex shrink-0 items-center gap-2'>
            {toast.action && (
              <button
                type='button'
                onClick={() => {
                  toast.action?.onClick()
                  onDismiss(toast.id)
                }}
                className='rounded-md px-2 py-1 text-xs font-semibold underline-offset-2 hover:underline'
              >
                {toast.action.label}
              </button>
            )}
            <button
              type='button'
              onClick={() => onDismiss(toast.id)}
              className='rounded-md p-1 opacity-70 hover:opacity-100'
              aria-label={t('feedback.dismiss')}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
