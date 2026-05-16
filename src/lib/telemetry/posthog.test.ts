import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('activatePostHogAnalytics', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns null in dev even when VITE_POSTHOG_KEY is set', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    const { activatePostHogAnalytics } = await import('./posthog')
    await expect(activatePostHogAnalytics('user-1')).resolves.toBeNull()
  })
})
