// import { ChartData } from './stores/chart'

// // --- CÁLCULOS TÉCNICOS ---

// export function calculateEMA(last: number | null, price: number, period: number): number {
//   const k = 2 / (period + 1)
//   return last === null ? price : price * k + last * (1 - k)
// }

// export function calculateVolumeSpike(candles: ChartData[], volume: number, period = 20, multiplier = 1.5): boolean {
//   if (candles.length < period) return false
//   const recent = candles.slice(-period)
//   const avgVolume = recent.reduce((sum, c) => sum + c.v, 0) / recent.length
//   return volume > avgVolume * multiplier
// }

// export function calculateRSI(prev: ChartData, last: ChartData, period = 14) {
//   const gain = Math.max(last.c - prev.c, 0)
//   const loss = Math.max(prev.c - last.c, 0)
//   const prevAvgGain = prev._avgGain ?? gain
//   const prevAvgLoss = prev._avgLoss ?? loss

//   const avgGain = (prevAvgGain * (period - 1) + gain) / period
//   const avgLoss = (prevAvgLoss * (period - 1) + loss) / period
//   const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

//   return { rsi, _avgGain: avgGain, _avgLoss: avgLoss }
// }

// // --- ESTRUTURA DE MERCADO ---

// export function detectSwingType(candles: ChartData[], index: number): 'High' | 'Low' | null {
//   if (index < 2 || index > candles.length - 3) return null
//   const curr = candles[index]
//   const isHigh = curr.h > candles[index - 1].h && curr.h > candles[index - 2].h &&
//                  curr.h > candles[index + 1].h && curr.h > candles[index + 2].h
//   const isLow = curr.l < candles[index - 1].l && curr.l < candles[index - 2].l &&
//                 curr.l < candles[index + 1].l && curr.l < candles[index + 2].l
//   return isHigh ? 'High' : isLow ? 'Low' : null
// }

// export function getLastPivotPoints(candles: ChartData[], currentIndex: number) {
//   let lastHigh = 0
//   let lastLow = Infinity
//   // Otimizado: Busca apenas nos pivots já marcados anteriormente
//   for (let i = currentIndex - 1; i >= 0; i--) {
//     if (candles[i].swingType === 'High' && lastHigh === 0) lastHigh = candles[i].h
//     if (candles[i].swingType === 'Low' && lastLow === Infinity) lastLow = candles[i].l
//     if (lastHigh !== 0 && lastLow !== Infinity) break
//   }
//   return { lastHigh, lastLow }
// }

// export function detectFVG(candles: ChartData[]): 'bullish' | 'bearish' | null {
//   if (candles.length < 3) return null
//   const c1 = candles[candles.length - 3] // Candle 1
//   const c3 = candles[candles.length - 1] // Candle 3 (atual)

//   // Bullish FVG: Mínima do Candle 3 está acima da Máxima do Candle 1
//   if (c3.l > c1.h) return 'bullish'
//   // Bearish FVG: Máxima do Candle 3 está abaixo da Mínima do Candle 1
//   if (c3.h < c1.l) return 'bearish'
  
//   return null
// }

// export function detectBias(prevBias: 'bullish' | 'bearish' | null, swing: string | null): 'bullish' | 'bearish' | null {
//   if (!swing) return prevBias
//   if (['HH', 'HL'].includes(swing)) return 'bullish'
//   if (['LL', 'LH'].includes(swing)) return 'bearish'
//   return prevBias
// }

// export function detectStructureChange(
//   candles: ChartData[],
//   bias: 'bullish' | 'bearish' | null
// ): { choch: 'bullish' | 'bearish' | null; bos: 'bullish' | 'bearish' | null } {
//   if (candles.length < 5 || !bias) return { choch: null, bos: null }
//   const lastCandle = candles[candles.length - 1]
//   const { lastHigh, lastLow } = getLastPivotPoints(candles, candles.length - 1)

//   if (lastHigh === 0 || lastLow === Infinity) return { choch: null, bos: null }

//   if (bias === 'bullish') {
//     if (lastCandle.c < lastLow) return { choch: 'bearish', bos: null }
//     if (lastCandle.c > lastHigh) return { choch: null, bos: 'bullish' }
//   } else if (bias === 'bearish') {
//     if (lastCandle.c > lastHigh) return { choch: 'bullish', bos: null }
//     if (lastCandle.c < lastLow) return { choch: null, bos: 'bearish' }
//   }
//   return { choch: null, bos: null }
// }