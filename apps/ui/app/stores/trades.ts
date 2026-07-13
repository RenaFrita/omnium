import { create } from 'zustand'
import type { AggressiveTrade } from '../types'

const MAX_TRADES = 200

interface TradesState {
  trades: AggressiveTrade[]
  addTrades: (trades: AggressiveTrade[]) => void
}

export const useTradesStore = create<TradesState>((set) => ({
  trades: [],
  addTrades: (incoming) =>
    set((state) => {
      if (!incoming.length) return state
      const merged = state.trades.length + incoming.length
      if (merged > MAX_TRADES) {
        const overflow = merged - MAX_TRADES
        return { trades: [...state.trades.slice(overflow), ...incoming] }
      }
      return { trades: [...state.trades, ...incoming] }
    }),
}))
