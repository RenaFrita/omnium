import { state } from './state'
import { CONFIG } from './config'

export function detectAbsorption(side: 'buy' | 'sell') {
  const recent = state.trades.filter((t) => t.side === side)
  if (!recent.length) return false

  // Volume acumulado no lado
  const vol = recent.reduce((a, b) => a + b.size, 0)
  // Movimento de preço
  const move = Math.abs(recent.at(-1)!.price - recent[0].price)

  // Média do tamanho dos trades recentes
  const avgSize =
    recent.reduce((a, b) => a + b.size, 0) / recent.length || 0

  // Threshold dinâmico: 5x a média do trade
  const thresholdVol = avgSize * CONFIG.ABSORPTION_VOL

  return vol >= thresholdVol && move <= CONFIG.MAX_PRICE_MOVE
}
