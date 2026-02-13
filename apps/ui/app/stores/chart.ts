import { create } from 'zustand'
import { Candle, Interval } from '../types'
import {
  calculateEMA,
  calculateRSI,
  calculateVolumeSpike,
  detectBias,
  detectBOS,
  detectCHoCH,
  detectSwing,
  getSignal,
  Signal,
} from '../helpers'

const MAX_CANDLES = 600

export interface ChartData extends Candle {
  ema20?: number
  ema50?: number
  ema100?: number
  ema200?: number
  volumeSpike: boolean
  swing?: 'HH' | 'HL' | 'LH' | 'LL'
  bias?: 'bullish' | 'bearish' | null
  bos?: 'bullish' | 'bearish' | null
  choch?: 'bullish' | 'bearish' | null
  signal: Signal
  rsi?: number
  _avgGain?: number
  _avgLoss?: number
}

interface ChartStore {
  '1m': ChartData[]
  '5m': ChartData[]
  '15m': ChartData[]
  '30m': ChartData[]
  '1h': ChartData[]
  '4h': ChartData[]
  addCandle: (interval: Interval, candle: Candle) => void
}

export const useChartStore = create<ChartStore>((set) => ({
  '1m': [],
  '5m': [],
  '15m': [],
  '30m': [],
  '1h': [],
  '4h': [],

  addCandle: (interval, candle) => {
    set((state) => {
      const old = state[interval]
      let candles: ChartData[]
      let last = old[old.length - 1]

      if (last && last.t === candle.t) {
        candles = [...old]
        candles[candles.length - 1] = {
          ...candle,
          volumeSpike: false,
          signal: 'none',
        }
      } else {
        candles = [...old, { ...candle, volumeSpike: false, signal: 'none' }]
      }

      last = candles[candles.length - 1]
      const prev = candles[candles.length - 2] ?? last

      candles[candles.length - 1] = {
        ...last,
        ema20: calculateEMA(prev.ema20 ?? prev.c, last.c, 20),
        ema50: calculateEMA(prev.ema50 ?? prev.c, last.c, 50),
        ema100: calculateEMA(prev.ema100 ?? prev.c, last.c, 100),
        ema200: calculateEMA(prev.ema200 ?? prev.c, last.c, 200),
        volumeSpike: calculateVolumeSpike(candles, last.v, 20, 1.5),
        swing: detectSwing(prev, last),
        bias: detectBias(prev, last),
        bos: detectBOS(prev, last),
        choch: detectCHoCH(prev, last),
        signal: getSignal(last),
        ...calculateRSI(prev, last),
      }

      return {
        ...state,
        [interval]: candles.slice(candles.length - MAX_CANDLES),
      }
    })
  },
}))
