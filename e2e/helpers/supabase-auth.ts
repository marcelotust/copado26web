import { createClient, type Session } from '@supabase/supabase-js'

export function e2eAuthConfigured(): boolean {
  const url = process.env.VITE_SUPABASE_URL ?? ''
  return Boolean(
    process.env.E2E_TEST_EMAIL &&
    process.env.E2E_TEST_PASSWORD &&
    process.env.VITE_SUPABASE_ANON_KEY &&
    url.length > 0 &&
    !url.includes('placeholder'),
  )
}

export function supabaseAuthStorageKey(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split('.')[0]
  return `sb-${ref}-auth-token`
}

/** Sign in test user (optionally create via service role). */
export async function signInTestUser(): Promise<Session> {
  const url = process.env.VITE_SUPABASE_URL!
  const anon = process.env.VITE_SUPABASE_ANON_KEY!
  const email = process.env.E2E_TEST_EMAIL!
  const password = process.env.E2E_TEST_PASSWORD!

  const serviceRole = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY
  if (serviceRole) {
    const admin = createClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error && !/already|registered|exists/i.test(error.message)) {
      throw error
    }
  }

  const client = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.session) throw new Error('signInWithPassword returned no session')
  return data.session
}
