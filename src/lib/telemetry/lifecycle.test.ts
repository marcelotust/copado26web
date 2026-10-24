import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mocks must be hoisted via vi.mock() so the SUT picks them up on import.
const mocks = vi.hoisted(() => ({
  bootstrap: vi.fn(),
  activateCapture: vi.fn(),
  deactivateCapture: vi.fn(),
  resetClient: vi.fn(),
  activateSentry: vi.fn(),
  deactivateSentry: vi.fn(),
}))

vi.mock('./posthog', () => ({
  bootstrapPostHogFlags: mocks.bootstrap,
  activatePostHogCapture: mocks.activateCapture,
  deactivatePostHogCapture: mocks.deactivateCapture,
  resetPostHogClient: mocks.resetClient,
}))

vi.mock('./sentry', () => ({
  activateSentryErrors: mocks.activateSentry,
  deactivateSentryUser: mocks.deactivateSentry,
}))

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

describe('telemetry lifecycle (flags vs capture)', () => {
  beforeEach(async () => {
    vi.resetModules()
    Object.values(mocks).forEach((fn) => fn.mockReset())
    mocks.deactivateCapture.mockImplementation(() => {})
    mocks.deactivateSentry.mockResolvedValue(undefined)
    mocks.activateSentry.mockResolvedValue(null)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('mounts flags independent of consent (null) and `flag()` resolves via PostHog', async () => {
    const flagPort = {
      flag: vi.fn().mockReturnValue(true),
      variant: vi.fn().mockReturnValue(null),
      onFeatureFlags: vi.fn().mockReturnValue(() => {}),
    }
    mocks.bootstrap.mockResolvedValue(flagPort)

    const { mountTelemetryFlags, telemetry } = await import('./index')
    await mountTelemetryFlags('user-abc')

    expect(mocks.bootstrap).toHaveBeenCalledTimes(1)
    expect(telemetry.flag('any_key')).toBe(true)
    expect(flagPort.flag).toHaveBeenCalledWith('any_key')
  })

  it('with consent=declined, capture is noop but flags still resolve via PostHog', async () => {
    const flagPort = {
      flag: vi.fn().mockReturnValue(true),
      variant: vi.fn().mockReturnValue(null),
      onFeatureFlags: vi.fn().mockReturnValue(() => {}),
    }
    mocks.bootstrap.mockResolvedValue(flagPort)

    const { mountTelemetryFlags, syncTelemetryConsent, telemetry } = await import('./index')
    await mountTelemetryFlags('user-abc')
    syncTelemetryConsent({ userId: 'user-abc', consent: 'declined' })
    await flush()

    expect(mocks.activateCapture).not.toHaveBeenCalled()
    expect(mocks.deactivateCapture).toHaveBeenCalled()
    expect(telemetry.flag('friends_v1')).toBe(true)
    // track is a noop — should not throw and not call any backend
    telemetry.track('should_not_send')
  })

  it('on grant, activates capture and identifies via PostHog', async () => {
    const flagPort = {
      flag: vi.fn().mockReturnValue(false),
      variant: vi.fn().mockReturnValue(null),
      onFeatureFlags: vi.fn().mockReturnValue(() => {}),
    }
    const capturePort = {
      track: vi.fn(),
      setUser: vi.fn(),
      reset: vi.fn(),
    }
    mocks.bootstrap.mockResolvedValue(flagPort)
    mocks.activateCapture.mockReturnValue(capturePort)

    const { mountTelemetryFlags, syncTelemetryConsent, telemetry } = await import('./index')
    await mountTelemetryFlags('user-abc')
    syncTelemetryConsent({ userId: 'user-abc', consent: 'granted' })
    await flush()
    await flush()

    expect(mocks.activateCapture).toHaveBeenCalledTimes(1)
    telemetry.track('foo')
    expect(capturePort.track).toHaveBeenCalledWith('foo', undefined)
  })

  it('reset() goes back to noop flags and queueing capture', async () => {
    const flagPort = {
      flag: vi.fn().mockReturnValue(true),
      variant: vi.fn().mockReturnValue(null),
      onFeatureFlags: vi.fn().mockReturnValue(() => {}),
    }
    mocks.bootstrap.mockResolvedValue(flagPort)

    const { mountTelemetryFlags, telemetry } = await import('./index')
    await mountTelemetryFlags('user-abc')
    expect(telemetry.flag('friends_v1')).toBe(true)

    telemetry.reset()
    expect(telemetry.flag('friends_v1')).toBe(false)
    expect(mocks.resetClient).toHaveBeenCalled()
  })
})
