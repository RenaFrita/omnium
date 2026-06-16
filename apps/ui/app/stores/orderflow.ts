import { create } from 'zustand'
import type { OrderFlowSnapshot } from '../types'

interface OrderFlowState extends OrderFlowSnapshot {
  setSnapshot: (snap: OrderFlowSnapshot) => void
}

const INIT: OrderFlowSnapshot = {
  cvd: 0,
  cvdData: [],
  buyVol60: 0,
  sellVol60: 0,
  tradeRatio: 0.5,
  largePrints: [],
  aggrBuys: 0,
  aggrSells: 0,
  aggrTotal: 0,
  aggrRatio: 0.5,
  vwap: null,
  bookImb: 0,
  bidDepth: 0,
  askDepth: 0,
  pressureData: [],
  pendingDir: null,
  lastAlert: 0,
  cvdThreshold: 0,
  largePrintThreshold: 0,
}

export const useOrderFlowStore = create<OrderFlowState>((set) => ({
  ...INIT,
  setSnapshot: (snap) => set(snap),
}))
