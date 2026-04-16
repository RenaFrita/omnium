// trade-data-worker.ts
import { WsTrade, Trade, Interval } from '../types'
import { RingBuffer } from './RingBuffer'

const INTERVAL_MS: Record<Interval, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
}

let socket: WebSocket | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null
const buffers = new Map<string, RingBuffer>()
const drafts = new Map<string, Trade>()
const MAX_BUFFER = 1000000

self.onmessage = (e: MessageEvent) => {
  const { type, coin, intervals, interval } = e.data

  switch (type) {
    case 'CONNECT':
      connect(coin, intervals)
      break
    case 'GET_HISTORY':
      const history = buffers.get(interval)?.getHistory() || []
      self.postMessage({ type: 'HISTORY_DATA', interval, history })
      break
  }
}

function connect(coin: string, intervals: string[]) {
  if (socket) socket.close()
  if (pingInterval) clearInterval(pingInterval)

  socket = new WebSocket('wss://api.hyperliquid.xyz/ws')

  socket.onopen = () => {
    console.log('[Worker] Connected to Hyperliquid')
    intervals.forEach((i) => {
      if (!buffers.has(i)) buffers.set(i, new RingBuffer(MAX_BUFFER))
    })
    socket?.send(
      JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'trades', coin },
      })
    )

    pingInterval = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ method: 'ping' }))
      }
    }, 30000)
  }

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.channel === 'trades' && Array.isArray(msg.data)) {
      const trades: WsTrade[] = msg.data
      for (const wsTrade of trades) {
        processTrade(wsTrade)
      }
    }
  }

  socket.onclose = () => {
    if (pingInterval) clearInterval(pingInterval)
    setTimeout(() => connect(coin, intervals), 5000)
  }

  socket.onerror = () => socket?.close()
}

function processTrade(wsTrade: WsTrade) {
  const px = +wsTrade.px
  const sz = +wsTrade.sz
  const time = wsTrade.time

  for (const interval of buffers.keys()) {
    const intervalMs = INTERVAL_MS[interval as Interval]
    const candleTime = Math.floor(time / intervalMs) * intervalMs

    const draft = drafts.get(interval)
    if (draft && draft.T === candleTime) {
      const updated: Trade = {
        ...draft,
        c: px,
        v: draft.v + sz,
        h: Math.max(draft.h, px),
        l: Math.min(draft.l, px),
        n: draft.n + 1,
      }
      drafts.set(interval, updated)
      const buffer = buffers.get(interval)
      if (buffer) {
        const withIndicators = buffer.addDraft(updated)
        self.postMessage({
          type: 'CANDLE_UPDATE',
          candle: withIndicators,
          interval,
        })
      }
    } else {
      if (draft) {
        const buffer = buffers.get(interval)
        if (buffer) {
          const closed = buffer.add(draft)
          self.postMessage({ type: 'CANDLE_UPDATE', candle: closed, interval })
        }
      }
      const newDraft: Trade = {
        t: candleTime,
        T: candleTime + intervalMs,
        s: wsTrade.coin,
        i: interval,
        o: px,
        c: px,
        h: px,
        l: px,
        v: sz,
        n: 1,
      }
      drafts.set(interval, newDraft)
      const buffer = buffers.get(interval)
      if (buffer) {
        const withIndicators = buffer.addDraft(newDraft)
        self.postMessage({
          type: 'CANDLE_UPDATE',
          candle: withIndicators,
          interval,
        })
      }
    }
  }
}
