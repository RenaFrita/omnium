// trade-data-worker.ts
import { WsTrade } from '../types'
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
        draftManager.processTrade(wsTrade, (candle, interval) => {
          self.postMessage({ type: 'CANDLE_UPDATE', candle, interval })
        })
      }
    }
  }

  socket.onclose = () => {
    if (pingInterval) clearInterval(pingInterval)
    setTimeout(() => connect(coin, intervals), 5000)
  }

  socket.onerror = () => socket?.close()
}
