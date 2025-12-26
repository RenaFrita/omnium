import { state } from './state'
import { CONFIG } from './config'
import { detectAbsorption } from './absorption'
import { deltaDivergence } from './divergence'
import { vwapStd } from './vwap'
import { broadcast } from './ws'

export function evaluate() {
  const price = state.prices.at(-1)
  if (!price) return

  let scoreLong = 0
  let scoreShort = 0
  const reasonsLong: string[] = []
  const reasonsShort: string[] = []

  const deviation = price - state.vwap.value
  const vwapThreshold = CONFIG.VWAP_SIGMA * vwapStd()

  if (deviation > vwapThreshold) {
    scoreShort += 2
    reasonsShort.push('vwap_above_sigma')
  } else if (deviation < -vwapThreshold) {
    scoreLong += 2
    reasonsLong.push('vwap_below_sigma')
  }

  if (detectAbsorption('sell')) {
    scoreLong += 3
    reasonsLong.push('sell_absorption')
  }
  if (detectAbsorption('buy')) {
    scoreShort += 3
    reasonsShort.push('buy_absorption')
  }

  const delta = deltaDivergence()
  if (delta === 'bullish') {
    scoreLong += 3
    reasonsLong.push('delta_bullish')
  } else if (delta === 'bearish') {
    scoreShort += 3
    reasonsShort.push('delta_bearish')
  }

  if (scoreLong >= CONFIG.SCORE_MIN && scoreLong > scoreShort) {
    broadcast({
      direction: 'long',
      price,
      score: scoreLong,
      reasons: reasonsLong,
    })
    console.log(price, 'LONG', scoreLong, reasonsLong)
  } else if (scoreShort >= CONFIG.SCORE_MIN && scoreShort > scoreLong) {
    broadcast({
      direction: 'short',
      price,
      score: scoreShort,
      reasons: reasonsShort,
    })
    console.log(price, 'SHORT', scoreShort, reasonsShort)
  } else {
    console.log(price, 'NO SIGNAL', { scoreLong, scoreShort })
  }
}
