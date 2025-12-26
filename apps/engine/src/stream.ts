import { state } from './state'
import { updateVWAP } from './vwap'

type L2Level = {
  side: 'B' | 'A' // B = bid, A = ask
  px: string
  sz: string
}

export function onOrderBook(msg: any) {
  if (!msg?.levels || !Array.isArray(msg.levels)) return

  for (const lvl of msg.levels as L2Level[]) {
    const price = +lvl.px
    const size = +lvl.sz

    if (lvl.side === 'B') {
      if (size === 0) state.bids.delete(price)
      else state.bids.set(price, size)
    } else if (lvl.side === 'A') {
      if (size === 0) state.asks.delete(price)
      else state.asks.set(price, size)
    }
  }
}

export function onTrade(t: any) {
  const trade = {
    price: +t.p,
    size: +t.s,
    side: t.side === 'B' ? 'buy' : 'sell',
    ts: Date.now(),
  }

  state.trades.push(trade)
  state.prices.push(trade.price)

  state.cvd += trade.side === 'buy' ? trade.size : -trade.size

  updateVWAP(trade)
  prune()
}

function prune() {
  const cutoff = Date.now() - 5000
  state.trades = state.trades.filter((t) => t.ts >= cutoff)
  state.prices = state.prices.slice(-200)
}
