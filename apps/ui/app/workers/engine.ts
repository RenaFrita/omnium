// trade-data-worker.ts
import { WsTrade, WsBook, WsLevel } from '../types'
import { RingBuffer } from './RingBuffer'
import { DraftManager } from './Draft'

const MAX_BUFFER = 1000000

let socket: WebSocket | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null
const buffers = new Map<string, RingBuffer>()
let draftManager: DraftManager

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
    draftManager = new DraftManager(buffers)

    socket?.send(
      JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'trades', coin },
      })
    )

    socket?.send(
      JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'l2Book', coin },
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
      const aggressiveTrades: { price: number; size: number; side: string; time: number }[] = []
      for (const wsTrade of trades) {
        draftManager.processTrade(wsTrade, (candle, interval) => {
          self.postMessage({ type: 'CANDLE_UPDATE', candle, interval })
        })
        aggressiveTrades.push({
          price: +wsTrade.px,
          size: +wsTrade.sz,
          side: wsTrade.side,
          time: wsTrade.time,
        })
      }
      self.postMessage({ type: 'AGGRESSIVE_TRADES', trades: aggressiveTrades })
    }

    if (msg.channel === 'l2Book') {
      const book = msg.data as WsBook
      const mapLevel = (l: WsLevel) => ({
        price: +l.px,
        size: +l.sz,
      })
      const bids = book.levels[0].map(mapLevel)
      const asks = book.levels[1].map(mapLevel)
      self.postMessage({ type: 'ORDER_BOOK', bids, asks })
    }
  }

  socket.onclose = () => {
    if (pingInterval) clearInterval(pingInterval)
    setTimeout(() => connect(coin, intervals), 5000)
  }

  socket.onerror = () => socket?.close()
}
