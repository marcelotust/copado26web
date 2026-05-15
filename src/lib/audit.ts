import { supabase } from './supabase'

export type AuditAction =
  | 'album_reset'
  | 'album_import_replace'
  | 'account_deleted'

async function callRpc(fn: string, args?: Record<string, unknown>): Promise<{ error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)(fn, args)
  return { error: error as Error | null }
}

/** Log a sanitized audit event (server-side RPC). */
export async function logAuditEvent(
  action: string,
  metadata: Record<string, string | number | boolean> = {},
): Promise<void> {
  const { error } = await callRpc('log_audit_event', { p_action: action, p_metadata: metadata })
  if (error) throw error
}

/** Reset album via audited RPC. */
export async function resetMyAlbumRpc(): Promise<void> {
  const { error } = await callRpc('reset_my_album')
  if (error) throw error
}