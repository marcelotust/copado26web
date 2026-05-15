import type { TelemetryProperties } from '../../lib/telemetry'

const COMPLETED_KEY_PREFIX = 'onboarding_completed_v1_'
const STARTED_KEY_PREFIX = 'onboarding_started_at_v1_'
const ACTIVE_USER_KEY = 'onboarding_active_user_v1'

function completedKey(userId: string): string {
  return `${COMPLETED_KEY_PREFIX}${userId}`
}

function startedKey(userId: string): string {
  return `${STARTED_KEY_PREFIX}${userId}`
}

function readLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode / quota */
  }
}

function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* private mode */
  }
}

export function hasCompletedOnboarding(userId: string): boolean {
  return readLocalStorage(completedKey(userId)) === '1'
}

export function completeOnboardingStorage(userId: string): void {
  writeLocalStorage(completedKey(userId), '1')
  clearActiveOnboarding(userId)
}

export function markActiveOnboarding(userId: string): void {
  const startedAt = readLocalStorage(startedKey(userId)) ?? String(Date.now())
  writeLocalStorage(startedKey(userId), startedAt)
  writeLocalStorage(ACTIVE_USER_KEY, userId)
}

export function clearActiveOnboarding(userId: string): void {
  if (readLocalStorage(ACTIVE_USER_KEY) === userId) {
    removeLocalStorage(ACTIVE_USER_KEY)
  }
}

export function readOnboardingStickerContext(): TelemetryProperties {
  const userId = readLocalStorage(ACTIVE_USER_KEY)
  if (!userId) return { onboarding_active: false }

  const startedAt = Number(readLocalStorage(startedKey(userId)))
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return { onboarding_active: true }
  }

  const elapsedSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
  return {
    onboarding_active: true,
    onboarding_elapsed_seconds: elapsedSeconds,
    onboarding_within_2min: elapsedSeconds <= 120,
  }
}
