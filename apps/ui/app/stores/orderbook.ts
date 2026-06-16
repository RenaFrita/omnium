import { create } from 'zustand'

interface Level {
  price: number
  size: number
}

interface OrderBookState {
  bids: Level[]
  asks: Level[]
  applyUpdate: (bids: Level[], asks: Level[]) => void
  clear: () => void
}

function mergeLevels(existing: Level[], incoming: Level[], sortAsc: boolean): Level[] {
  if (!incoming.length && existing.length <= 50) return existing

  const map = new Map<number, number>()
  for (const l of existing) map.set(l.price, l.size)
  for (const l of incoming) {
    if (l.size === 0) map.delete(l.price)
    else map.set(l.price, l.size)
  }

  return Array.from(map.entries())
    .map(([price, size]) => ({ price, size }))
    .sort((a, b) => sortAsc ? a.price - b.price : b.price - a.price)
    .slice(0, 50)
}

export const useOrderBookStore = create<OrderBookState>((set) => ({
  bids: [],
  asks: [],
  applyUpdate: (incomingBids, incomingAsks) =>
    set((state) => ({
      bids: mergeLevels(state.bids, incomingBids, false),
      asks: mergeLevels(state.asks, incomingAsks, true),
    })),
  clear: () => set({ bids: [], asks: [] }),
}))
