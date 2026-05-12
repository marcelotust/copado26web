const VARIANT_STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-100',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
}

/** @param {{ items: Array<{ id: string, message: string, variant: keyof VARIANT_STYLES }>, onDismiss: (id: string) => void, dismissLabel: string }} props */
export default function FeedbackToasts({ items, onDismiss, dismissLabel }) {
  if (items.length === 0) return null

  return (
    <div
      className='fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0'
      aria-live='polite'
      aria-relevant='additions'
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={[
            'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur',
            VARIANT_STYLES[item.variant] ?? VARIANT_STYLES.info,
          ].join(' ')}
          role={item.variant === 'error' ? 'alert' : 'status'}
        >
          <p className='flex-1 leading-snug'>{item.message}</p>
          <button
            type='button'
            onClick={() => onDismiss(item.id)}
            className='shrink-0 text-xs font-semibold uppercase tracking-wide text-white/70 transition-colors hover:text-white'
          >
            {dismissLabel}
          </button>
        </div>
      ))}
    </div>
  )
}
