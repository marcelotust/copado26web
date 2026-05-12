// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/** @typedef {import('@supabase/supabase-js').Session} Session */

export function useAuth() {
  const [session, setSession] = useState(/** @type {Session|null} */ (null))
  const [loading, setLoading] = useState(true)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState(/** @type {string|null} */ (null))

  useEffect(() => {
    // getSession processes any magic link token present in the URL on redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  async function sendMagicLink(/** @type {string} */ email) {
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      }
    })
    if (error) setError(error.message)
    else setMagicLinkSent(true)
  }

  async function signInWithGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
    // session is cleared by onAuthStateChange (SIGNED_OUT event)
  }

  return { session, loading, magicLinkSent, error, sendMagicLink, signInWithGoogle, signOut }
}
