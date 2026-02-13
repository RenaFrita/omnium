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
} from '../helpers'

const MAX_CANDLES = 600

export interface ChartData extends Candle {
  ema20?: number
  ema50?: number
  ema100?: number
  ema200?: number
  volumeSpike: boolean
  bias?: 'bullish' | 'bearish' | null
  bos?: 'bullish' | 'bearish' | null
  choch?: 'bullish' | 'bearish' | null
  swing?: 'HH' | 'LL' | 'HL' | 'LH' | null
  swingType?: 'High' | 'Low' | null
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

      // 1. Gerenciamento de candles (Update ou Push)
      if (old.length > 0 && old[old.length - 1].t === candle.t) {
        candles = [...old]
        candles[candles.length - 1] = { ...old[old.length - 1], ...candle }
      } else {
        candles = [...old, { ...candle, volumeSpike: false }]
      }

      const lastIdx = candles.length - 1
      const last = candles[lastIdx]
      const prev = candles[lastIdx - 1] ?? last

      // 2. Indicadores Básicos (EMA, RSI, Volume)
      const ema20 = calculateEMA(prev.ema20 ?? prev.c, last.c, 20)
      const ema50 = calculateEMA(prev.ema50 ?? prev.c, last.c, 50)
      const ema100 = calculateEMA(prev.ema20 ?? prev.c, last.c, 100)
      const ema200 = calculateEMA(prev.ema20 ?? prev.c, last.c, 200)
      
      const rsiData = calculateRSI(prev, last)
      const volumeSpike = calculateVolumeSpike(candles, last.v, 20, 1.5)

      // 3. Lógica de Swing (Fractal confirmado no index-2)
      const fractalIdx = lastIdx - 2
      if (fractalIdx >= 2) {
        const swingType = detectSwingType(candles, fractalIdx)
        const targetCandle = candles[fractalIdx]
        const prevBias = candles[fractalIdx - 1]?.bias ?? null

        if (swingType) {
          const { lastHigh, lastLow } = getLastPivotPoints(candles, fractalIdx)
          targetCandle.swingType = swingType
          
          if (swingType === 'High') {
            targetCandle.swing = targetCandle.h > lastHigh ? 'HH' : 'LH'
          } else {
            targetCandle.swing = targetCandle.l < lastLow ? 'LL' : 'HL'
          }
          // Atualiza o bias com base no novo swing detectado
          targetCandle.bias = detectBias(prevBias, targetCandle.swing)
        } else {
          // Sem swing novo, mantém o bias anterior
          targetCandle.bias = detectBias(prevBias, null)
        }
      }

      // 4. Propagação e Estrutura (No candle Atual)
      // O bias do candle atual é herdado do candle anterior (que já foi processado pela lógica de fractal)
      const currentBias = candles[lastIdx - 1]?.bias ?? null
      const structure = detectStructureChange(candles, currentBias);

      const newLastCandle: ChartData = {
        ...last,
        ema20,
        ema50,
        ema100,
        ema200,
        volumeSpike,
        bias: currentBias,
        rsi: rsiData.rsi,
        _avgGain: rsiData._avgGain,
        _avgLoss: rsiData._avgLoss,
        bos: structure.bos,
        choch: structure.choch,
      };

      candles[lastIdx] = newLastCandle;

      return {
        ...state,
        [interval]: candles.slice(-MAX_CANDLES),
      }
    })
  },
}))

