import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import FeedbackToasts from './FeedbackToasts'

/** @typedef {'success' | 'error' | 'info'} FeedbackVariant */

const FeedbackContext = createContext(/** @type {null | { push: (message: string, options?: { variant?: FeedbackVariant, duration?: number }) => string, dismiss: (id: string) => void }} */ (null))

export function FeedbackProvider({ children }) {
  const { t } = useI18n()
  const [items, setItems] = useState(/** @type {Array<{ id: string, message: string, variant: FeedbackVariant }>} */ ([]))
  const timersRef = useRef(/** @type {Map<string, ReturnType<typeof setTimeout>>} */ (new Map()))

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const push = useCallback((message, options = {}) => {
    const id = crypto.randomUUID()
    const variant = options.variant ?? 'info'
    const duration = options.duration ?? (variant === 'error' ? 6000 : 4000)

    setItems((current) => [...current.slice(-4), { id, message, variant }])

    const timer = setTimeout(() => dismiss(id), duration)
    timersRef.current.set(id, timer)
    return id
  }, [dismiss])

  return (
    <FeedbackContext.Provider value={{ push, dismiss }}>
      {children}
      <FeedbackToasts
        items={items}
        onDismiss={dismiss}
        dismissLabel={t('feedback.dismiss')}
      />
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider')
  }
  return context
}
