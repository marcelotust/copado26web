// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'

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
          (_event, session) => {
            if (active) setSession(session)
          },
        )
        unsubscribe = () => subscription.unsubscribe()
      })
      .catch((err: unknown) => {
        console.error('[auth] failed to load Supabase client', err)
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
    if (error) setError(error.message)
    else setMagicLinkSent(true)
  }

  async function signInWithGoogle() {
    setError(null)
    const { supabase } = await import('../lib/supabase')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  async function signOut() {
    const { supabase } = await import('../lib/supabase')
    await supabase.auth.signOut()
  }

  return { session, loading, magicLinkSent, error, sendMagicLink, signInWithGoogle, signOut }
}
