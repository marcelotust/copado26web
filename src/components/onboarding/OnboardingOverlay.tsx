import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import OnboardingStep from './OnboardingStep'
import { panelStyle, spotlightStyle } from './overlayPosition'
import { useOnboardingTargetRect } from './useOnboardingTargetRect'

type CompletionReason = 'completed' | 'skipped'

type OnboardingOverlayProps = {
  onComplete: (reason?: CompletionReason) => void
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const { t } = useI18n()
  const [stepIndex, setStepIndex] = useState(0)

  const steps = useMemo(() => [
    {
      title: t('onboarding.step1.title'),
      body: t('onboarding.step1.body'),
      target: '[data-onboarding-target="album-first-sticker"], [data-onboarding-target="album-grid"]',
    },
    {
      title: t('onboarding.step2.title'),
      body: t('onboarding.step2.body'),
      target: '[data-onboarding-target="missing-tab"]',
    },
    {
      title: t('onboarding.step3.title'),
      body: t('onboarding.step3.body'),
      target: null,
    },
  ], [t])

  const activeStep = steps[stepIndex]
  const targetRect = useOnboardingTargetRect(activeStep.target)
  const total = steps.length
  const isLast = stepIndex === total - 1
  const activeSpotlightStyle = spotlightStyle(targetRect)

  return (
    <div className='fixed inset-0 z-50' role='dialog' aria-modal='true' aria-label={t('onboarding.label')}>
      <div className='absolute inset-0 bg-slate-950/78 backdrop-blur-[2px]' />

      {activeSpotlightStyle && (
        <div
          className='pointer-events-none absolute rounded-xl border-2 border-amber-300 shadow-[0_0_0_9999px_rgba(2,6,23,0.58),0_0_36px_rgba(251,191,36,0.55)]'
          style={activeSpotlightStyle}
        />
      )}

      <div className='absolute' style={panelStyle(targetRect)}>
        <OnboardingStep
          eyebrow={t('onboarding.eyebrow')}
          title={activeStep.title}
          body={activeStep.body}
          current={stepIndex + 1}
          total={total}
          canGoBack={stepIndex > 0}
          skipLabel={t('onboarding.skip')}
          backLabel={t('onboarding.back')}
          nextLabel={isLast ? t('onboarding.start') : t('onboarding.next')}
          onSkip={() => onComplete('skipped')}
          onBack={() => setStepIndex((idx) => Math.max(0, idx - 1))}
          onNext={() => {
            if (isLast) {
              onComplete('completed')
              return
            }
            setStepIndex((idx) => Math.min(total - 1, idx + 1))
          }}
        />
      </div>
    </div>
  )
}
