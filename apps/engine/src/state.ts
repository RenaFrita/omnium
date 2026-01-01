import { RollingZ } from './stats'

export const state = {
  bids: new Map<number, number>(),
  asks: new Map<number, number>(),

  trades: [] as {
    price: number
    size: number
    side: string
    ts: number
  }[],

  prices: [] as number[],
  cvd: 0,

  vwap: {
    sumPV: 0,
    sumV: 0,
    value: 0,
    variance: 0,
  },

  z: {
    vwap: new RollingZ(0.03),
    delta: new RollingZ(0.05),
  },

  auction: {
    phase: 'idle' as 'idle' | 'sweep' | 'absorption' | 'reclaim',
    side: null as 'buy' | 'sell' | null,
    startPrice: 0,
    lastTs: 0,
  },

  liquidityContext: {
    activeZonePrice: 0,
    enteredTs: 0,
  },

  lastSignalTs: 0,

  window: {
    startTs: 0,
  },
}
