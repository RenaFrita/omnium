import WebSocket, { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 3001 })

export function broadcast(msg: any) {
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify(msg))
    }
  })
}
