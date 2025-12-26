import { updateVWAP } from './vwap'
import { state } from './state'

interface WsLevel {
  px: string
  sz: string
  n: number
}

interface WsBook {
  coin: string
  levels: [WsLevel[], WsLevel[]]
  time: number
}

interface WsTrade {
  coin: string
  side: string
  px: string
  sz: string
  hash: string
  time: number
  tid: number
  users: [string, string]
}

export function onOrderBook(book: WsBook) {
  const [bidsArr, asksArr] = book.levels

  for (const lvl of bidsArr) {
    const price = parseFloat(lvl.px)
    const size = parseFloat(lvl.sz)
    if (isNaN(price) || isNaN(size)) continue

    if (size === 0) state.bids.delete(price)
    else state.bids.set(price, size)
  }

  for (const lvl of asksArr) {
    const price = parseFloat(lvl.px)
    const size = parseFloat(lvl.sz)
    if (isNaN(price) || isNaN(size)) continue

    if (size === 0) state.asks.delete(price)
    else state.asks.set(price, size)
  }
}

export function onTrade(t: WsTrade) {
  const price = parseFloat(t.px)
  const size = parseFloat(t.sz)
  if (isNaN(price) || isNaN(size)) return

  const trade = {
    price,
    size,
    side: t.side === 'B' ? 'buy' : 'sell',
    ts: t.time,
    hash: t.hash,
    tid: t.tid,
    users: t.users,
  }

  state.trades.push(trade)
  state.prices.push(price)

  state.cvd += trade.side === 'buy' ? size : -size

  updateVWAP(trade)
  prune()
}

function prune() {
  const cutoff = Date.now() - 5000
  state.trades = state.trades.filter((t) => t.ts >= cutoff)
  state.prices = state.prices.slice(-200)
}
