import './hyperliquid'
import { evaluate, currentScores } from './signal'
import { CONFIG } from './config'
import { updateLiquidityMap } from './liquidityMap'
import { broadcastMetrics } from './ws'
import { state } from './state'

setInterval(() => {
  updateLiquidityMap()
  evaluate()
  sendRealTimeMetrics()
}, CONFIG.evalIntervalMs)

function sendRealTimeMetrics() {
  const price = state.prices.at(-1)
  if (!price) return

  const vwapDiff = price - state.vwap.value
  const zVWAP = state.z.vwap.update(vwapDiff)
  const zDelta = state.z.delta.update(state.cvd)

  const metrics = {
    type: 'metrics',
    timestamp: Date.now(),
    data: {
      price,
      vwap: state.vwap.value,
      cvd: state.cvd,
      zVWAP,
      zDelta,
      scores: {
        scoreLong: currentScores.scoreLong,
        scoreShort: currentScores.scoreShort
      },
      volume: {
        total: state.trades.reduce((a, b) => a + b.size, 0),
        buy: state.trades.filter(t => t.side === 'buy').reduce((a, b) => a + b.size, 0),
        sell: state.trades.filter(t => t.side === 'sell').reduce((a, b) => a + b.size, 0),
        count: state.trades.length
      },
      liquidity: {
        bidLevels: state.bids.size,
        askLevels: state.asks.size,
        spread: calculateSpread()
      },
      market: {
        priceRange: {
          high: Math.max(...state.prices.slice(-50)),
          low: Math.min(...state.prices.slice(-50))
        },
        avgPrice: state.prices.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, state.prices.length)
      }
    },
    state
  }

  broadcastMetrics(metrics)
}

function calculateSpread(): number {
  const bids = Array.from(state.bids.keys()).sort((a, b) => b - a)
  const asks = Array.from(state.asks.keys()).sort((a, b) => a - b)
  
  if (bids.length === 0 || asks.length === 0) return 0
  
  return asks[0] - bids[0]
}
