import type { TelemetryAnalyticsPort, TelemetryErrorPort } from './types'

export const noopAnalytics: TelemetryAnalyticsPort = {
  track() { /* noop */ },
  flag: () => false,
  variant: () => null,
  onFeatureFlags: () => () => {},
  setUser() { /* noop */ },
  reset() { /* noop */ },
}

export const noopErrors: TelemetryErrorPort = {
  capture() { /* noop */ },
  setUser() { /* noop */ },
  reset() { /* noop */ },
}
