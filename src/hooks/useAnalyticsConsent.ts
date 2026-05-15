import { useCallback, useState } from 'react'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'

export type ConsentState = 'granted' | 'declined' | null

const storageKey = (userId: string) => `analytics_consent_v1_${userId}`

function readConsent(userId: string): ConsentState {
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
  const [consent, setConsent] = useState<ConsentState>(() => readConsent(userId))

  const grant = useCallback(() => {
    writeConsent(userId, 'granted')
    setConsent('granted')
    try {
      sessionStorage.setItem('analytics_consent_pending', 'granted')
    } catch { /* private mode */ }
  }, [userId])

  const decline = useCallback(() => {
    writeConsent(userId, 'declined')
    setConsent('declined')
    telemetry.track(AnalyticsEvent.CONSENT_ANALYTICS_UPDATED, { granted: false })
  }, [userId])

  return { consent, grant, decline }
}
