import {
  createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode,
} from 'react'
import { useI18n } from '../i18n'
import { formatMessage } from '../lib/formatMessage'
import FeedbackToast from '../components/FeedbackToast'

export type FeedbackVariant = 'success' | 'error' | 'info'

export type FeedbackToastItem = {
  id: string
  variant: FeedbackVariant
  message: string
  action?: { label: string; onClick: () => void }
}

export type FeedbackOptions = {
  variant?: FeedbackVariant
  /** i18n key — resolved with `t()` inside the provider */
  messageKey: string
  params?: Record<string, string>
  durationMs?: number
  action?: { labelKey: string; onClick: () => void }
}

export type FeedbackContextValue = {
  /** Show a toast. Prefer `success` / `error` / `info` for common cases. */
  show: (opts: FeedbackOptions) => void
  success: (messageKey: string, params?: Record<string, string>) => void
  error: (
    messageKey: string,
    params?: Record<string, string>,
    action?: { labelKey: string; onClick: () => void },
  ) => void
  info: (messageKey: string, params?: Record<string, string>) => void
  dismiss: (id: string) => void
}

const DEFAULT_DURATION: Record<FeedbackVariant, number> = {
  success: 4000,
  error: 6500,
  info: 4500,
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const [toasts, setToasts] = useState<FeedbackToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback((opts: FeedbackOptions) => {
    const variant = opts.variant ?? 'info'
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const message = formatMessage(t(opts.messageKey), opts.params)
    const item: FeedbackToastItem = {
      id,
      variant,
      message,
      action: opts.action
        ? { label: t(opts.action.labelKey), onClick: opts.action.onClick }
        : undefined,
    }
    setToasts((prev) => [...prev.slice(-2), item])
    const duration = opts.durationMs ?? DEFAULT_DURATION[variant]
    const timer = setTimeout(() => dismiss(id), duration)
    timersRef.current.set(id, timer)
  }, [dismiss, t])

  const success = useCallback(
    (messageKey: string, params?: Record<string, string>) => {
      show({ variant: 'success', messageKey, params })
    },
    [show],
  )

  const error = useCallback(
    (
      messageKey: string,
      params?: Record<string, string>,
      action?: { labelKey: string; onClick: () => void },
    ) => {
      show({ variant: 'error', messageKey, params, action })
    },
    [show],
  )

  const info = useCallback(
    (messageKey: string, params?: Record<string, string>) => {
      show({ variant: 'info', messageKey, params })
    },
    [show],
  )

  const value = useMemo(
    () => ({ show, success, error, info, dismiss }),
    [show, success, error, info, dismiss],
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <FeedbackToast toasts={toasts} onDismiss={dismiss} />
    </FeedbackContext.Provider>
  )
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>')
  return ctx
}
