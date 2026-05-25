// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// Typed wrapper around the adjust_sticker RPC. supabase-js's rpc<> generic
// infers args at the call site, which has been flaky across versions; pinning
// the call here keeps the cast in one well-named place.
export async function adjustStickerRpc(
  p_sticker_id: string,
  p_delta: number,
): Promise<{ data: number | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase.rpc as any)('adjust_sticker', { p_sticker_id, p_delta })
  return { data: result.data as number | null, error: result.error as Error | null }
}

export type TradeResultRow = { sticker_id: string; quantity: number }

// Typed wrapper around the apply_trade RPC (atomic batch +1/-1 reconciliation).
// Returns the resulting quantities so the caller can reconcile optimistic state.
export async function applyTradeRpc(
  p_received: string[],
  p_given: string[],
): Promise<{ data: TradeResultRow[] | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase.rpc as any)('apply_trade', { p_received, p_given })
  // RPC returns rows with out_sticker_id / out_quantity columns.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (result.data as any[] | null)?.map((row) => ({
    sticker_id: row.out_sticker_id as string,
    quantity: row.out_quantity as number,
  })) ?? null
  return { data: rows, error: result.error as Error | null }
}
