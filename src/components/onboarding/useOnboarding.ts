import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnalyticsEvent, telemetry, type TelemetryConsentState } from '../../lib/telemetry'
import {
  clearActiveOnboarding,
  completeOnboardingStorage,
  hasCompletedOnboarding,
  markActiveOnboarding,
} from './storage'

export const ONBOARDING_FLAG_KEY = 'onboarding_v1'

const FEATURE_FLAG_WAIT_MS = 2200
const FEATURE_FLAG_POLL_MS = 150
const FORCE_ONBOARDING_KEY = 'onboarding_force_variant'

type OnboardingStatus = 'checking' | 'hidden' | 'active'
type CompletionReason = 'completed' | 'skipped'

function isVariantEnabled(): boolean {
  try {
    if (localStorage.getItem(FORCE_ONBOARDING_KEY) === '1') return true
  } catch {
    /* private mode */
  }
  return telemetry.flag(ONBOARDING_FLAG_KEY) || telemetry.variant(ONBOARDING_FLAG_KEY) === 'variant'
}

export function useOnboarding(userId: string, consent: TelemetryConsentState) {
  const [status, setStatus] = useState<OnboardingStatus>('checking')

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    if (hasCompletedOnboarding(userId) || consent !== 'granted') {
      clearActiveOnboarding(userId)
      setStatus('hidden')
      return undefined
    }

    setStatus('checking')
    let activated = false
    const startedWaitingAt = Date.now()

    const activate = () => {
      if (!cancelled && !activated && isVariantEnabled()) {
        activated = true
        markActiveOnboarding(userId)
        telemetry.track(AnalyticsEvent.ONBOARDING_STARTED)
        setStatus('active')
      }
    }

    const unsubscribeFlags = telemetry.onFeatureFlags(() => {
      activate()
    })

    const checkFlag = () => {
      if (cancelled || activated) return

      activate()
      if (activated) return

      if (Date.now() - startedWaitingAt >= FEATURE_FLAG_WAIT_MS) {
        clearActiveOnboarding(userId)
        setStatus('hidden')
        return
      }

      timer = window.setTimeout(checkFlag, FEATURE_FLAG_POLL_MS)
    }

    checkFlag()

    return () => {
      cancelled = true
      unsubscribeFlags()
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [consent, userId])

  const complete = useCallback((reason: CompletionReason = 'completed') => {
    completeOnboardingStorage(userId)
    telemetry.track(reason === 'skipped' ? AnalyticsEvent.ONBOARDING_SKIPPED : AnalyticsEvent.ONBOARDING_COMPLETED)
    setStatus('hidden')
  }, [userId])

  return useMemo(() => ({
    isChecking: status === 'checking',
    isFirstSession: status === 'active',
    complete,
  }), [complete, status])
}
