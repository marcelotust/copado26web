import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { useAlbumProgress } from '../../state/stickersStore'
import OnboardingStep from './OnboardingStep'
import OnboardingScrim from './OnboardingScrim'
import { ONBOARDING_STEPS } from './steps'
import { panelStyle } from './overlayPosition'
import { useOnboardingTargetRect } from './useOnboardingTargetRect'
import { ONBOARDING_FADE_MS, useOnboardingStepFade } from './useOnboardingStepFade'

type CompletionReason = 'completed' | 'skipped'

type OnboardingOverlayProps = {
  onComplete: (reason?: CompletionReason) => void
}

function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const { collected } = useAlbumProgress()
  const { stepIndex, visible, goToStep, tryReveal } = useOnboardingStepFade()

  const steps = useMemo(
    () =>
      ONBOARDING_STEPS.map((step) => ({
        ...step,
        title: t(step.titleKey),
        body: t(step.bodyKey),
      })),
    [t],
  )

  const safeStepIndex = Math.min(Math.max(0, stepIndex), Math.max(0, steps.length - 1))
  const activeStep = steps[safeStepIndex]
  const total = steps.length
  const isLast = safeStepIndex === total - 1

  const needsTarget = Boolean(activeStep?.target)
  const routeReady = Boolean(activeStep) && location.pathname === activeStep.path
  const targetSelector = routeReady ? activeStep.target : null
  const targetRect = useOnboardingTargetRect(targetSelector)
  const isPositioned = !needsTarget || targetRect !== null
  const showChrome = visible && isPositioned

  const nextBlocked =
    Boolean(activeStep?.requireSticker) && collected < 1

  useEffect(() => {
    if (!activeStep) return
    if (location.pathname !== activeStep.path) {
      navigate(activeStep.path)
    }
  }, [activeStep, location.pathname, navigate])

  useEffect(() => {
    tryReveal(targetRect, needsTarget)
  }, [needsTarget, safeStepIndex, targetRect, tryReveal])

  if (!activeStep || total === 0) return null

  return (
    <div
      className='fixed inset-0 z-50 pointer-events-none'
      role='dialog'
      aria-modal='true'
      aria-label={t('onboarding.label')}
    >
      <div
        className='absolute inset-0 transition-opacity ease-in-out'
        style={{ opacity: showChrome ? 1 : 0, transitionDuration: `${ONBOARDING_FADE_MS}ms` }}
      >
        <OnboardingScrim targetRect={targetRect} />
      </div>

      <div
        className={`absolute transition-opacity ease-in-out ${showChrome ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          ...(targetRect ? panelStyle(targetRect) : { visibility: 'hidden' }),
          opacity: showChrome ? 1 : 0,
          transitionDuration: `${ONBOARDING_FADE_MS}ms`,
        }}
      >
        <OnboardingStep
          eyebrow={t('onboarding.eyebrow')}
          title={activeStep.title}
          body={activeStep.body}
          current={safeStepIndex + 1}
          total={total}
          canGoBack={safeStepIndex > 0}
          nextDisabled={nextBlocked || !showChrome}
          nextHint={nextBlocked ? t('onboarding.markFirstHint') : undefined}
          skipLabel={t('onboarding.skip')}
          backLabel={t('onboarding.back')}
          nextLabel={isLast ? t('onboarding.finish') : t('onboarding.next')}
          onSkip={() => onComplete('skipped')}
          onBack={() => goToStep(safeStepIndex - 1)}
          onNext={() => {
            if (nextBlocked || !showChrome) return
            if (isLast) {
              onComplete('completed')
              return
            }
            goToStep(safeStepIndex + 1)
          }}
        />
      </div>
    </div>
  )
}

export default OnboardingOverlay
