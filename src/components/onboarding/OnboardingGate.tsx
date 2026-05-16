import type { TelemetryConsentState } from '../../lib/telemetry'
import OnboardingOverlay from './OnboardingOverlay'
import { useOnboarding } from './useOnboarding'

type OnboardingGateProps = {
  userId: string
  consent: TelemetryConsentState
}

export default function OnboardingGate({ userId, consent }: OnboardingGateProps) {
  const { isFirstSession, complete } = useOnboarding(userId, consent)

  if (!isFirstSession) return null
  return <OnboardingOverlay onComplete={complete} />
}
