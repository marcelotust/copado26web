import type {
  TelemetryAnalyticsPort,
  TelemetryErrorPort,
  TelemetryFlagsPort,
} from './types'

export const noopFlags: TelemetryFlagsPort = {
  flag: () => false,
  variant: () => null,
  onFeatureFlags: () => () => {},
}

export const noopAnalytics: TelemetryAnalyticsPort = {
  ...noopFlags,
  track() { /* noop */ },
  setUser() { /* noop */ },
  reset() { /* noop */ },
}

export const noopErrors: TelemetryErrorPort = {
  capture() { /* noop */ },
  setUser() { /* noop */ },
  reset() { /* noop */ },
}
