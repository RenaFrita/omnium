import { state } from './state'
import { CONFIG } from './config'

export function detectAbsorption(side: 'buy' | 'sell') {
  const recent = state.trades.filter((t) => t.side === side)
  if (!recent.length) return false

  const vol = recent.reduce((a, b) => a + b.size, 0)
  const move = Math.abs(recent.at(-1)!.price - recent[0].price)

  return vol >= CONFIG.ABSORPTION_VOL && move <= CONFIG.MAX_PRICE_MOVE
}
