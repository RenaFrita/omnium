import { state } from './state'

export function updateVWAP(trade: { price: number; size: number }) {
  const { price, size } = trade

  state.vwap.sumPV += price * size
  state.vwap.sumV += size

  const prevVWAP = state.vwap.value
  state.vwap.value = state.vwap.sumPV / state.vwap.sumV
  state.vwap.variance += size * (price - prevVWAP) * (price - state.vwap.value)
}

export function vwapStd() {
  if (state.vwap.sumV === 0) return 0
  return Math.sqrt(state.vwap.variance / state.vwap.sumV)
}
