import { Candle } from './hooks/useHyperliquid'
import { ChartData } from './stores/chart'

export function calculateEMA(
  last: number | null,
  price: number,
  period: number
): number {
  const k = 2 / (period + 1)

  if (last === null) {
    return price
  }

  return price * k + last * (1 - k)
}

export function calculateVolumeSpike(
  candles: Candle[],
  volume: number,
  period = 20,
  multiplier = 1.5
): boolean {
  if (candles.length === 0) return false

  const recent = candles.slice(-period)
  const avgVolume = recent.reduce((sum, c) => sum + c.v, 0) / recent.length

  return volume > avgVolume * multiplier
}
export function detectSwing(prev: ChartData, last: ChartData) {
  const prevSwing = prev.swing

  if (last.h > prev.h && last.l > prev.l) return 'HH'
  if (last.h < prev.h && last.l < prev.l) return 'LL'
  if (last.h > prev.h && last.l < prev.l) return 'HL'
  if (last.h < prev.h && last.l > prev.l) return 'LH'

  return prevSwing
}

export function calculateRSI(prev: ChartData, last: ChartData, period = 14) {
  const gain = Math.max(last.c - prev.c, 0)
  const loss = Math.max(prev.c - last.c, 0)

  const prevAvgGain = prev._avgGain ?? gain
  const prevAvgLoss = prev._avgLoss ?? loss

  const avgGain = (prevAvgGain * (period - 1) + gain) / period
  const avgLoss = (prevAvgLoss * (period - 1) + loss) / period

  const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  return { rsi, _avgGain: avgGain, _avgLoss: avgLoss }
}

export function detectBias(
  prev: ChartData,
  last: ChartData
): 'bullish' | 'bearish' | null {
  if (!last.swing) return prev.bias ?? null
  if (prev.bias) {
    if (
      (prev.bias === 'bullish' && last.swing === 'HL') ||
      last.swing === 'HH'
    ) {
      return 'bullish'
    } else if (
      (prev.bias === 'bearish' && last.swing === 'LH') ||
      last.swing === 'LL'
    ) {
      return 'bearish'
    } else {
      return prev.bias
    }
  } else {
    if (last.swing === 'HH' || last.swing === 'HL') return 'bullish'
    if (last.swing === 'LL' || last.swing === 'LH') return 'bearish'
    return null
  }
}

export function detectCHoCH(prev: ChartData, last: ChartData) {
  if (prev.bias === 'bullish' && last.c < prev.l) return 'bearish'
  if (prev.bias === 'bearish' && last.c > prev.h) return 'bullish'
  return (last.choch = null)
}

export function detectBOS(prev: ChartData, last: ChartData) {
  if (prev.bias === 'bullish' && last.c < prev.l) return 'bearish'
  if (prev.bias === 'bearish' && last.c > prev.h) return 'bullish'
  return null
}

export type Signal = 'buy' | 'sell' | 'none'

export function getSignal(candle: {
  swing?: 'HH' | 'HL' | 'LH' | 'LL'
  bias?: 'bullish' | 'bearish' | null
  bos?: 'bullish' | 'bearish' | null
  choch?: 'bullish' | 'bearish' | null
}): Signal {
  if (
    candle.bias === 'bullish' &&
    (candle.bos === 'bullish' || candle.choch === 'bullish')
  ) {
    return 'buy'
  }
  if (
    candle.bias === 'bearish' &&
    (candle.bos === 'bearish' || candle.choch === 'bearish')
  ) {
    return 'sell'
  }
  return 'none'
}
