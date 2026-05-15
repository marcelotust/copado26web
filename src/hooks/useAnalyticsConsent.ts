import { useCallback, useState } from 'react'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

export type ConsentState = 'granted' | 'declined' | null

const storageKey = (userId: string) => `analytics_consent_v1_${userId}`

export function readAnalyticsConsent(userId: string): ConsentState {
  try {
    const v = localStorage.getItem(storageKey(userId))
    if (v === 'granted' || v === 'declined') return v
  } catch { /* private mode */ }
  return null
}

function writeConsent(userId: string, value: 'granted' | 'declined'): void {
  try { localStorage.setItem(storageKey(userId), value) } catch { /* quota */ }
}

export function useAnalyticsConsent(userId: string): {
  consent: ConsentState
  grant: () => void
  decline: () => void
} {
  const [consent, setConsent] = useState<ConsentState>(() => readAnalyticsConsent(userId))

  const grant = useCallback(() => {
    const previous = readAnalyticsConsent(userId)
    writeConsent(userId, 'granted')
    setConsent('granted')
    if (previous !== 'granted') {
      try {
        sessionStorage.setItem('analytics_consent_pending', 'granted')
      } catch { /* private mode */ }
    }
  }, [userId])

  const decline = useCallback(() => {
    const previous = readAnalyticsConsent(userId)
    if (previous === 'granted') {
      telemetry.track(AnalyticsEvent.CONSENT_ANALYTICS_UPDATED, { granted: false })
    } else if (previous !== 'declined') {
      telemetry.track(AnalyticsEvent.CONSENT_ANALYTICS_UPDATED, { granted: false })
    }
    writeConsent(userId, 'declined')
    setConsent('declined')
  }, [userId])

  return { consent, grant, decline }
}
