import { describe, expect, it } from 'vitest'
import { telemetryUserId } from './userIdentity'

describe('telemetryUserId', () => {
  it('hashes Supabase ids before they reach third-party telemetry', async () => {
    const raw = '11111111-2222-4333-8444-555555555555'
    const id = await telemetryUserId(raw)

    expect(id).toMatch(/^u_[a-f0-9]{64}$/)
    expect(id).not.toContain(raw)
  })

  it('is deterministic for the same Supabase id', async () => {
    await expect(telemetryUserId('user-1')).resolves.toBe(await telemetryUserId('user-1'))
  })
})
