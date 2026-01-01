import { updateVWAP } from './vwap'
import { state } from './state'
import { ingestOrderBookSnapshot } from './liquidityMap'

interface WsBook {
  coin: string;
  levels: [Array<WsLevel>, Array<WsLevel>];
  time: number;
}

interface WsLevel {
  px: string; // price
  sz: string; // size
  n: number; // number of orders
}

interface WsTrade {
  coin: string;
  side: string;
  px: string;
  sz: string;
  hash: string;
  time: number;
  // tid is 50-bit hash of (buyer_oid, seller_oid). 
  // For a globally unique trade id, use (block_time, coin, tid)
  tid: number;  
  users: [string, string] // [buyer, seller]
}

const TRADE_WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const MAX_PRICES = 2000 // manter últimos 2000 ticks de preço

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

  ingestOrderBookSnapshot()
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
  const now = Date.now()
  // trades: últimos 15 minutos
  state.trades = state.trades.filter((t) => t.ts >= now - TRADE_WINDOW_MS)
  // preços: últimos 2000 ticks
  state.prices = state.prices.slice(-MAX_PRICES)
}
