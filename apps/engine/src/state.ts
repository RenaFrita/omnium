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
}
