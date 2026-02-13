'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Candle, Interval } from '../types'
import { intervals } from '../constants'
import { useChartStore } from '../stores/chart'

export const useSocket = (coin: string) => {
  const wsRef = useRef<WebSocket | null>(null)
  const connectRef = useRef<() => void>(() => {})
  const reconnectAttempts = useRef(0)
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPong = useRef<number>(0)
  const addCandle = useChartStore((state)=> state.addCandle)

  const onMessage = useCallback((event: MessageEvent) => {
    const msg = JSON.parse(event.data)

    if (msg.channel === 'pong') {
      lastPong.current = Date.now()
      return
    }

    if (msg.channel === 'candle') {
        
      const candle: Candle = msg.data
      addCandle(candle.i as Interval, candle)
    }
  }, [addCandle])

  const stopHeartbeat = useCallback(() => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current)
      pingInterval.current = null
    }
  }, [])

  const onOpen = useCallback(() => {
    console.log('WS connected')
    reconnectAttempts.current = 0
    lastPong.current = Date.now()
    intervals.forEach((interval) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

      return wsRef.current.send(
        JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'candle', coin, interval },
        })
      )
    })
    if (pingInterval.current) return

    pingInterval.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

      wsRef.current.send(JSON.stringify({ method: 'ping' }))

      if (Date.now() - lastPong.current > 60000) {
        console.log('Stale connection. Reconnecting...')
        wsRef.current.close()
      }
    }, 30000)
  }, [coin])

  const onClose = useCallback(() => {
    {
      console.log('WS closed')
      stopHeartbeat()
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000)
      reconnectAttempts.current++

      reconnectTimeout.current = setTimeout(() => {
        console.log('Reconnecting...')
        connectRef.current()
      }, delay)
    }
  }, [stopHeartbeat])

  const connect = useCallback(() => {
    const ws = new WebSocket('wss://api.hyperliquid.xyz/ws')
    wsRef.current = ws
    ws.onopen = onOpen
    ws.onmessage = onMessage
    ws.onclose = onClose
    ws.onerror = () => ws.close()
  }, [onMessage, onClose, onOpen])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    connect()

    return () => {
      stopHeartbeat()
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
        reconnectTimeout.current = null
      }
      wsRef.current?.close()
    }
  }, [connect, stopHeartbeat])
}
