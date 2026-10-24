import { useCallback, useEffect } from 'react'
import {
  mountTelemetryFlags,
  syncTelemetryConsent,
  telemetry,
  type TelemetryConsentState,
} from '../lib/telemetry'

/** Thin React wrapper so components do not import the singleton directly. */
export function useTelemetry() {
  return telemetry
}

export function useTelemetryConsentSync(userId: string, consent: TelemetryConsentState) {
  useEffect(() => {
    // Flag-eval is independent of consent; mount as soon as we have a userId.
    void mountTelemetryFlags(userId)
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
