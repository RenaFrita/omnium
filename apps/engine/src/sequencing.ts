// sequencing.ts
import { state } from './state'

const WINDOW = 8

function slope(arr: number[]) {
  if (arr.length < 2) return 0
  let sum = 0
  for (let i = 1; i < arr.length; i++) {
    sum += arr[i] - arr[i - 1]
  }
  return sum
}

export function detectFailedAuction(side: 'buy' | 'sell') {
  if (state.trades.length < WINDOW) return false

  const recent = state.trades.slice(-WINDOW)

  const prices = recent.map((t) => t.price)
  const deltas = recent.map((t) =>
    t.side === 'buy' ? t.size : -t.size
  )

  const priceSlope = slope(prices)
  const deltaSlope = slope(deltas)

  if (side === 'sell') {
    return priceSlope < 0 && deltaSlope > 0
  }

  if (side === 'buy') {
    return priceSlope > 0 && deltaSlope < 0
  }

  return false
}
