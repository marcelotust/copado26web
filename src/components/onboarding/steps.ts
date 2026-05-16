export type OnboardingStepConfig = {
  path: string
  target: string | null
  titleKey: string
  bodyKey: string
  /** Step 1: user must mark at least one sticker before continuing. */
  requireSticker?: boolean
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    path: '/album',
    target: '[data-onboarding-target="album-first-sticker"]',
    titleKey: 'onboarding.step1.title',
    bodyKey: 'onboarding.step1.body',
    requireSticker: true,
  },
  {
    path: '/missing',
    target: '[data-onboarding-target="missing-share"]',
    titleKey: 'onboarding.step2.title',
    bodyKey: 'onboarding.step2.body',
  },
  {
    path: '/missing',
    target: '[data-onboarding-target="missing-trade-checker"]',
    titleKey: 'onboarding.step3.title',
    bodyKey: 'onboarding.step3.body',
  },
  {
    path: '/swaps',
    target: '[data-onboarding-target="swaps-header"], [data-onboarding-target="swaps-tab"]',
    titleKey: 'onboarding.step4.title',
    bodyKey: 'onboarding.step4.body',
  },
  {
    path: '/swaps',
    target: '[data-onboarding-target="trade-qr-button"]',
    titleKey: 'onboarding.step5.title',
    bodyKey: 'onboarding.step5.body',
  },
  {
    path: '/dashboard',
    target: '[data-onboarding-target="dashboard-global-progress"]',
    titleKey: 'onboarding.step6.title',
    bodyKey: 'onboarding.step6.body',
  },
  {
    path: '/dashboard',
    target: '[data-onboarding-target="dashboard-challenges"]',
    titleKey: 'onboarding.step7.title',
    bodyKey: 'onboarding.step7.body',
  },
  {
    path: '/album',
    target: '[data-onboarding-target="album-grid"]',
    titleKey: 'onboarding.step8.title',
    bodyKey: 'onboarding.step8.body',
  },
]
