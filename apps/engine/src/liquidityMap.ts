// liquidityMap.ts
import { state } from './state'

const BIN_SIZE = 5 // $5 BTC bins
const WINDOW_MS = 30_000 // 30s rolling window
const UPDATE_THROTTLE = 500
const MAX_EVENTS = 50_000

type LiquidityEvent = {
  price: number
  size: number
  side: 'bid' | 'ask'
  ts: number
}

type LiquidityBin = {
  price: number
  bid: number
  ask: number
  total: number
}

let events: LiquidityEvent[] = []
let lastUpdate = 0
let bins = new Map<number, LiquidityBin>()

function priceToBin(price: number) {
  return Math.round(price / BIN_SIZE) * BIN_SIZE
}

export function ingestOrderBookSnapshot() {
  const now = Date.now()

  const seenBids = new Set<number>()
  const seenAsks = new Set<number>()

  for (const [p, sz] of state.bids) {
    if (sz === 0) continue
    if (seenBids.has(p)) continue
    seenBids.add(p)

    events.push({
      price: p,
      size: sz,
      side: 'bid',
      ts: now,
    })
  }

  for (const [p, sz] of state.asks) {
    if (sz === 0) continue
    if (seenAsks.has(p)) continue
    seenAsks.add(p)

    events.push({
      price: p,
      size: sz,
      side: 'ask',
      ts: now,
    })
  }

  prune(now)
}

function prune(now: number) {
  const cutoff = now - WINDOW_MS
  events = events.filter((e) => e.ts >= cutoff)

  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS)
  }
}

export function updateLiquidityMap() {
  const now = Date.now()
  if (now - lastUpdate < UPDATE_THROTTLE) return
  lastUpdate = now

  bins.clear()

  for (const e of events) {
    const binPrice = priceToBin(e.price)
    const bin = bins.get(binPrice) ?? {
      price: binPrice,
      bid: 0,
      ask: 0,
      total: 0,
    }

    if (e.side === 'bid') bin.bid += e.size
    else bin.ask += e.size

    bin.total += e.size
    bins.set(binPrice, bin)
  }
}

export function getLiquidityZones() {
  const values = [...bins.values()]
  if (!values.length) return []

  const avg = values.reduce((a, b) => a + b.total, 0) / values.length

  return values
    .filter((b) => b.total > avg * 2.5)
    .sort((a, b) => b.total - a.total)
}
