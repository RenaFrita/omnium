import { state } from './state'
import { CONFIG } from './config'
import { detectAbsorption } from './absorption'
import { deltaDivergence } from './divergence'
import { vwapStd } from './vwap'
import { broadcast } from './ws'

export function evaluate() {
  const price = state.prices.at(-1)
  if (!price) return

  let score = 0
  const reasons: string[] = []

  if (Math.abs(price - state.vwap.value) > CONFIG.VWAP_SIGMA * vwapStd()) {
    score += 2
    reasons.push('vwap_extreme')
  }

  if (detectAbsorption('sell')) {
    score += 3
    reasons.push('sell_absorption')
  }

  if (deltaDivergence() === 'bullish') {
    score += 3
    reasons.push('delta_div')
  }

  if (score >= CONFIG.SCORE_MIN) {
    broadcast({
      direction: 'long',
      price,
      score,
      reasons,
    })
  }
}
