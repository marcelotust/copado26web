import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('bootstrapPostHogFlags', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns null in dev even when VITE_POSTHOG_KEY is set', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    const { bootstrapPostHogFlags } = await import('./posthog')
    await expect(bootstrapPostHogFlags('user-1')).resolves.toBeNull()
  })

  it('returns null in prod when VITE_POSTHOG_KEY is missing', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_POSTHOG_KEY', '')
    const { bootstrapPostHogFlags } = await import('./posthog')
    await expect(bootstrapPostHogFlags('user-1')).resolves.toBeNull()
  })

  it('inits PostHog with opt_out_capturing_by_default and bootstraps the distinct_id', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    const init = vi.fn()
    vi.doMock('posthog-js', () => ({
      default: {
        init,
        onFeatureFlags: () => () => {},
        reloadFeatureFlags: () => {},
        getFeatureFlag: () => undefined,
      },
    }))

    const { bootstrapPostHogFlags } = await import('./posthog')
    await bootstrapPostHogFlags('u_hashed_distinct_id_abc')

    expect(init).toHaveBeenCalledTimes(1)
    const [key, opts] = init.mock.calls[0]
    expect(key).toBe('phc_test')
    expect(opts.opt_out_capturing_by_default).toBe(true)
    expect(opts.autocapture).toBe(false)
    expect(opts.capture_pageview).toBe(false)
    expect(opts.bootstrap?.distinctID).toBe('u_hashed_distinct_id_abc')
  })
})

describe('activatePostHogCapture', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns null when bootstrap has not run', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_POSTHOG_KEY', '')
    const { activatePostHogCapture } = await import('./posthog')
    expect(activatePostHogCapture('user-1')).toBeNull()
  })

  it('opt-ins capture before identify', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    const calls: string[] = []
    const fakeClient = {
      init: vi.fn(),
      onFeatureFlags: () => () => {},
      reloadFeatureFlags: () => {},
      getFeatureFlag: () => undefined,
      opt_in_capturing: () => calls.push('opt_in'),
      identify: () => calls.push('identify'),
    }
    vi.doMock('posthog-js', () => ({ default: fakeClient }))

    const { bootstrapPostHogFlags, activatePostHogCapture } = await import('./posthog')
    await bootstrapPostHogFlags('u_abc')
    activatePostHogCapture('u_abc')

    expect(calls).toEqual(['opt_in', 'identify'])
  })
})

describe('deactivatePostHogCapture', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('opt-outs capture but does NOT call reset (preserves bootstrap distinct_id)', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    const reset = vi.fn()
    const optOut = vi.fn()
    const fakeClient = {
      init: vi.fn(),
      onFeatureFlags: () => () => {},
      reloadFeatureFlags: () => {},
      getFeatureFlag: () => undefined,
      opt_out_capturing: optOut,
      reset,
    }
    vi.doMock('posthog-js', () => ({ default: fakeClient }))

    const { bootstrapPostHogFlags, deactivatePostHogCapture } = await import('./posthog')
    await bootstrapPostHogFlags('u_abc')
    deactivatePostHogCapture()

    expect(optOut).toHaveBeenCalledTimes(1)
    expect(reset).not.toHaveBeenCalled()
  })
})

describe('resetPostHogClient', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('resets the client and forgets the singleton so the next bootstrap re-inits', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    const init = vi.fn()
    const fakeClient = {
      init,
      onFeatureFlags: () => () => {},
      reloadFeatureFlags: () => {},
      getFeatureFlag: () => undefined,
      opt_out_capturing: vi.fn(),
      reset: vi.fn(),
    }
    vi.doMock('posthog-js', () => ({ default: fakeClient }))

    const { bootstrapPostHogFlags, resetPostHogClient } = await import('./posthog')
    await bootstrapPostHogFlags('u_first')
    resetPostHogClient()
    await bootstrapPostHogFlags('u_second')

    expect(init).toHaveBeenCalledTimes(2)
    expect(init.mock.calls[1][1].bootstrap.distinctID).toBe('u_second')
    expect(fakeClient.reset).toHaveBeenCalled()
  })
})
