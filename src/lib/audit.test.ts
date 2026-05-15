import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('./supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from './supabase'
import { logAuditEvent, resetMyAlbumRpc } from './audit'

describe('audit', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)
  })

  it('calls log_audit_event RPC', async () => {
    await logAuditEvent('album_import_replace', { sticker_rows: 3 })
    expect(supabase.rpc).toHaveBeenCalledWith('log_audit_event', {
      p_action: 'album_import_replace',
      p_metadata: { sticker_rows: 3 },
    })
  })

  it('calls reset_my_album RPC', async () => {
    await resetMyAlbumRpc()
    expect(supabase.rpc).toHaveBeenCalledWith('reset_my_album')
  })
})
