// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { reportError } from '../lib/logger'
import { AnalyticsEvent, telemetry } from '../lib/telemetry'
import { detectLocale } from '../i18n/localeData'

export function useAuth() {
  const [session, setSession]     = useState<Session | null>(null)
  const [loading, setLoading]     = useState(true)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError]         = useState<string | null>(null)

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
              const provider = session.user.app_metadata?.provider ?? 'email'
              const createdAt = session.user.created_at ? Date.parse(session.user.created_at) : 0
              telemetry.track(AnalyticsEvent.AUTH_SIGNED_IN, {
                provider: typeof provider === 'string' ? provider : 'email',
                is_new_user: createdAt > 0 && Date.now() - createdAt < 120_000,
              })
            }
          },
        )
        unsubscribe = () => subscription.unsubscribe()
      })
      .catch((err: unknown) => {
        reportError('failed to load Supabase client', err, { feature: 'auth', action: 'init_client' })
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load auth')
          setLoading(false)
        }
      })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  async function sendMagicLink(email: string) {
    setError(null)
    const { supabase } = await import('../lib/supabase')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      setError(error.message)
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
    setError(null)
    const { supabase } = await import('../lib/supabase')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      reportError('google oauth failed', error, { feature: 'auth', action: 'google_oauth', error_code: error.code ?? 'unknown' })
    }
  }

  async function signOut() {
    const { supabase } = await import('../lib/supabase')
    await supabase.auth.signOut()
  }

  return { session, loading, magicLinkSent, error, sendMagicLink, signInWithGoogle, signOut }
}
