import { state } from './state'

export function deltaDivergence() {
  if (state.prices.length < 20) return 'none'

  const last = state.prices.at(-1)!
  const prev = state.prices[state.prices.length - 20]

  if (last < prev && state.cvd > 0) return 'bullish'
  if (last > prev && state.cvd < 0) return 'bearish'

  return 'none'
}
