import { milestoneStorageKey } from './milestoneStorage'

export function challengeCompletionStorageKey(userId: string): string {
  return `challenge_completions_v1_${userId}`
}

/** Clears client-side challenge + milestone caches (e.g. after album reset). */
export function clearUserProgressCaches(userId: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(challengeCompletionStorageKey(userId))
    localStorage.removeItem(milestoneStorageKey(userId))
  } catch { /* storage quota / private mode */ }
}
