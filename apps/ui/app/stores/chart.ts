import { create } from 'zustand'
import { CandleUI, Interval } from '../types'

interface ChartState {
  candles: Record<Interval, CandleUI[]>
  setCandles: (interval: Interval, history: CandleUI[]) => void
  addCandle: (interval: Interval, candle: CandleUI) => void
  clearStore: () => void
}

export const useChartStore = create<ChartState>((set) => ({
  candles: {
    '1m': [],
    '5m': [],
    '15m': [],
    '30m': [],
    '1h': [],
    '4h': [],
  },
  setCandles: (interval, history) =>
    set((state) => ({
      candles: {
        ...state.candles,
        [interval]: history,
      },
    })),

  addCandle: (interval, candle) =>
    set((state) => {
      const currentCandles = state.candles[interval] || []
      const lastIndex = currentCandles.length - 1

      if (lastIndex >= 0 && currentCandles[lastIndex].t === candle.t) {
        const updatedCandles = [...currentCandles]
        updatedCandles[lastIndex] = candle
        return {
          candles: { ...state.candles, [interval]: updatedCandles },
        }
      }

      const newCandles = [...currentCandles, candle].slice(-2000)
      return {
        candles: { ...state.candles, [interval]: newCandles },
      }
    }),

  clearStore: () =>
    set({
      candles: { '1m': [], '5m': [], '15m': [], '30m': [], '1h': [], '4h': [] },
    }),
}))
