import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { TelemetryConsentState } from '../../lib/telemetry'
import OnboardingOverlay from './OnboardingOverlay'
import { useOnboarding } from './useOnboarding'

type OnboardingGateProps = {
  userId: string
  consent: TelemetryConsentState
}

export default function OnboardingGate({ userId, consent }: OnboardingGateProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isFirstSession, complete } = useOnboarding(userId, consent)

  useEffect(() => {
    if (isFirstSession && location.pathname !== '/album') {
      navigate('/album')
    }
  }, [isFirstSession, location.pathname, navigate])

  if (!isFirstSession) return null
  return <OnboardingOverlay onComplete={complete} />
}
