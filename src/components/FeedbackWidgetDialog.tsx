import { createPortal } from 'react-dom'
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from './feedbackWidgetConfig'
import FeedbackCategoryIcon from './FeedbackCategoryIcon'

type Props = {
  titleId: string
  descId: string
  title: string
  description: string
  closeLabel: string
  mailtoByCategory: Record<FeedbackCategory, string>
  labelFor: (category: FeedbackCategory) => string
  hintFor: (category: FeedbackCategory) => string
  onClose: () => void
  onCategoryClick: (category: FeedbackCategory) => void
}

export default function FeedbackWidgetDialog({
  titleId,
  descId,
  title,
  description,
  closeLabel,
  mailtoByCategory,
  labelFor,
  hintFor,
  onClose,
  onCategoryClick,
}: Props) {
  return createPortal(
    <div className='fixed inset-0 z-[80] flex items-end justify-end p-4 sm:p-6'>
      <div
        className='absolute inset-0 bg-black/45 backdrop-blur-[2px]'
        onClick={onClose}
        aria-hidden='true'
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={descId}
        className='relative mb-16 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl sm:mb-14'
      >
        <div className='flex items-start justify-between gap-4 border-b border-slate-800 px-4 py-4'>
          <div>
            <h2 id={titleId} className='text-sm font-bold text-white'>{title}</h2>
            <p id={descId} className='mt-1 text-xs leading-relaxed text-slate-400'>
              {description}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500'
            aria-label={closeLabel}
          >
            <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
              <path d='M6 6l12 12M18 6 6 18' strokeLinecap='round' />
            </svg>
          </button>
        </div>

        <div className='flex flex-col gap-2 p-3'>
          {FEEDBACK_CATEGORIES.map((category) => (
            <a
              key={category}
              href={mailtoByCategory[category]}
              onClick={() => onCategoryClick(category)}
              className='flex min-h-14 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 text-left transition hover:border-emerald-400/50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300'
            >
              <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300'>
                <FeedbackCategoryIcon category={category} />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block text-sm font-semibold text-white'>{labelFor(category)}</span>
                <span className='mt-0.5 block text-xs leading-snug text-slate-400'>
                  {hintFor(category)}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
