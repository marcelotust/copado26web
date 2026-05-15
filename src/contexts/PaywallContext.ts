import { createContext, useContext } from 'react'

export type PaywallReason = 'sticker_toggle' | 'tab_click'

export const PaywallContext = createContext<((reason: PaywallReason) => void) | null>(null)

export const usePaywallTrigger = () => useContext(PaywallContext)
