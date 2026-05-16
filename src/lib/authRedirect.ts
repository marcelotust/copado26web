export const AUTH_CALLBACK_PENDING_KEY = 'meualbum2026_auth_callback_pending'
export const DEFAULT_POST_LOGIN_PATH = '/dashboard'

function sessionStorageOrNull(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function paramsFromHash(hash: string): URLSearchParams {
  return new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
}

export function isSupabaseAuthCallback(search: string, hash: string): boolean {
  const searchParams = new URLSearchParams(search)
  if (
    searchParams.has('code') ||
    searchParams.has('error') ||
    searchParams.has('error_code') ||
    searchParams.has('token_hash')
  ) {
    return true
  }

  const hashParams = paramsFromHash(hash)
  return (
    hashParams.has('access_token') ||
    hashParams.has('refresh_token') ||
    hashParams.has('error') ||
    hashParams.has('error_code')
  )
}

export function markAuthCallbackPending() {
  const storage = sessionStorageOrNull()
  storage?.setItem(AUTH_CALLBACK_PENDING_KEY, '1')
}

export function hasPendingAuthCallback(): boolean {
  return sessionStorageOrNull()?.getItem(AUTH_CALLBACK_PENDING_KEY) === '1'
}

export function clearAuthCallbackPending() {
  sessionStorageOrNull()?.removeItem(AUTH_CALLBACK_PENDING_KEY)
}

function isSafeAppPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !/^[a-z][a-z0-9+.-]*:/i.test(path)
}

export function consumePostLoginPath(key: string, fallback = DEFAULT_POST_LOGIN_PATH): string {
  const storage = sessionStorageOrNull()
  if (!storage) return fallback

  const raw = storage.getItem(key)
  if (raw) storage.removeItem(key)
  return raw && isSafeAppPath(raw) ? raw : fallback
}
