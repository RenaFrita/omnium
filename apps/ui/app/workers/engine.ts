import { WsTrade, WsBook, WsLevel, Trade, Interval } from '../types'
import { RingBuffer } from './RingBuffer'
import { DraftManager, INTERVAL_MS } from './Draft'
import { OrderFlowCalculator } from './OrderFlowCalculator'

const MAX_BUFFER = 500

let socket: WebSocket | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null
let orderFlowInterval: ReturnType<typeof setInterval> | null = null
const buffers = new Map<string, RingBuffer>()
let draftManager: DraftManager
let currentCoin = ''
const orderFlow = new OrderFlowCalculator()

async function fetchHistory(interval: string) {
  const buffer = buffers.get(interval)
  if (!buffer) return

  const intervalMs = INTERVAL_MS[interval as Interval]
  const maxLookback = 365 * 24 * 60 * 60 * 1000 // 1 year max
  const numCandles = Math.min(500, Math.ceil(maxLookback / intervalMs))
  const endTime = Date.now()
  const startTime = endTime - intervalMs * numCandles

  try {
    const res = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'candleSnapshot',
        req: { coin: currentCoin, interval, startTime, endTime },
      }),
    })
    const json = await res.json()
    if (!Array.isArray(json)) {
      console.warn('[Worker] Unexpected candleSnapshot response:', json)
      return
    }
    for (const c of json) {
      buffer.add(c as Trade)
    }
    const history = buffer.getHistory()
    self.postMessage({ type: 'HISTORY_DATA', interval, history })
  } catch (err) {
    console.warn('[Worker] Failed to fetch history:', err)
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, coin, intervals, interval } = e.data

  switch (type) {
    case 'CONNECT':
      connect(coin, intervals)
      break
    case 'FETCH_HISTORY':
      await fetchHistory(interval)
      break
    case 'GET_HISTORY':
      const history = buffers.get(interval)?.getHistory() || []
      self.postMessage({ type: 'HISTORY_DATA', interval, history })
      break
    case 'SET_LARGE_PRINT_MULTIPLIER':
      orderFlow.setLargePrintMultiplier(e.data.value)
      break
  }
}

function connect(coin: string, intervals: string[]) {
  if (socket) socket.close()
  if (pingInterval) clearInterval(pingInterval)
  if (orderFlowInterval) clearInterval(orderFlowInterval)
  currentCoin = coin
  orderFlow.reset()
  orderFlow.setCoin(coin)
  orderFlow.setOnAlert((alert) => {
    self.postMessage({ type: 'ALERT', ...alert, coin, ts: Date.now() })
  })

  intervals.forEach((i) => {
    if (!buffers.has(i)) buffers.set(i, new RingBuffer(MAX_BUFFER))
  })
  draftManager = new DraftManager(buffers)

  socket = new WebSocket('wss://api.hyperliquid.xyz/ws')

  socket.onopen = () => {
    console.log('[Worker] Connected to Hyperliquid')

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

    orderFlowInterval = setInterval(() => {
      const snap = orderFlow.getSnapshot()
      if (snap) self.postMessage({ type: 'ORDER_FLOW_SNAP', ...snap })
    }, 500)
  }

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.channel === 'trades' && Array.isArray(msg.data)) {
      const trades: WsTrade[] = msg.data
      const aggressiveTrades: {
        price: number
        size: number
        side: string
        time: number
      }[] = []
      for (const wsTrade of trades) {
        draftManager.processTrade(wsTrade, (candle, interval) => {
          self.postMessage({ type: 'CANDLE_UPDATE', candle, interval })
        })
        orderFlow.processTrade(wsTrade)
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
      orderFlow.processBook(book)
      self.postMessage({ type: 'ORDER_BOOK', bids, asks })
      console.log(book.levels[0][0], book.levels[1][0])
    }
  }

  socket.onclose = () => {
    if (pingInterval) clearInterval(pingInterval)
    if (orderFlowInterval) clearInterval(orderFlowInterval)
    setTimeout(() => connect(coin, intervals), 5000)
  }

  socket.onerror = () => socket?.close()
}
