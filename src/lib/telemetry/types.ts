/** Scalar values safe to send as analytics / error context. */
export type TelemetryValue = string | number | boolean | null | undefined

export type TelemetryProperties = Record<string, TelemetryValue>
export type TelemetryFeatureFlagsListener = () => void

/** Mirrors analytics consent in the app — providers must not run until `granted`. */
export type TelemetryConsentState = 'granted' | 'declined' | null

/**
 * Per-event options. `timestamp` lets the queue replay backdated events so
 * PostHog's experiment funnels see them in their original temporal order.
 */
export type TelemetryTrackOptions = { timestamp?: Date }

export type TelemetryAnalyticsPort = {
  track: (event: string, props?: TelemetryProperties, options?: TelemetryTrackOptions) => void
  flag: (key: string) => boolean
  variant: (key: string) => string | null
  onFeatureFlags: (listener: TelemetryFeatureFlagsListener) => () => void
  setUser: (userId: string, traits?: TelemetryProperties) => void
  reset: () => void
}

export type TelemetryErrorPort = {
  capture: (err: Error, context?: TelemetryProperties) => void
  setUser: (userId: string) => void
  reset: () => void
}
