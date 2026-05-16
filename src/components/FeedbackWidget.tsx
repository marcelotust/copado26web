import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useFeedback } from '../contexts/FeedbackContext'
import { useI18n } from '../i18n'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import FeedbackWidgetDialog from './FeedbackWidgetDialog'
import {
  FEEDBACK_CATEGORIES,
  buildFeedbackMailto,
  type FeedbackCategory,
} from './feedbackWidgetConfig'

export { buildFeedbackMailto } from './feedbackWidgetConfig'

export default function FeedbackWidget() {
  const { t } = useI18n()
  const feedback = useFeedback()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const titleId = useId()
  const descId = useId()

  const mailtoByCategory = useMemo(() => {
    return Object.fromEntries(
      FEEDBACK_CATEGORIES.map((category) => [
        category,
        buildFeedbackMailto({
          subject: t(`feedbackWidget.categories.${category}.subject`),
          body: t(`feedbackWidget.categories.${category}.body`),
        }),
      ]),
    ) as Record<FeedbackCategory, string>
  }, [t])

  const closeModal = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  function openModal() {
    telemetry.track(AnalyticsEvent.FEEDBACK_WIDGET_OPENED, { result: 'opened' })
    setOpen(true)
  }

  function handleCategoryClick(category: FeedbackCategory) {
    telemetry.track(AnalyticsEvent.FEEDBACK_WIDGET_SUBMITTED, {
      category,
      result: 'mailto_started',
    })
    feedback.info('feedbackWidget.mailtoStarted')
    closeModal()
  }

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeModal, open])

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        onClick={openModal}
        className='fixed bottom-5 right-4 z-[55] flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-500 text-slate-950 shadow-xl shadow-black/30 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-slate-950 sm:bottom-6 sm:right-6'
        aria-label={t('feedbackWidget.buttonLabel')}
        aria-haspopup='dialog'
        aria-expanded={open}
      >
        <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' aria-hidden='true'>
          <path d='M4 5h16v11H8l-4 4V5Z' strokeLinejoin='round' />
          <path d='M8 9h8M8 12h5' strokeLinecap='round' />
        </svg>
      </button>

      {open && (
        <FeedbackWidgetDialog
          titleId={titleId}
          descId={descId}
          title={t('feedbackWidget.title')}
          description={t('feedbackWidget.description')}
          closeLabel={t('feedbackWidget.close')}
          mailtoByCategory={mailtoByCategory}
          labelFor={(category) => t(`feedbackWidget.categories.${category}.label`)}
          hintFor={(category) => t(`feedbackWidget.categories.${category}.hint`)}
          onClose={closeModal}
          onCategoryClick={handleCategoryClick}
        />
      )}
    </>
  )
}
