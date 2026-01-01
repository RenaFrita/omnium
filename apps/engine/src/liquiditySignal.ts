// liquiditySignal.ts
import { state } from './state'
import { getLiquidityZones } from './liquidityMap'

const TOUCH_DIST = 5 // distância aceitável ao bin

export type LiquidityReaction =
  | 'bid_support'
  | 'ask_resistance'
  | null

export function detectLiquidityReaction(): LiquidityReaction {
  const price = state.prices.at(-1)
  if (!price) return null

  const zones = getLiquidityZones()
  if (!zones.length) return null

  for (const z of zones) {
    const dist = Math.abs(price - z.price)
    if (dist > TOUCH_DIST) continue

    // mais bid que ask → suporte
    if (z.bid > z.ask * 1.5) {
      return 'bid_support'
    }

    // mais ask que bid → resistência
    if (z.ask > z.bid * 1.5) {
      return 'ask_resistance'
    }
  }

  return null
}
