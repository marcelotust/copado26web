import { useCallback, useState } from 'react'

const storageKey = (userId: string) => `data_sharing_consent_v1_${userId}`

function readSeen(userId: string): boolean {
  try {
    return localStorage.getItem(storageKey(userId)) === 'seen'
  } catch {
    return false
  }
}

export function useDataSharingConsent(userId: string): {
  seen: boolean
  markSeen: () => void
} {
  const [seen, setSeen] = useState(() => readSeen(userId))

  const markSeen = useCallback(() => {
    try { localStorage.setItem(storageKey(userId), 'seen') } catch { /* quota */ }
    setSeen(true)
  }, [userId])

  return { seen, markSeen }
}
