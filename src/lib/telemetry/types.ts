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

/**
 * Read-only flag evaluation. Loaded as soon as we have a `userId`, independent
 * of analytics consent — so a user who declined (or hasn't decided yet) still
 * gets feature gating without their behaviour being captured.
 */
export type TelemetryFlagsPort = {
  flag: (key: string) => boolean
  variant: (key: string) => string | null
  onFeatureFlags: (listener: TelemetryFeatureFlagsListener) => () => void
}

/**
 * Event capture + identify. Gated by consent — never activated until the user
 * accepts the analytics banner.
 */
export type TelemetryCapturePort = {
  track: (event: string, props?: TelemetryProperties, options?: TelemetryTrackOptions) => void
  setUser: (userId: string, traits?: TelemetryProperties) => void
  reset: () => void
}

export type TelemetryAnalyticsPort = TelemetryFlagsPort & TelemetryCapturePort

export type TelemetryErrorPort = {
  capture: (err: Error, context?: TelemetryProperties) => void
  setUser: (userId: string) => void
  reset: () => void
}
