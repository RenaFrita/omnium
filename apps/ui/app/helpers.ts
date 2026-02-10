import { Candle } from "./hooks/useHyperliquid"

export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const ema: number[] = []
  ema[0] = data[0]

  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k)
  }

  return ema
}

export function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = []
  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  rsi[period] = 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    rsi[i] = 100 - 100 / (1 + avgGain / avgLoss)
  }

  return rsi
}

export function detectStructure(candles: Candle[]) {
  const structure: string[] = []

  for (let i = 2; i < candles.length; i++) {
    const prevHigh = candles[i - 1].h
    const prevLow = candles[i - 1].l
    const currHigh = candles[i].h
    const currLow = candles[i].l

    if (currHigh > prevHigh && currLow > prevLow)
      structure[i] = 'HH'
    else if (currHigh < prevHigh && currLow > prevLow)
      structure[i] = 'HL'
    else if (currHigh < prevHigh && currLow < prevLow)
      structure[i] = 'LL'
    else if (currHigh > prevHigh && currLow < prevLow)
      structure[i] = 'LH'
    else structure[i] = 'RANGE'
  }

  return structure
}

export function detectBOS(structure: string[]) {
  const bos: boolean[] = []

  for (let i = 1; i < structure.length; i++) {
    if (structure[i - 1] === 'HL' && structure[i] === 'HH')
      bos[i] = true
    else if (structure[i - 1] === 'LH' && structure[i] === 'LL')
      bos[i] = true
    else bos[i] = false
  }

  return bos
}

export function detectVolumeSpike(volumes: number[], period = 20) {
  const spikes: boolean[] = []

  for (let i = period; i < volumes.length; i++) {
    const avg =
      volumes.slice(i - period, i).reduce((a, b) => a + b, 0) / period

    spikes[i] = volumes[i] > avg * 2
  }

  return spikes
}
