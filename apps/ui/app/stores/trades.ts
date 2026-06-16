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
        const slice = state.trades.slice(incoming.length)
        return { trades: [...slice, ...incoming] }
      }
      return { trades: [...state.trades, ...incoming] }
    }),
}))
