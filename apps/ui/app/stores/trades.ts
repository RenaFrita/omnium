import { create } from 'zustand'
import type { AggressiveTrade } from '../types'

const MAX_TRADES = 500

interface TradesState {
  trades: AggressiveTrade[]
  addTrades: (trades: AggressiveTrade[]) => void
}

export const useTradesStore = create<TradesState>((set) => ({
  trades: [],
  addTrades: (incoming) =>
    set((state) => {
      const merged = [...state.trades, ...incoming]
      if (merged.length > MAX_TRADES) {
        return { trades: merged.slice(-MAX_TRADES) }
      }
      return { trades: merged }
    }),
}))
