// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authErrorMessageKey } from '../lib/authErrors'
import { reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { detectLocale } from '../i18n/localeData'

export function useAuth() {
  const [session, setSession]     = useState<Session | null>(null)
  const [loading, setLoading]     = useState(true)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  /** i18n key under `errors.*` — never raw API messages in UI */
  const [errorKey, setErrorKey]   = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    // getSession processes any magic link token present in the URL on redirect
    import('../lib/supabase')
      .then(({ supabase }) => {
        if (!active) return

        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!active) return
          setSession(session)
          setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!active) return
            setSession(session)
            if (event === 'SIGNED_IN' && session) {
              const provider = typeof session.user.app_metadata?.provider === 'string'
                ? session.user.app_metadata.provider
                : 'email'
              const createdAt = session.user.created_at ? Date.parse(session.user.created_at) : 0
              const isNewUser = createdAt > 0 && Date.now() - createdAt < 120_000
              telemetry.setUser(session.user.id, {
                provider,
                is_new_user: isNewUser,
                locale: detectLocale(),
              })
              telemetry.track(AnalyticsEvent.AUTH_SIGNED_IN, {
                provider,
                is_new_user: isNewUser,
              })
            }
          },
        )
        unsubscribe = () => subscription.unsubscribe()
      })
      .catch((err: unknown) => {
        reportError('failed to load Supabase client', err, { feature: 'auth', action: 'init_client' })
        if (active) {
          setErrorKey('errors.authInitFailed')
          setLoading(false)
        }
      })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  async function sendMagicLink(email: string) {
    setErrorKey(null)
    const { supabase } = await import('../lib/supabase')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      setErrorKey(authErrorMessageKey(error))
      reportError('magic link failed', error, { feature: 'auth', action: 'magic_link', error_code: error.code ?? 'unknown' })
      telemetry.track(AnalyticsEvent.AUTH_MAGIC_LINK_FAILED, {
        error_code: error.code ?? 'unknown',
        locale: detectLocale(),
      })
    } else {
      setMagicLinkSent(true)
    }
  }

  async function signInWithGoogle() {
    setErrorKey(null)
    const { supabase } = await import('../lib/supabase')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setErrorKey(authErrorMessageKey(error))
      reportError('google oauth failed', error, { feature: 'auth', action: 'google_oauth', error_code: error.code ?? 'unknown' })
    }
  }

  async function signOut() {
    const { supabase } = await import('../lib/supabase')
    await supabase.auth.signOut()
  }

  return { session, loading, magicLinkSent, errorKey, sendMagicLink, signInWithGoogle, signOut }
}
