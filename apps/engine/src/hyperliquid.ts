import WebSocket from 'ws'
import { onTrade, onOrderBook } from './stream'
import { CONFIG } from './config'

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
