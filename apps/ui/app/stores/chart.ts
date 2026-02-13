import { create } from 'zustand'
import { Candle, Interval } from '../types'
import {
  calculateEMA,
  calculateRSI,
  calculateVolumeSpike,
  detectBias,
  detectStructureChange,
  detectSwingType,
  getLastPivotPoints,
  detectFVG,
} from '../helpers'

const MAX_CANDLES = 600
const VOLUME_SETTINGS = {
  '1m': { period: 20, multiplier: 1.5 },
  '5m': { period: 20, multiplier: 1.5 },
  '15m': { period: 20, multiplier: 1.7 },
  '30m': { period: 20, multiplier: 1.8 },
  '1h': { period: 20, multiplier: 2.0 },
  '4h': { period: 20, multiplier: 2.5 },
}

export interface ChartData extends Candle {
  ema20?: number; ema50?: number; ema100?: number; ema200?: number
  volumeSpike: boolean
  bias?: 'bullish' | 'bearish' | null
  bos?: 'bullish' | 'bearish' | null
  choch?: 'bullish' | 'bearish' | null
  fvg?: 'bullish' | 'bearish' | null
  swing?: 'HH' | 'LL' | 'HL' | 'LH' | null
  swingType?: 'High' | 'Low' | null
  rsi?: number; _avgGain?: number; _avgLoss?: number
}

interface ChartStore {
  '1m': ChartData[]; '5m': ChartData[]; '15m': ChartData[]; 
  '30m': ChartData[]; '1h': ChartData[]; '4h': ChartData[]
  addCandle: (interval: Interval, candle: Candle) => void
}

export const useChartStore = create<ChartStore>((set) => ({
  '1m': [], '5m': [], '15m': [], '30m': [], '1h': [], '4h': [],

  addCandle: (interval, candle) => {
    set((state) => {
      const old = state[interval]
      const candles = [...old]

      // 1. Update ou Push
      if (candles.length > 0 && candles[candles.length - 1].t === candle.t) {
        candles[candles.length - 1] = { ...candles[candles.length - 1], ...candle }
      } else {
        candles.push({ ...candle, volumeSpike: false })
      }

      const lastIdx = candles.length - 1
      const last = candles[lastIdx]
      const prev = candles[lastIdx - 1] ?? last

      // 2. Swings/Fractais (Confirmação no index-2)
      const fractalIdx = lastIdx - 2
      if (fractalIdx >= 2) {
        const swingType = detectSwingType(candles, fractalIdx)
        const prevBias = candles[fractalIdx - 1]?.bias ?? null
        
        // Mutação imutável do candle de fractal
        const updatedTarget = { ...candles[fractalIdx], swingType }

        if (swingType) {
          const { lastHigh, lastLow } = getLastPivotPoints(candles, fractalIdx)
          if (swingType === 'High') {
            updatedTarget.swing = updatedTarget.h > lastHigh ? 'HH' : 'LH'
          } else {
            updatedTarget.swing = updatedTarget.l < lastLow ? 'LL' : 'HL'
          }
          updatedTarget.bias = detectBias(prevBias, updatedTarget.swing)
        } else {
          updatedTarget.bias = detectBias(prevBias, null)
        }
        candles[fractalIdx] = updatedTarget
      }

      // 3. Indicadores e Estrutura no candle atual
      const currentBias = candles[lastIdx - 1]?.bias ?? null
      const structure = detectStructureChange(candles, currentBias)
      const fvg = detectFVG(candles)
      const rsiData = calculateRSI(prev, last)
      const { period, multiplier } = VOLUME_SETTINGS[interval]

      candles[lastIdx] = {
        ...candles[lastIdx],
        ema20: calculateEMA(prev.ema20 ?? prev.c, last.c, 20),
        ema50: calculateEMA(prev.ema50 ?? prev.c, last.c, 50),
        ema100: calculateEMA(prev.ema100 ?? prev.c, last.c, 100),
        ema200: calculateEMA(prev.ema200 ?? prev.c, last.c, 200),
        volumeSpike: calculateVolumeSpike(candles, last.v, period, multiplier),
        bias: currentBias,
        fvg,
        bos: structure.bos,
        choch: structure.choch,
        ...rsiData
      }

      return { ...state, [interval]: candles.slice(-MAX_CANDLES) }
    })
  },
}))
