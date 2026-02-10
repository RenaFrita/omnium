'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface Candle {
  t: number
  T: number
  s: string
  i: string
  o: number
  c: number
  h: number
  l: number
  v: number
  n: number
}

export const useHyperliquid = (coin: string, interval: string = '1m') => {
  const [candles, setCandles] = useState<Candle[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const connectRef = useRef<() => void>(() => {})

  const reconnectAttempts = useRef(0)
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPong = useRef<number>(0)

  // =========================
  // MESSAGE HANDLER
  // =========================

  const handleMessage = useCallback((event: MessageEvent) => {
    const msg = JSON.parse(event.data)

    if (msg.channel === 'pong') {
      lastPong.current = Date.now()
      return
    }

    if (msg.channel === 'candle') {
      const candle: Candle = msg.data

      setCandles((prev) => {
        const exists = prev.find((c) => c.t === candle.t)

        if (exists) {
          return prev.map((c) => (c.t === candle.t ? candle : c))
        }

        return [...prev, candle].slice(-30)
      })
    }
  }, [])

  // =========================
  // SUBSCRIBE
  // =========================

  const subscribe = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(
      JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'candle', coin, interval },
      })
    )
  }, [coin, interval])

  // =========================
  // HEARTBEAT
  // =========================

  const startHeartbeat = useCallback(() => {
    if (pingInterval.current) return

    pingInterval.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
        return

      wsRef.current.send(JSON.stringify({ method: 'ping' }))

      if (Date.now() - lastPong.current > 60000) {
        console.log('Stale connection. Reconnecting...')
        wsRef.current.close()
      }
    }, 30000)
  }, [])

  const stopHeartbeat = () => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current)
      pingInterval.current = null
    }
  }

  // =========================
  // RECONNECT
  // =========================

  const scheduleReconnect = useCallback(() => {
    const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000)
    reconnectAttempts.current++

    reconnectTimeout.current = setTimeout(() => {
      console.log('Reconnecting...')
      connectRef.current()
    }, delay)
  }, [])

  const stopReconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
  }

  // =========================
  // CONNECT
  // =========================

  const connect = useCallback(() => {
    const ws = new WebSocket('wss://api.hyperliquid.xyz/ws')
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WS connected')
      reconnectAttempts.current = 0
      lastPong.current = Date.now()

      subscribe()
      startHeartbeat()
    }

    ws.onmessage = handleMessage

    ws.onclose = () => {
      console.log('WS closed')
      stopHeartbeat()
      scheduleReconnect()
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [handleMessage, scheduleReconnect, startHeartbeat, subscribe])

  // manter ref atualizada (evita ciclo)
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  // =========================
  // EFFECT
  // =========================

  useEffect(() => {
    connect()

    return () => {
      stopHeartbeat()
      stopReconnect()
      wsRef.current?.close()
    }
  }, [connect])

  return candles
}


