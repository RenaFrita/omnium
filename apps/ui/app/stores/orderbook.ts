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

export const useOrderBookStore = create<OrderBookState>((set) => ({
  bids: [],
  asks: [],
  applyUpdate: (incomingBids, incomingAsks) =>
    set(() => ({
      bids: incomingBids,
      asks: incomingAsks,
    })),
  clear: () => set({ bids: [], asks: [] }),
}))
