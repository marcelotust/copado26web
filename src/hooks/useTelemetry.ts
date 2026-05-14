import { useCallback, useEffect } from 'react'
import { syncTelemetryConsent, telemetry, type TelemetryConsentState } from '../lib/telemetry'

/** Thin React wrapper so components do not import the singleton directly. */
export function useTelemetry() {
  return telemetry
}

export function useTelemetryConsentSync(userId: string, consent: TelemetryConsentState) {
  useEffect(() => {
    syncTelemetryConsent({ userId, consent })
  }, [userId, consent])

  useEffect(() => () => {
    telemetry.reset()
  }, [])
}

export function useTelemetrySignOut(signOut: () => Promise<void>) {
  return useCallback(async () => {
    telemetry.reset()
    await signOut()
  }, [signOut])
}
