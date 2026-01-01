import WebSocket from 'ws'
import { state } from './state'
import { onTrade, onOrderBook } from './stream'
import { CONFIG } from './config'

async function loadInitialBook() {
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'l2Book',
      coin: 'BTC',
    }),
  })

  const data = await res.json()

  state.bids.clear()
  state.asks.clear()

  for (const { px, sz } of data.levels[0]) {
    state.bids.set(Number(px), Number(sz))
  }

  for (const { px, sz } of data.levels[1]) {
    state.asks.set(Number(px), Number(sz))
  }
}

await loadInitialBook()

const ws = new WebSocket('wss://api.hyperliquid.xyz/ws')

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      method: 'subscribe',
      subscription: { type: 'l2Book', coin: CONFIG.coin },
    })
  )

  ws.send(
    JSON.stringify({
      method: 'subscribe',
      subscription: { type: 'trades', coin: CONFIG.coin },
    })
  )
})

ws.on('message', (msg) => {
  const data = JSON.parse(msg.toString())
  if (data.channel === 'l2Book') onOrderBook(data.data)
  if (data.channel === 'trades') data.data.forEach(onTrade)
})
