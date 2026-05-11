// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SEED_DATA } from '../db/seed'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setLoading(false)
        if (session?.user) {
          await seedAlbumIfEmpty(session.user.id)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function sendMagicLink(email) {
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    })
    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
  }

  return { session, loading, magicLinkSent, error, sendMagicLink, signOut }
}

async function seedAlbumIfEmpty(userId) {
  const { count } = await supabase
    .from('stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count > 0) return

  const rows = buildSeedRows(userId)
  for (let i = 0; i < rows.length; i += 200) {
    await supabase.from('stickers').upsert(rows.slice(i, i + 200))
  }
}

function buildSeedRows(userId) {
  const rows = []

  for (const section of SEED_DATA) {
    const start  = section.startNumber ?? 1
    const end    = start + section.count - 1
    const isTeam = section.type === 'team'

    for (let n = start; n <= end; n++) {
      let label = null
      if (isTeam) {
        if (n === 1)       label = 'Shield'
        else if (n === 13) label = 'Team Photo'
        else               label = section.players?.[n] ?? null
      }

      rows.push({
        id:         `${section.code}-${String(n).padStart(2, '0')}`,
        user_id:    userId,
        team_code:  section.code,
        number:     n,
        quantity:   0,
        is_special: isTeam && n === 1,
        label,
      })
    }
  }

  return rows
}
