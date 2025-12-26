import { state } from './state'
import { CONFIG } from './config'
import { detectAbsorption } from './absorption'
import { deltaDivergence } from './divergence'
import { broadcast } from './ws'

export function evaluate() {
  const price = state.prices.at(-1)
  if (!price) return

  let scoreLong = 0
  let scoreShort = 0
  const reasonsLong: string[] = []
  const reasonsShort: string[] = []

  // ===== Z-SCORES =====
  const vwapDiff = price - state.vwap.value
  const zVWAP = state.z.vwap.update(vwapDiff)
  const zDelta = state.z.delta.update(state.cvd)

  // ===== CONTEXTO (VWAP) =====
  if (zVWAP > CONFIG.Z.VWAP) {
    scoreShort += 2
    reasonsShort.push('vwap_z_high')
  }

  if (zVWAP < -CONFIG.Z.VWAP) {
    scoreLong += 2
    reasonsLong.push('vwap_z_low')
  }

  // ===== ORDERFLOW (ABSORPTION) =====
  if (detectAbsorption('sell')) {
    scoreLong += 3
    reasonsLong.push('sell_absorption')
  }

  if (detectAbsorption('buy')) {
    scoreShort += 3
    reasonsShort.push('buy_absorption')
  }

  // ===== DELTA CONFIRM =====
  const delta = deltaDivergence()

  if (delta === 'bullish' && zDelta > CONFIG.Z.DELTA) {
    scoreLong += 2
    reasonsLong.push('delta_bullish_z')
  }

  if (delta === 'bearish' && zDelta < -CONFIG.Z.DELTA) {
    scoreShort += 2
    reasonsShort.push('delta_bearish_z')
  }

  // ===== EMIT =====
  if (scoreLong >= CONFIG.SCORE_MIN && scoreLong > scoreShort) {
    broadcast({
      direction: 'long',
      price,
      score: scoreLong,
      reasons: reasonsLong,
    })
    console.log(price, 'LONG', scoreLong, reasonsLong, { zVWAP, zDelta })
  } else if (scoreShort >= CONFIG.SCORE_MIN && scoreShort > scoreLong) {
    broadcast({
      direction: 'short',
      price,
      score: scoreShort,
      reasons: reasonsShort,
    })
    console.log(price, 'SHORT', scoreShort, reasonsShort, { zVWAP, zDelta })
  } else {
    console.log(price, 'NO SIGNAL', { scoreLong, scoreShort, zVWAP, zDelta })
  }
}
